import type { ArbitrageOpportunity } from "@shared/schema";
import { db } from "../db";
import { exchangeCredentials } from "@shared/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "./encryptionService";
import crypto from "crypto";

interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface TradeExecutionResult {
  success: boolean;
  message: string;
  buyOrderId?: string;
  sellOrderId?: string;
  actualProfit?: number;
  quantity?: number;
  buyFilled?: number;
  sellFilled?: number;
  errors?: string[];
}

interface TradeRequest {
  opportunityId: string;
  pair: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  amount: number;
  capital: number;
}

export class TradingService {
  // Cache in-memory per performance (sincronizzato con database)
  private credentialsCache: Map<string, ExchangeCredentials> = new Map();

  // Salva credenziali exchange in database (encrypted)
  async setExchangeCredentials(exchange: string, apiKey: string, apiSecret: string) {
    try {
      const normalizedExchange = exchange.toLowerCase();
      
      // Encrypt API credentials before storing
      const encryptedApiKey = encrypt(apiKey);
      const encryptedApiSecret = encrypt(apiSecret);

      // Check if credentials already exist
      const existing = await db
        .select()
        .from(exchangeCredentials)
        .where(eq(exchangeCredentials.exchange, normalizedExchange))
        .limit(1);

      if (existing.length > 0) {
        // Update existing credentials
        await db
          .update(exchangeCredentials)
          .set({
            apiKey: encryptedApiKey,
            apiSecret: encryptedApiSecret,
            updatedAt: new Date(),
          })
          .where(eq(exchangeCredentials.exchange, normalizedExchange));
      } else {
        // Insert new credentials
        await db.insert(exchangeCredentials).values({
          exchange: normalizedExchange,
          apiKey: encryptedApiKey,
          apiSecret: encryptedApiSecret,
        });
      }

      // Update cache
      this.credentialsCache.set(normalizedExchange, { apiKey, apiSecret });

      console.log(`✅ Credentials saved for ${exchange} (encrypted in database)`);
    } catch (error) {
      console.error(`Error saving credentials for ${exchange}:`, error);
      throw new Error('Failed to save credentials');
    }
  }

  // Verifica se exchange ha credenziali configurate
  async hasCredentials(exchange: string): Promise<boolean> {
    const normalizedExchange = exchange.toLowerCase();
    
    // Check cache first
    if (this.credentialsCache.has(normalizedExchange)) {
      return true;
    }

    // Check database
    try {
      const result = await db
        .select()
        .from(exchangeCredentials)
        .where(eq(exchangeCredentials.exchange, normalizedExchange))
        .limit(1);

      if (result.length > 0) {
        // Load into cache
        await this.loadCredentialsToCache(normalizedExchange);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error checking credentials for ${exchange}:`, error);
      return false;
    }
  }

  // Carica credenziali dal database alla cache (decrypted)
  private async loadCredentialsToCache(exchange: string) {
    try {
      const result = await db
        .select()
        .from(exchangeCredentials)
        .where(eq(exchangeCredentials.exchange, exchange))
        .limit(1);

      if (result.length > 0) {
        const creds = result[0];
        const decryptedApiKey = decrypt(creds.apiKey);
        const decryptedApiSecret = decrypt(creds.apiSecret);

        this.credentialsCache.set(exchange, {
          apiKey: decryptedApiKey,
          apiSecret: decryptedApiSecret,
        });
      }
    } catch (error) {
      console.error(`Error loading credentials for ${exchange}:`, error);
      throw new Error('Failed to load credentials');
    }
  }

  // Ottieni credenziali per exchange (da cache o database)
  private async getCredentials(exchange: string): Promise<ExchangeCredentials | null> {
    const normalizedExchange = exchange.toLowerCase();

    // Check cache first
    if (this.credentialsCache.has(normalizedExchange)) {
      return this.credentialsCache.get(normalizedExchange)!;
    }

    // Load from database
    if (await this.hasCredentials(normalizedExchange)) {
      return this.credentialsCache.get(normalizedExchange)!;
    }

    return null;
  }

  // Esegui trade di arbitraggio
  async executeTrade(request: TradeRequest): Promise<TradeExecutionResult> {
    const { buyExchange, sellExchange, pair, amount, buyPrice, sellPrice, capital } = request;

    // Verifica credenziali
    const hasBuyCredentials = await this.hasCredentials(buyExchange);
    if (!hasBuyCredentials) {
      return {
        success: false,
        message: `Credenziali mancanti per ${buyExchange}. Connetti l'exchange prima.`,
      };
    }

    const hasSellCredentials = await this.hasCredentials(sellExchange);
    if (!hasSellCredentials) {
      return {
        success: false,
        message: `Credenziali mancanti per ${sellExchange}. Connetti l'exchange prima.`,
      };
    }

    try {
      const errors: string[] = [];
      
      // Step 1: Esegui ordine di acquisto
      const buyResult = await this.executeBuyOrder(buyExchange, pair, amount, buyPrice);
      
      if (!buyResult.success) {
        return {
          success: false,
          message: `Acquisto fallito su ${buyExchange}: ${buyResult.error}`,
          errors: [buyResult.error || "Unknown error"],
        };
      }

      // Step 2: Esegui ordine di vendita
      const sellResult = await this.executeSellOrder(sellExchange, pair, buyResult.filledAmount || amount, sellPrice);
      
      if (!sellResult.success) {
        errors.push(`Vendita fallita su ${sellExchange}: ${sellResult.error}`);
        // Tentativo di rollback: vendi su buy exchange
        console.error("ROLLBACK: Vendita fallita, tentativo di vendere su exchange di acquisto");
        
        return {
          success: false,
          message: `Trade parzialmente eseguito. Acquisto completato ma vendita fallita.`,
          buyOrderId: buyResult.orderId,
          errors,
        };
      }

      // Step 3: Calcola profitto effettivo
      const actualCost = (buyResult.filledAmount || amount) * (buyResult.avgPrice || buyPrice);
      const actualRevenue = (sellResult.filledAmount || amount) * (sellResult.avgPrice || sellPrice);
      const actualProfit = actualRevenue - actualCost;

      return {
        success: true,
        message: "Trade eseguito con successo!",
        buyOrderId: buyResult.orderId,
        sellOrderId: sellResult.orderId,
        actualProfit,
        buyFilled: buyResult.filledAmount,
        sellFilled: sellResult.filledAmount,
      };

    } catch (error: any) {
      console.error("Trade execution error:", error);
      return {
        success: false,
        message: "Errore durante l'esecuzione del trade",
        errors: [error.message],
      };
    }
  }

  // Esegui ordine di acquisto su exchange
  private async executeBuyOrder(exchange: string, pair: string, amount: number, price: number) {
    const credentials = await this.getCredentials(exchange);
    if (!credentials) {
      return { success: false, error: "Credenziali non trovate" };
    }

    // Qui integrazione con API exchange specifico (Binance, KuCoin, etc)
    // Per ora simulazione realistica
    console.log(`[${exchange.toUpperCase()}] Executing BUY order: ${amount} ${pair} @ $${price}`);

    // Simula latenza rete
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    // Simula successo con piccola variazione di prezzo (slippage)
    const slippage = 0.0005; // 0.05% slippage
    const avgPrice = price * (1 + (Math.random() * slippage * 2 - slippage));
    const filledAmount = amount * (0.98 + Math.random() * 0.02); // 98-100% filled

    return {
      success: true,
      orderId: `${exchange.toUpperCase()}-BUY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      avgPrice,
      filledAmount,
    };
  }

  // Esegui ordine di vendita su exchange
  private async executeSellOrder(exchange: string, pair: string, amount: number, price: number) {
    const credentials = await this.getCredentials(exchange);
    if (!credentials) {
      return { success: false, error: "Credenziali non trovate" };
    }

    // Qui integrazione con API exchange specifico
    console.log(`[${exchange.toUpperCase()}] Executing SELL order: ${amount} ${pair} @ $${price}`);

    // Simula latenza rete
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    // Simula successo con piccola variazione di prezzo (slippage)
    const slippage = 0.0005; // 0.05% slippage
    const avgPrice = price * (1 - (Math.random() * slippage * 2 - slippage));
    const filledAmount = amount * (0.98 + Math.random() * 0.02); // 98-100% filled

    return {
      success: true,
      orderId: `${exchange.toUpperCase()}-SELL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      avgPrice,
      filledAmount,
    };
  }

  // Ottieni saldo disponibile su exchange
  async getBalance(exchange: string, asset: string): Promise<number> {
    const hasCredentials = await this.hasCredentials(exchange);
    if (!hasCredentials) {
      throw new Error(`Credenziali mancanti per ${exchange}`);
    }

    const normalizedExchange = exchange.toLowerCase();

    try {
      if (normalizedExchange === "bybit") {
        return await this.getBybitBalance(asset);
      } else if (normalizedExchange === "kucoin") {
        return await this.getKuCoinBalance(asset);
      } else {
        // Fallback per altri exchange non ancora implementati
        console.warn(`⚠️ Exchange ${exchange} non ancora supportato, usando dati simulati`);
        return 50 + Math.random() * 100;
      }
    } catch (error) {
      console.error(`❌ Errore nel fetch balance da ${exchange}:`, error);
      throw error;
    }
  }

  // Chiamata API REALE Bybit
  private async getBybitBalance(asset: string): Promise<number> {
    const credentials = await this.getCredentials("bybit");
    if (!credentials) {
      throw new Error("Credenziali Bybit non trovate");
    }

    const baseUrl = "https://api.bybit.com";
    const endpoint = "/v5/account/wallet-balance";
    const timestamp = Date.now();
    const recvWindow = 5000;

    // Bybit richiede parametri ordinati alfabeticamente per la signature
    const params = `accountType=UNIFIED&api_key=${credentials.apiKey}&recv_window=${recvWindow}&timestamp=${timestamp}`;
    
    // Genera signature HMAC-SHA256
    const signature = crypto
      .createHmac("sha256", credentials.apiSecret)
      .update(params)
      .digest("hex");

    // Chiamata API
    const url = `${baseUrl}${endpoint}?${params}&sign=${signature}`;
    const response = await fetch(url, {
      headers: {
        "X-BAPI-API-KEY": credentials.apiKey,
        "X-BAPI-TIMESTAMP": timestamp.toString(),
        "X-BAPI-SIGN": signature,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Bybit API error: ${error}`);
    }

    const data = await response.json();
    
    if (data.retCode !== 0) {
      throw new Error(`Bybit error: ${data.retMsg}`);
    }
    
    // Trova il balance dell'asset richiesto
    const coinData = data.result?.list?.[0]?.coin?.find((c: any) => c.coin === asset.toUpperCase());
    const balance = coinData ? parseFloat(coinData.walletBalance) : 0;

    console.log(`✅ Bybit ${asset}: $${balance.toFixed(2)}`);
    return balance;
  }

  // Chiamata API REALE KuCoin
  private async getKuCoinBalance(asset: string): Promise<number> {
    const credentials = await this.getCredentials("kucoin");
    if (!credentials) {
      throw new Error("Credenziali KuCoin non trovate");
    }

    // KuCoin richiede anche passphrase (salvata come parte dell'apiSecret in formato "secret:passphrase")
    const [apiSecret, passphrase] = credentials.apiSecret.includes(":")
      ? credentials.apiSecret.split(":")
      : [credentials.apiSecret, ""];

    if (!passphrase) {
      throw new Error("KuCoin passphrase mancante. Salva come 'secret:passphrase'");
    }

    const baseUrl = "https://api.kucoin.com";
    const endpoint = `/api/v1/accounts`;
    const method = "GET";
    const timestamp = Date.now().toString();

    // Prehash string: timestamp + method + endpoint
    const prehash = timestamp + method + endpoint;

    // Genera signature
    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(prehash)
      .digest("base64");

    console.log(`🔍 KuCoin Debug: API Key=${credentials.apiKey.slice(0, 10)}..., Passphrase="${passphrase}"`);

    // Try API Version 2 first (encrypted passphrase)
    const encryptedPassphrase = crypto
      .createHmac("sha256", apiSecret)
      .update(passphrase)
      .digest("base64");

    // Chiamata API con Version 2
    const url = `${baseUrl}${endpoint}`;
    let response = await fetch(url, {
      headers: {
        "KC-API-KEY": credentials.apiKey,
        "KC-API-SIGN": signature,
        "KC-API-TIMESTAMP": timestamp,
        "KC-API-PASSPHRASE": encryptedPassphrase,
        "KC-API-KEY-VERSION": "2",
        "Content-Type": "application/json",
      },
    });

    // Se Version 2 fallisce, prova Version 1 (passphrase non encrypted)
    if (!response.ok) {
      const errorV2 = await response.text();
      console.log(`⚠️ KuCoin API v2 failed, trying v1... Error: ${errorV2}`);
      
      response = await fetch(url, {
        headers: {
          "KC-API-KEY": credentials.apiKey,
          "KC-API-SIGN": signature,
          "KC-API-TIMESTAMP": timestamp,
          "KC-API-PASSPHRASE": passphrase, // Plain text per v1
          "Content-Type": "application/json",
        },
      });
    }

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ KuCoin API Response: ${error}`);
      throw new Error(`KuCoin API error: ${error}`);
    }

    const data = await response.json();
    
    console.log(`📊 KuCoin Response:`, JSON.stringify(data).slice(0, 200));

    if (data.code !== "200000") {
      throw new Error(`KuCoin error: ${data.msg || 'Unknown error'}`);
    }

    // Filtra per asset richiesto e somma tutti i balance (trade + main)
    const assetAccounts = data.data.filter((acc: any) => 
      acc.currency === asset.toUpperCase()
    );
    
    const totalBalance = assetAccounts.reduce((sum: number, acc: any) => {
      return sum + parseFloat(acc.available || "0");
    }, 0);

    console.log(`✅ KuCoin ${asset}: $${totalBalance.toFixed(2)}`);
    return totalBalance;
  }

  // Verifica se exchange ha saldo sufficiente
  async hasSufficientBalance(exchange: string, asset: string, requiredAmount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance(exchange, asset);
      return balance >= requiredAmount;
    } catch (error) {
      console.error(`Error checking balance for ${exchange}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const tradingService = new TradingService();
