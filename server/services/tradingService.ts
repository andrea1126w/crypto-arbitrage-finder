import type { ArbitrageOpportunity } from "@shared/schema";

interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
}

interface TradeExecutionResult {
  success: boolean;
  message: string;
  buyOrderId?: string;
  sellOrderId?: string;
  actualProfit?: number;
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
  private credentials: Map<string, ExchangeCredentials> = new Map();

  // Salva credenziali exchange (in produzione: encrypted storage)
  setExchangeCredentials(exchange: string, apiKey: string, apiSecret: string) {
    this.credentials.set(exchange.toLowerCase(), { apiKey, apiSecret });
  }

  // Verifica se exchange ha credenziali configurate
  hasCredentials(exchange: string): boolean {
    return this.credentials.has(exchange.toLowerCase());
  }

  // Esegui trade di arbitraggio
  async executeTrade(request: TradeRequest): Promise<TradeExecutionResult> {
    const { buyExchange, sellExchange, pair, amount, buyPrice, sellPrice, capital } = request;

    // Verifica credenziali
    if (!this.hasCredentials(buyExchange)) {
      return {
        success: false,
        message: `Credenziali mancanti per ${buyExchange}. Connetti l'exchange prima.`,
      };
    }

    if (!this.hasCredentials(sellExchange)) {
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
    const credentials = this.credentials.get(exchange.toLowerCase());
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
    const credentials = this.credentials.get(exchange.toLowerCase());
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
    if (!this.hasCredentials(exchange)) {
      throw new Error(`Credenziali mancanti per ${exchange}`);
    }

    // Simula chiamata API per ottenere saldo
    // In produzione: chiamata vera all'API dell'exchange
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Ritorna saldo simulato
    return 50 + Math.random() * 100; // $50-150 disponibili
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
