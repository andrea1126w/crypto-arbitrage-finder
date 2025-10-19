import { db } from "../db";
import { portfolioMetrics, tradeExecutions, opportunityHistory } from "@shared/schema";
import { eq, gte, and, sql, desc } from "drizzle-orm";

class AnalyticsService {
  async calculateDailyMetrics(date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all trades for the day
    const trades = await db.select()
      .from(tradeExecutions)
      .where(
        and(
          gte(tradeExecutions.executedAt, startOfDay),
          sql`${tradeExecutions.executedAt} <= ${endOfDay}`
        )
      );

    if (trades.length === 0) {
      return null;
    }

    const completedTrades = trades.filter(t => t.status === "completed");
    const winningTrades = completedTrades.filter(t => (t.actualProfit || 0) > 0);
    const losingTrades = completedTrades.filter(t => (t.actualProfit || 0) < 0);

    const totalProfit = completedTrades.reduce((sum, t) => sum + (t.actualProfit || 0), 0);
    const avgProfitPerTrade = completedTrades.length > 0 ? totalProfit / completedTrades.length : 0;

    const profits = completedTrades.map(t => t.actualProfit || 0);
    const bestTrade = profits.length > 0 ? Math.max(...profits) : 0;
    const worstTrade = profits.length > 0 ? Math.min(...profits) : 0;

    const winRate = completedTrades.length > 0 
      ? (winningTrades.length / completedTrades.length) * 100 
      : 0;

    // Calculate Sharpe Ratio (simplified)
    const returns = profits.filter(p => p !== 0);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = this.calculateStdDev(returns);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Calculate Max Drawdown
    const maxDrawdown = this.calculateMaxDrawdown(trades);

    // Strategy breakdown (simplified - could be enhanced with actual strategy tracking)
    const arbitrageProfits = totalProfit; // Most trades are arbitrage
    const yieldFarmingProfits = 0; // Would need separate tracking
    const flashLoanProfits = 0; // Would need separate tracking

    const metrics = {
      date: startOfDay,
      totalCapital: 100, // Could be tracked separately
      totalProfit,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      avgProfitPerTrade,
      bestTrade,
      worstTrade,
      winRate,
      sharpeRatio,
      maxDrawdown,
      arbitrageProfits,
      yieldFarmingProfits,
      flashLoanProfits,
    };

    // Save to database
    await db.insert(portfolioMetrics).values(metrics);

    return metrics;
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  private calculateMaxDrawdown(trades: any[]): number {
    if (trades.length === 0) return 0;
    
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    for (const trade of trades) {
      cumulative += trade.actualProfit || 0;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  async getPerformanceStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await db.select()
      .from(portfolioMetrics)
      .where(gte(portfolioMetrics.date, startDate))
      .orderBy(desc(portfolioMetrics.date));

    const totalProfit = metrics.reduce((sum, m) => sum + m.totalProfit, 0);
    const totalTrades = metrics.reduce((sum, m) => sum + m.totalTrades, 0);
    const avgWinRate = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.winRate, 0) / metrics.length 
      : 0;

    return {
      totalProfit,
      totalTrades,
      avgWinRate,
      metricsCount: metrics.length,
      metrics: metrics.slice(0, 30), // Last 30 days
    };
  }

  async getExchangePerformance() {
    const trades = await db.select().from(tradeExecutions);
    
    const exchangeStats: Record<string, any> = {};

    for (const trade of trades) {
      if (!exchangeStats[trade.buyExchange]) {
        exchangeStats[trade.buyExchange] = {
          exchange: trade.buyExchange,
          trades: 0,
          profit: 0,
          wins: 0,
        };
      }
      if (!exchangeStats[trade.sellExchange]) {
        exchangeStats[trade.sellExchange] = {
          exchange: trade.sellExchange,
          trades: 0,
          profit: 0,
          wins: 0,
        };
      }

      exchangeStats[trade.buyExchange].trades++;
      exchangeStats[trade.sellExchange].trades++;

      const profit = trade.actualProfit || 0;
      exchangeStats[trade.buyExchange].profit += profit / 2;
      exchangeStats[trade.sellExchange].profit += profit / 2;

      if (profit > 0) {
        exchangeStats[trade.buyExchange].wins++;
        exchangeStats[trade.sellExchange].wins++;
      }
    }

    return Object.values(exchangeStats).map((stat: any) => ({
      ...stat,
      winRate: stat.trades > 0 ? (stat.wins / stat.trades) * 100 : 0,
    }));
  }

  async getPairPerformance() {
    const trades = await db.select().from(tradeExecutions);
    
    const pairStats: Record<string, any> = {};

    for (const trade of trades) {
      if (!pairStats[trade.pair]) {
        pairStats[trade.pair] = {
          pair: trade.pair,
          trades: 0,
          profit: 0,
          wins: 0,
        };
      }

      pairStats[trade.pair].trades++;
      pairStats[trade.pair].profit += trade.actualProfit || 0;
      if ((trade.actualProfit || 0) > 0) {
        pairStats[trade.pair].wins++;
      }
    }

    return Object.values(pairStats).map((stat: any) => ({
      ...stat,
      winRate: stat.trades > 0 ? (stat.wins / stat.trades) * 100 : 0,
    }));
  }
}

export const analyticsService = new AnalyticsService();
