import type { ArbitrageOpportunity, Exchange, CryptoPair, OpportunityHistory, InsertOpportunityHistory } from "@shared/schema";
import { opportunityHistory } from "@shared/schema";
import { db } from "./db";
import { desc, gte, and, sql } from "drizzle-orm";

export interface IStorage {
  getOpportunities(): Promise<ArbitrageOpportunity[]>;
  getExchanges(): Promise<Exchange[]>;
  getPairs(): Promise<CryptoPair[]>;
  saveOpportunityToHistory(opportunity: InsertOpportunityHistory): Promise<OpportunityHistory>;
  getOpportunityHistory(options?: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    pair?: string;
    minProfit?: number;
  }): Promise<OpportunityHistory[]>;
  getHistoryStats(): Promise<{
    totalOpportunities: number;
    profitableOpportunities: number;
    totalProfitUsd: number;
    averageProfitPercentage: number;
    bestOpportunity: OpportunityHistory | null;
  }>;
}

export class DatabaseStorage implements IStorage {
  private opportunities: Map<string, ArbitrageOpportunity>;

  constructor() {
    this.opportunities = new Map();
  }

  async getOpportunities(): Promise<ArbitrageOpportunity[]> {
    return Array.from(this.opportunities.values());
  }

  async getExchanges(): Promise<Exchange[]> {
    return [];
  }

  async getPairs(): Promise<CryptoPair[]> {
    return [];
  }

  setOpportunities(opportunities: ArbitrageOpportunity[]): void {
    this.opportunities.clear();
    opportunities.forEach(opp => {
      this.opportunities.set(opp.id, opp);
    });
  }

  async saveOpportunityToHistory(opportunity: InsertOpportunityHistory): Promise<OpportunityHistory> {
    const [saved] = await db
      .insert(opportunityHistory)
      .values(opportunity)
      .returning();
    return saved;
  }

  async getOpportunityHistory(options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    pair?: string;
    minProfit?: number;
  } = {}): Promise<OpportunityHistory[]> {
    const { limit = 100, startDate, endDate, pair, minProfit } = options;

    let query = db.select().from(opportunityHistory);

    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(opportunityHistory.timestamp, startDate));
    }
    
    if (endDate) {
      conditions.push(sql`${opportunityHistory.timestamp} <= ${endDate}`);
    }
    
    if (pair) {
      conditions.push(sql`${opportunityHistory.pair} = ${pair}`);
    }
    
    if (minProfit !== undefined) {
      conditions.push(sql`${opportunityHistory.netProfitPercentage} >= ${minProfit}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(opportunityHistory.timestamp))
      .limit(limit);

    return results;
  }

  async getHistoryStats(): Promise<{
    totalOpportunities: number;
    profitableOpportunities: number;
    totalProfitUsd: number;
    averageProfitPercentage: number;
    bestOpportunity: OpportunityHistory | null;
  }> {
    const allHistory = await db.select().from(opportunityHistory);

    const totalOpportunities = allHistory.length;
    const profitableOpportunities = allHistory.filter(h => h.netProfitUsd > 0).length;
    const totalProfitUsd = allHistory.reduce((sum, h) => sum + h.netProfitUsd, 0);
    const averageProfitPercentage = totalOpportunities > 0
      ? allHistory.reduce((sum, h) => sum + h.netProfitPercentage, 0) / totalOpportunities
      : 0;

    const bestOpportunity = allHistory.length > 0
      ? allHistory.reduce((best, current) => 
          current.netProfitPercentage > best.netProfitPercentage ? current : best
        )
      : null;

    return {
      totalOpportunities,
      profitableOpportunities,
      totalProfitUsd,
      averageProfitPercentage,
      bestOpportunity,
    };
  }
}

export const storage = new DatabaseStorage();
