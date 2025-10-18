import { randomUUID } from "crypto";
import { SUPPORTED_EXCHANGES } from "@shared/schema";
import type { ArbitrageOpportunity, PriceData } from "@shared/schema";

export class ArbitrageEngine {
  calculateOpportunities(pricesByPair: Map<string, PriceData[]>, capital: number = 100): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    pricesByPair.forEach((prices, pair) => {
      if (prices.length < 2) return;

      for (let i = 0; i < prices.length; i++) {
        for (let j = 0; j < prices.length; j++) {
          if (i === j) continue;

          const buyPrice = prices[i];
          const sellPrice = prices[j];

          if (sellPrice.price <= buyPrice.price) continue;

          const opportunity = this.calculateOpportunity(
            pair,
            buyPrice,
            sellPrice,
            capital
          );

          if (opportunity) {
            opportunities.push(opportunity);
          }
        }
      }
    });

    return opportunities.sort((a, b) => b.netProfitPercentage - a.netProfitPercentage);
  }

  private calculateOpportunity(
    pair: string,
    buyPrice: PriceData,
    sellPrice: PriceData,
    capital: number
  ): ArbitrageOpportunity | null {
    const buyExchange = SUPPORTED_EXCHANGES.find(e => e.id === buyPrice.exchange);
    const sellExchange = SUPPORTED_EXCHANGES.find(e => e.id === sellPrice.exchange);

    if (!buyExchange || !sellExchange) return null;

    const spreadPercentage = ((sellPrice.price - buyPrice.price) / buyPrice.price) * 100;

    const grossProfitUsd = capital * (spreadPercentage / 100);

    const buyTradingFee = capital * (buyExchange.tradingFee / 100);
    const sellTradingFee = capital * (sellExchange.tradingFee / 100);
    const tradingFees = buyTradingFee + sellTradingFee;

    let networkFees = 0;
    if (buyExchange.type === "DEX") {
      networkFees += buyExchange.networkFees || 0;
    }
    if (sellExchange.type === "DEX") {
      networkFees += sellExchange.networkFees || 0;
    }
    if (buyExchange.type === "CEX" && sellExchange.type === "CEX") {
      networkFees = 2;
    }

    const slippage = capital * 0.002;

    const netProfitUsd = grossProfitUsd - tradingFees - networkFees - slippage;
    const netProfitPercentage = (netProfitUsd / capital) * 100;

    const executionSteps = this.generateExecutionSteps(
      pair,
      buyExchange.name,
      sellExchange.name,
      buyPrice.price,
      sellPrice.price,
      buyExchange.type,
      sellExchange.type
    );

    return {
      id: randomUUID(),
      pair,
      buyExchange: buyPrice.exchange,
      sellExchange: sellPrice.exchange,
      buyPrice: buyPrice.price,
      sellPrice: sellPrice.price,
      spreadPercentage,
      grossProfitUsd,
      tradingFees,
      networkFees,
      slippage,
      netProfitUsd,
      netProfitPercentage,
      timestamp: Date.now(),
      executionSteps,
    };
  }

  private generateExecutionSteps(
    pair: string,
    buyExchange: string,
    sellExchange: string,
    buyPrice: number,
    sellPrice: number,
    buyType: string,
    sellType: string
  ): string[] {
    const steps: string[] = [
      `Buy ${pair} on ${buyExchange} at $${buyPrice.toFixed(2)}`,
    ];

    if (buyType === "CEX" && sellType === "CEX") {
      steps.push(`Transfer ${pair} from ${buyExchange} to ${sellExchange}`);
    }

    steps.push(`Sell ${pair} on ${sellExchange} at $${sellPrice.toFixed(2)}`);
    steps.push(`Realize profit from price difference`);

    return steps;
  }
}

export const arbitrageEngine = new ArbitrageEngine();
