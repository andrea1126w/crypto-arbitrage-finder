import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { priceService } from "./services/priceService";
import { arbitrageEngine } from "./services/arbitrageEngine";
import { SUPPORTED_EXCHANGES, SUPPORTED_PAIRS } from "@shared/schema";

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
      
      const profitableCount = opportunities.filter(o => o.netProfitUsd > 0).length;
      console.log(`Found ${opportunities.length} opportunities (${profitableCount} profitable)`);

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
