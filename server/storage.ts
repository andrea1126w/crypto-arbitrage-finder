import type { ArbitrageOpportunity, Exchange, CryptoPair } from "@shared/schema";

export interface IStorage {
  getOpportunities(): Promise<ArbitrageOpportunity[]>;
  getExchanges(): Promise<Exchange[]>;
  getPairs(): Promise<CryptoPair[]>;
}

export class MemStorage implements IStorage {
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
}

export const storage = new MemStorage();
