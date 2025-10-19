import { db } from "../db";
import { botConfig, tradeExecutions } from "@shared/schema";
import type { ArbitrageOpportunity } from "@shared/schema";
import { tradingService } from "./tradingService";
import { eq } from "drizzle-orm";

class BotService {
  private isRunning: boolean = false;
  private consecutiveLosses: number = 0;
  private tradesExecutedToday: number = 0;
  private profitToday: number = 0;
  private lastTradeTime: number = 0;
  private dailyResetInterval: NodeJS.Timeout | null = null;

  async initialize() {
    // Initialize bot config if not exists
    const configs = await db.select().from(botConfig).limit(1);
    if (configs.length === 0) {
      await db.insert(botConfig).values({
        enabled: false,
        mode: "conservative",
        minProfitPercent: 1.0,
        maxDailyTrades: 20,
        maxDailyProfit: 50,
      });
    }

    // Reset daily stats at midnight
    this.dailyResetInterval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.resetDailyStats();
      }
    }, 60000); // Check every minute

    console.log("🤖 Bot Service initialized");
  }

  private resetDailyStats() {
    this.tradesExecutedToday = 0;
    this.profitToday = 0;
    console.log("🔄 Daily bot stats reset");
  }

  async getConfig() {
    const configs = await db.select().from(botConfig).limit(1);
    return configs[0] || null;
  }

  async updateConfig(updates: Partial<typeof botConfig.$inferInsert>) {
    const configs = await db.select().from(botConfig).limit(1);
    if (configs.length > 0) {
      await db.update(botConfig).set({
        ...updates,
        updatedAt: new Date(),
      }).where(eq(botConfig.id, configs[0].id));
    }
    return this.getConfig();
  }

  async evaluateOpportunity(opportunity: ArbitrageOpportunity): Promise<boolean> {
    const config = await this.getConfig();
    if (!config || !config.enabled) return false;

    // Check profit threshold
    if (opportunity.netProfitPercentage < config.minProfitPercent!) return false;

    // Check trading hours
    const currentHour = new Date().getHours();
    if (currentHour < config.tradingHoursStart! || currentHour > config.tradingHoursEnd!) {
      return false;
    }

    // Check daily limits
    if (this.tradesExecutedToday >= config.maxDailyTrades!) return false;
    if (this.profitToday >= config.maxDailyProfit!) {
      console.log(`🎯 Daily profit target reached: $${this.profitToday.toFixed(2)}`);
      return false;
    }

    // Check cooldown
    const now = Date.now();
    if (now - this.lastTradeTime < config.cooldownSeconds! * 1000) {
      return false;
    }

    // Check consecutive losses
    if (this.consecutiveLosses >= config.stopOnConsecutiveLosses!) {
      console.log(`⚠️ Stopping bot due to ${this.consecutiveLosses} consecutive losses`);
      await this.updateConfig({ enabled: false });
      return false;
    }

    // Check whitelist/blacklist
    if (config.whitelistExchanges) {
      const whitelist = JSON.parse(config.whitelistExchanges);
      if (!whitelist.includes(opportunity.buyExchange) || !whitelist.includes(opportunity.sellExchange)) {
        return false;
      }
    }

    if (config.blacklistExchanges) {
      const blacklist = JSON.parse(config.blacklistExchanges);
      if (blacklist.includes(opportunity.buyExchange) || blacklist.includes(opportunity.sellExchange)) {
        return false;
      }
    }

    return true;
  }

  async executeAutomaticTrade(opportunity: ArbitrageOpportunity, capital: number = 100) {
    const config = await this.getConfig();
    if (!config || !config.enabled) {
      return { success: false, message: "Bot is not enabled" };
    }

    try {
      // Calculate position size based on config
      const positionSize = (capital * config.positionSizePercent!) / 100;

      // Execute trade via trading service
      const result = await tradingService.executeTrade({
        opportunityId: opportunity.id,
        pair: opportunity.pair,
        buyExchange: opportunity.buyExchange,
        sellExchange: opportunity.sellExchange,
        buyPrice: opportunity.buyPrice,
        sellPrice: opportunity.sellPrice,
        amount: positionSize / opportunity.buyPrice,
        capital: positionSize,
      });

      // Log to database
      await db.insert(tradeExecutions).values({
        opportunityId: opportunity.id,
        pair: opportunity.pair,
        buyExchange: opportunity.buyExchange,
        sellExchange: opportunity.sellExchange,
        buyPrice: opportunity.buyPrice,
        sellPrice: opportunity.sellPrice,
        quantity: result.quantity || 0,
        capitalUsed: positionSize,
        estimatedProfit: opportunity.netProfitUsd,
        actualProfit: result.actualProfit || null,
        status: result.success ? "completed" : "failed",
        executionType: "auto",
        buyOrderId: result.buyOrderId,
        sellOrderId: result.sellOrderId,
        errorMessage: result.message,
      });

      // Update stats
      this.tradesExecutedToday++;
      this.lastTradeTime = Date.now();

      if (result.success) {
        const profit = result.actualProfit || opportunity.netProfitUsd;
        this.profitToday += profit;
        this.consecutiveLosses = 0;

        // Alert would be sent here (alertService integration)
        console.log(`✅ Trade completed: ${opportunity.pair} - $${profit.toFixed(2)}`);
      } else {
        this.consecutiveLosses++;
        console.log(`❌ Trade failed: ${opportunity.pair} - ${result.message}`);
      }

      return result;
    } catch (error: any) {
      console.error("Bot execution error:", error);
      this.consecutiveLosses++;
      return { success: false, message: error.message };
    }
  }

  async getStats() {
    const config = await this.getConfig();
    
    // Get today's trades from database
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = await db.select()
      .from(tradeExecutions)
      .where(eq(tradeExecutions.executionType, "auto"));

    const completedTrades = todayTrades.filter(t => t.status === "completed");
    const failedTrades = todayTrades.filter(t => t.status === "failed");

    return {
      enabled: config?.enabled || false,
      mode: config?.mode || "conservative",
      tradesExecutedToday: this.tradesExecutedToday,
      profitToday: this.profitToday,
      consecutiveLosses: this.consecutiveLosses,
      totalTrades: todayTrades.length,
      completedTrades: completedTrades.length,
      failedTrades: failedTrades.length,
      winRate: completedTrades.length > 0 
        ? (completedTrades.length / todayTrades.length) * 100 
        : 0,
      dailyLimit: config?.maxDailyProfit || 50,
      remainingTrades: Math.max(0, (config?.maxDailyTrades || 20) - this.tradesExecutedToday),
    };
  }

  stop() {
    if (this.dailyResetInterval) {
      clearInterval(this.dailyResetInterval);
    }
  }
}

export const botService = new BotService();
