import { db } from "../db";
import { aiPredictions, detectedPatterns, opportunityHistory, tradeExecutions } from "@shared/schema";
import { desc, gte, and, eq } from "drizzle-orm";
import type { ArbitrageOpportunity } from "@shared/schema";

class AIService {
  // Simple moving average based prediction
  async generatePricePrediction(pair: string, currentPrice: number) {
    try {
      // Get historical prices from opportunities
      const historical = await db.select()
        .from(opportunityHistory)
        .where(eq(opportunityHistory.pair, pair))
        .orderBy(desc(opportunityHistory.timestamp))
        .limit(24); // Last 24 data points

      if (historical.length < 5) {
        // Not enough data for prediction
        return null;
      }

      // Calculate simple predictions based on trends
      const prices = historical.map(h => (h.buyPrice + h.sellPrice) / 2);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      // Simple trend detection
      const recentPrices = prices.slice(0, 6);
      const olderPrices = prices.slice(6, 12);
      const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
      const olderAvg = olderPrices.length > 0 ? olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length : recentAvg;

      const trend = recentAvg - olderAvg;
      const trendPercent = (trend / olderAvg) * 100;

      // Predict future prices with trend
      const predicted1h = currentPrice + (trend * 0.1);
      const predicted6h = currentPrice + (trend * 0.5);
      const predicted24h = currentPrice + (trend * 1.2);

      // Confidence based on data quality
      const confidence = Math.min(0.95, historical.length / 24);

      const prediction = {
        pair,
        currentPrice,
        predicted1h,
        predicted6h,
        predicted24h,
        confidence,
        modelVersion: "simple_ma_v1",
      };

      // Save to database
      await db.insert(aiPredictions).values(prediction);

      return prediction;
    } catch (error) {
      console.error("Prediction error:", error);
      return null;
    }
  }

  async detectPatterns() {
    try {
      const patterns: any[] = [];

      // Pattern 1: Recurring high-spread times
      await this.detectTimeBasedPatterns(patterns);

      // Pattern 2: Exchange-specific opportunities
      await this.detectExchangePatterns(patterns);

      // Pattern 3: Pair-specific patterns
      await this.detectPairPatterns(patterns);

      // Save detected patterns
      for (const pattern of patterns) {
        await db.insert(detectedPatterns).values(pattern);
      }

      return patterns;
    } catch (error) {
      console.error("Pattern detection error:", error);
      return [];
    }
  }

  private async detectTimeBasedPatterns(patterns: any[]) {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const opportunities = await db.select()
      .from(opportunityHistory)
      .where(gte(opportunityHistory.timestamp, last30Days));

    // Group by hour of day
    const hourlyStats: Record<number, { count: number; avgProfit: number; totalProfit: number }> = {};
    
    for (const opp of opportunities) {
      const hour = new Date(opp.timestamp).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { count: 0, avgProfit: 0, totalProfit: 0 };
      }
      hourlyStats[hour].count++;
      hourlyStats[hour].totalProfit += opp.netProfitPercentage;
    }

    // Calculate averages and find best hours
    for (const hour in hourlyStats) {
      const stats = hourlyStats[hour];
      stats.avgProfit = stats.totalProfit / stats.count;

      // If this hour consistently has good opportunities
      if (stats.count >= 10 && stats.avgProfit >= 1.5) {
        patterns.push({
          patternType: "high_activity_hour",
          description: `Opportunità elevate alle ore ${hour}:00 - Media: ${stats.avgProfit.toFixed(2)}%`,
          confidence: Math.min(0.9, stats.count / 50),
          expectedProfitPercent: stats.avgProfit,
          timeframe: "hourly",
          occurrences: stats.count,
        });
      }
    }
  }

  private async detectExchangePatterns(patterns: any[]) {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const opportunities = await db.select()
      .from(opportunityHistory)
      .where(gte(opportunityHistory.timestamp, last30Days));

    // Group by exchange pair
    const exchangePairs: Record<string, { count: number; avgProfit: number }> = {};

    for (const opp of opportunities) {
      const key = `${opp.buyExchange}-${opp.sellExchange}`;
      if (!exchangePairs[key]) {
        exchangePairs[key] = { count: 0, avgProfit: 0 };
      }
      exchangePairs[key].count++;
      exchangePairs[key].avgProfit += opp.netProfitPercentage;
    }

    for (const key in exchangePairs) {
      const stats = exchangePairs[key];
      stats.avgProfit = stats.avgProfit / stats.count;

      if (stats.count >= 15 && stats.avgProfit >= 1.2) {
        const [buy, sell] = key.split("-");
        patterns.push({
          patternType: "profitable_exchange_pair",
          exchange: key,
          description: `${buy} → ${sell} consistentemente profittevole: ${stats.avgProfit.toFixed(2)}%`,
          confidence: Math.min(0.85, stats.count / 30),
          expectedProfitPercent: stats.avgProfit,
          timeframe: "daily",
          occurrences: stats.count,
        });
      }
    }
  }

  private async detectPairPatterns(patterns: any[]) {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const opportunities = await db.select()
      .from(opportunityHistory)
      .where(gte(opportunityHistory.timestamp, last30Days));

    // Group by crypto pair
    const pairStats: Record<string, { count: number; avgProfit: number; maxProfit: number }> = {};

    for (const opp of opportunities) {
      if (!pairStats[opp.pair]) {
        pairStats[opp.pair] = { count: 0, avgProfit: 0, maxProfit: 0 };
      }
      pairStats[opp.pair].count++;
      pairStats[opp.pair].avgProfit += opp.netProfitPercentage;
      pairStats[opp.pair].maxProfit = Math.max(pairStats[opp.pair].maxProfit, opp.netProfitPercentage);
    }

    for (const pair in pairStats) {
      const stats = pairStats[pair];
      stats.avgProfit = stats.avgProfit / stats.count;

      if (stats.count >= 20 && stats.avgProfit >= 1.0) {
        patterns.push({
          patternType: "high_volatility_pair",
          pair,
          description: `${pair} frequenti opportunità: ${stats.avgProfit.toFixed(2)}% medio, ${stats.maxProfit.toFixed(2)}% max`,
          confidence: Math.min(0.9, stats.count / 40),
          expectedProfitPercent: stats.avgProfit,
          timeframe: "daily",
          occurrences: stats.count,
        });
      }
    }
  }

  async getRecommendations(opportunities: ArbitrageOpportunity[]) {
    // Get recent patterns
    const patterns = await db.select()
      .from(detectedPatterns)
      .orderBy(desc(detectedPatterns.confidence))
      .limit(10);

    const recommendations: string[] = [];

    // Analyze current opportunities against patterns
    for (const pattern of patterns) {
      if (pattern.patternType === "high_activity_hour") {
        const currentHour = new Date().getHours();
        const patternHour = parseInt(pattern.description.match(/ore (\d+)/)?.[1] || "0");
        
        if (currentHour === patternHour) {
          recommendations.push(`🎯 Ora ideale per trading! Pattern rilevato: ${pattern.description}`);
        }
      }

      if (pattern.patternType === "profitable_exchange_pair") {
        const matchingOpps = opportunities.filter(o => 
          `${o.buyExchange}-${o.sellExchange}` === pattern.exchange
        );
        
        if (matchingOpps.length > 0) {
          recommendations.push(`✨ ${matchingOpps.length} opportunità su coppia profittevole: ${pattern.description}`);
        }
      }

      if (pattern.patternType === "high_volatility_pair") {
        const matchingOpps = opportunities.filter(o => o.pair === pattern.pair);
        
        if (matchingOpps.length > 0) {
          recommendations.push(`📈 ${pattern.pair} ha ${matchingOpps.length} opportunità - Coppia ad alta resa!`);
        }
      }
    }

    // General recommendations
    if (opportunities.length > 0) {
      const avgProfit = opportunities.reduce((sum, o) => sum + o.netProfitPercentage, 0) / opportunities.length;
      const bestOpp = opportunities.reduce((best, o) => o.netProfitPercentage > best.netProfitPercentage ? o : best);

      if (avgProfit > 2) {
        recommendations.push(`🔥 Mercato molto favorevole! Profitto medio: ${avgProfit.toFixed(2)}%`);
      }

      if (bestOpp.netProfitPercentage > 3) {
        recommendations.push(`💎 Opportunità GOLD: ${bestOpp.pair} ${bestOpp.netProfitPercentage.toFixed(2)}% su ${bestOpp.buyExchange}-${bestOpp.sellExchange}`);
      }
    }

    return recommendations;
  }

  async getLatestPredictions(limit: number = 10) {
    return db.select()
      .from(aiPredictions)
      .orderBy(desc(aiPredictions.createdAt))
      .limit(limit);
  }

  async getDetectedPatterns(limit: number = 20) {
    return db.select()
      .from(detectedPatterns)
      .orderBy(desc(detectedPatterns.confidence))
      .limit(limit);
  }
}

export const aiService = new AIService();
