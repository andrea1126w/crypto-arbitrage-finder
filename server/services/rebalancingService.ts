import type { ArbitrageOpportunity } from "@shared/schema";
import { tradingService } from "./tradingService";

interface ExchangeBalance {
  exchange: string;
  balance: number;
  opportunityCount: number;
  avgProfitPercent: number;
}

class RebalancingService {
  async analyzeCapitalDistribution(
    opportunities: ArbitrageOpportunity[],
    totalCapital: number = 100
  ) {
    // Count opportunities per exchange
    const exchangeStats: Record<string, { count: number; totalProfit: number }> = {};

    for (const opp of opportunities) {
      // Count both buy and sell exchanges
      if (!exchangeStats[opp.buyExchange]) {
        exchangeStats[opp.buyExchange] = { count: 0, totalProfit: 0 };
      }
      if (!exchangeStats[opp.sellExchange]) {
        exchangeStats[opp.sellExchange] = { count: 0, totalProfit: 0 };
      }

      exchangeStats[opp.buyExchange].count++;
      exchangeStats[opp.sellExchange].count++;
      exchangeStats[opp.buyExchange].totalProfit += opp.netProfitPercentage;
      exchangeStats[opp.sellExchange].totalProfit += opp.netProfitPercentage;
    }

    // Calculate suggested distribution
    const balances: ExchangeBalance[] = [];
    const totalOpportunities = opportunities.length;

    for (const exchange in exchangeStats) {
      const stats = exchangeStats[exchange];
      const avgProfit = stats.count > 0 ? stats.totalProfit / stats.count : 0;
      
      // Weight by both opportunity count and average profit
      const opportunityWeight = stats.count / (totalOpportunities * 2); // Divided by 2 because each opp counts twice
      const profitWeight = avgProfit / 10; // Normalize profit percentage
      const combinedWeight = (opportunityWeight + profitWeight) / 2;

      const suggestedBalance = totalCapital * combinedWeight;

      balances.push({
        exchange,
        balance: suggestedBalance,
        opportunityCount: stats.count,
        avgProfitPercent: avgProfit,
      });
    }

    // Ensure total doesn't exceed capital (normalize if needed)
    const totalSuggested = balances.reduce((sum, b) => sum + b.balance, 0);
    if (totalSuggested > totalCapital) {
      const ratio = totalCapital / totalSuggested;
      balances.forEach(b => b.balance *= ratio);
    }

    // Sort by suggested balance (descending)
    balances.sort((a, b) => b.balance - a.balance);

    return {
      balances,
      recommendations: this.generateRecommendations(balances, totalCapital),
    };
  }

  private generateRecommendations(balances: ExchangeBalance[], totalCapital: number): string[] {
    const recommendations: string[] = [];

    // Find top exchanges
    const topExchanges = balances.slice(0, 3);
    
    if (topExchanges.length > 0) {
      const topExchange = topExchanges[0];
      const percentage = (topExchange.balance / totalCapital) * 100;
      
      recommendations.push(
        `🎯 Allocare ${percentage.toFixed(1)}% ($${topExchange.balance.toFixed(2)}) su ${topExchange.exchange} (${topExchange.opportunityCount} opportunità, ${topExchange.avgProfitPercent.toFixed(2)}% medio)`
      );
    }

    // Suggest minimal allocation for low-opportunity exchanges
    const lowOpportunityExchanges = balances.filter(b => b.opportunityCount < 5);
    if (lowOpportunityExchanges.length > 0) {
      recommendations.push(
        `⚠️ ${lowOpportunityExchanges.map(e => e.exchange).join(", ")} hanno poche opportunità - considera ridurre capitale`
      );
    }

    // Suggest concentration on profitable exchanges
    const highProfitExchanges = balances.filter(b => b.avgProfitPercent > 2);
    if (highProfitExchanges.length > 0) {
      recommendations.push(
        `💰 Focus su: ${highProfitExchanges.map(e => e.exchange).join(", ")} - profitto medio ${highProfitExchanges[0]?.avgProfitPercent.toFixed(2)}%+`
      );
    }

    return recommendations;
  }

  calculateOptimalPositionSize(
    opportunity: ArbitrageOpportunity,
    availableCapital: number,
    mode: "conservative" | "aggressive" = "conservative"
  ): number {
    // Base position size on profit potential and mode
    const basePercent = mode === "aggressive" ? 20 : 10;
    
    // Scale up for higher profit opportunities
    const profitMultiplier = Math.min(2, opportunity.netProfitPercentage / 2);
    
    const positionPercent = basePercent * profitMultiplier;
    const positionSize = (availableCapital * positionPercent) / 100;

    // Cap at 50% of available capital for safety
    return Math.min(positionSize, availableCapital * 0.5);
  }

  async getStrategyAllocation(
    arbitrageProfitPotential: number,
    yieldFarmingAPY: number = 6.5,
    flashLoanPotential: number,
    totalCapital: number = 100
  ) {
    // Calculate daily returns for each strategy
    const arbitrageDailyReturn = arbitrageProfitPotential; // Already daily
    const yieldDailyReturn = (yieldFarmingAPY / 365) * (totalCapital / 100); // APY to daily
    const flashLoanDailyReturn = flashLoanPotential; // Already daily

    const totalDailyReturn = arbitrageDailyReturn + yieldDailyReturn + flashLoanDailyReturn;

    // Allocate based on potential returns
    const arbitrageAllocation = (arbitrageDailyReturn / totalDailyReturn) * totalCapital;
    const yieldAllocation = (yieldDailyReturn / totalDailyReturn) * totalCapital;
    const flashLoanAllocation = 0; // Flash loans don't need capital allocation

    // Minimum allocations
    const minYield = totalCapital * 0.2; // At least 20% in yield farming
    const minArbitrage = totalCapital * 0.5; // At least 50% in arbitrage

    return {
      arbitrage: Math.max(minArbitrage, arbitrageAllocation),
      yieldFarming: Math.max(minYield, yieldAllocation),
      flashLoans: 0, // Uses borrowed capital
      reserve: totalCapital - Math.max(minArbitrage, arbitrageAllocation) - Math.max(minYield, yieldAllocation),
      recommendations: [
        `💼 Arbitraggio: $${Math.max(minArbitrage, arbitrageAllocation).toFixed(2)} - Rendimento stimato: $${(arbitrageDailyReturn * 30).toFixed(2)}/mese`,
        `🌾 Yield Farming: $${Math.max(minYield, yieldAllocation).toFixed(2)} - Rendimento: $${(yieldDailyReturn * 30).toFixed(2)}/mese`,
        `⚡ Flash Loans: $0 capitale (usa prestiti) - Rendimento: $${(flashLoanDailyReturn * 30).toFixed(2)}/mese`,
      ],
    };
  }

  async shouldRebalance(
    currentBalances: Record<string, number>,
    suggestedBalances: ExchangeBalance[]
  ): Promise<{ shouldRebalance: boolean; moves: Array<{ from: string; to: string; amount: number }> }> {
    const moves: Array<{ from: string; to: string; amount: number }> = [];
    const threshold = 0.15; // 15% deviation threshold

    for (const suggested of suggestedBalances) {
      const current = currentBalances[suggested.exchange] || 0;
      const deviation = Math.abs(current - suggested.balance) / suggested.balance;

      if (deviation > threshold) {
        if (current > suggested.balance) {
          // Has too much, need to move out
          const excess = current - suggested.balance;
          
          // Find exchange that needs more
          const recipient = suggestedBalances.find(s => 
            (currentBalances[s.exchange] || 0) < s.balance
          );

          if (recipient) {
            moves.push({
              from: suggested.exchange,
              to: recipient.exchange,
              amount: excess,
            });
          }
        }
      }
    }

    return {
      shouldRebalance: moves.length > 0,
      moves,
    };
  }
}

export const rebalancingService = new RebalancingService();
