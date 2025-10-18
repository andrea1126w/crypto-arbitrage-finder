import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { priceService } from "./services/priceService";
import { arbitrageEngine } from "./services/arbitrageEngine";
import { SUPPORTED_EXCHANGES, SUPPORTED_PAIRS } from "@shared/schema";
import { tradingService } from "./services/tradingService";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/opportunities", async (req, res) => {
    try {
      const opportunities = await storage.getOpportunities();
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  app.get("/api/exchanges", async (req, res) => {
    try {
      res.json(SUPPORTED_EXCHANGES);
    } catch (error) {
      console.error("Error fetching exchanges:", error);
      res.status(500).json({ error: "Failed to fetch exchanges" });
    }
  });

  app.get("/api/pairs", async (req, res) => {
    try {
      res.json(SUPPORTED_PAIRS);
    } catch (error) {
      console.error("Error fetching pairs:", error);
      res.status(500).json({ error: "Failed to fetch pairs" });
    }
  });

  app.get("/api/history", async (req, res) => {
    try {
      const { limit, startDate, endDate, pair, minProfit } = req.query;
      
      const options = {
        limit: limit ? parseInt(limit as string) : 100,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        pair: pair as string | undefined,
        minProfit: minProfit ? parseFloat(minProfit as string) : undefined,
      };

      const history = await storage.getOpportunityHistory(options);
      res.json(history);
    } catch (error) {
      console.error("Error fetching opportunity history:", error);
      res.status(500).json({ error: "Failed to fetch opportunity history" });
    }
  });

  app.get("/api/history/stats", async (req, res) => {
    try {
      const stats = await storage.getHistoryStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching history stats:", error);
      res.status(500).json({ error: "Failed to fetch history stats" });
    }
  });

  // Execute arbitrage trade
  app.post("/api/execute-trade", async (req, res) => {
    try {
      const { opportunityId, pair, buyExchange, sellExchange, buyPrice, sellPrice, amount, capital } = req.body;

      if (!pair || !buyExchange || !sellExchange || !amount) {
        return res.status(400).json({ 
          success: false,
          message: "Parametri mancanti: pair, buyExchange, sellExchange, amount richiesti" 
        });
      }

      const result = await tradingService.executeTrade({
        opportunityId,
        pair,
        buyExchange,
        sellExchange,
        buyPrice,
        sellPrice,
        amount,
        capital: capital || 100,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error executing trade:", error);
      res.status(500).json({ 
        success: false,
        message: "Errore durante l'esecuzione del trade",
        errors: [error.message],
      });
    }
  });

  // Connect exchange (save API credentials)
  app.post("/api/connect-exchange", async (req, res) => {
    try {
      const { exchange, apiKey, apiSecret } = req.body;

      if (!exchange || !apiKey || !apiSecret) {
        return res.status(400).json({ 
          success: false,
          message: "Parametri mancanti: exchange, apiKey, apiSecret richiesti" 
        });
      }

      tradingService.setExchangeCredentials(exchange, apiKey, apiSecret);

      res.json({ 
        success: true,
        message: `${exchange} connesso con successo`,
      });
    } catch (error: any) {
      console.error("Error connecting exchange:", error);
      res.status(500).json({ 
        success: false,
        message: "Errore durante la connessione",
      });
    }
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    const initialData = {
      type: 'connection_established',
      message: 'Connected to Crypto Arbitrage Finder',
    };
    ws.send(JSON.stringify(initialData));
  });

  async function updatePricesAndBroadcast() {
    try {
      console.log('Fetching prices...');
      const pricesByPair = await priceService.fetchPrices();
      
      console.log('Calculating opportunities...');
      const opportunities = arbitrageEngine.calculateOpportunities(pricesByPair, 100);
      
      storage.setOpportunities(opportunities);
      
      // Save profitable opportunities to database history
      const profitableOpportunities = opportunities.filter(o => o.netProfitUsd > 0);
      for (const opp of profitableOpportunities) {
        try {
          await storage.saveOpportunityToHistory({
            pair: opp.pair,
            buyExchange: opp.buyExchange,
            sellExchange: opp.sellExchange,
            buyPrice: opp.buyPrice,
            sellPrice: opp.sellPrice,
            spreadPercentage: opp.spreadPercentage,
            grossProfitUsd: opp.grossProfitUsd,
            tradingFees: opp.tradingFees,
            networkFees: opp.networkFees,
            slippage: opp.slippage,
            netProfitUsd: opp.netProfitUsd,
            netProfitPercentage: opp.netProfitPercentage,
            executed: false,
          });
        } catch (saveError) {
          console.error('Error saving opportunity to history:', saveError);
        }
      }
      
      const profitableCount = profitableOpportunities.length;
      console.log(`Found ${opportunities.length} opportunities (${profitableCount} profitable, saved to history)`);

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'opportunities_update',
            count: opportunities.length,
            profitableCount,
            opportunities: opportunities.slice(0, 20),
            timestamp: Date.now(),
          }));
        }
      });
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  }

  updatePricesAndBroadcast();

  setInterval(updatePricesAndBroadcast, 30000);

  return httpServer;
}
