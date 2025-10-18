import { z } from "zod";
import { pgTable, serial, varchar, real, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const exchangeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["CEX", "DEX"]),
  tradingFee: z.number(),
  networkFees: z.number().optional(),
  withdrawalFee: z.number().optional(),
  apiEndpoint: z.string().optional(),
});

export const cryptoPairSchema = z.object({
  symbol: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  name: z.string(),
});

export const priceDataSchema = z.object({
  exchange: z.string(),
  pair: z.string(),
  price: z.number(),
  volume24h: z.number().optional(),
  timestamp: z.number(),
});

export const arbitrageOpportunitySchema = z.object({
  id: z.string(),
  pair: z.string(),
  buyExchange: z.string(),
  sellExchange: z.string(),
  buyPrice: z.number(),
  sellPrice: z.number(),
  spreadPercentage: z.number(),
  grossProfitUsd: z.number(),
  tradingFees: z.number(),
  networkFees: z.number(),
  slippage: z.number(),
  netProfitUsd: z.number(),
  netProfitPercentage: z.number(),
  timestamp: z.number(),
  executionSteps: z.array(z.string()).optional(),
});

export const opportunityFilterSchema = z.object({
  minProfitPercentage: z.number().optional(),
  exchanges: z.array(z.string()).optional(),
  pairs: z.array(z.string()).optional(),
  exchangeType: z.enum(["CEX", "DEX", "ALL"]).optional(),
});

export type Exchange = z.infer<typeof exchangeSchema>;
export type CryptoPair = z.infer<typeof cryptoPairSchema>;
export type PriceData = z.infer<typeof priceDataSchema>;
export type ArbitrageOpportunity = z.infer<typeof arbitrageOpportunitySchema>;
export type OpportunityFilter = z.infer<typeof opportunityFilterSchema>;

export const SUPPORTED_EXCHANGES: Exchange[] = [
  { id: "binance", name: "Binance", type: "CEX", tradingFee: 0.1 },
  { id: "coinbase", name: "Coinbase", type: "CEX", tradingFee: 0.5 },
  { id: "kraken", name: "Kraken", type: "CEX", tradingFee: 0.26 },
  { id: "kucoin", name: "KuCoin", type: "CEX", tradingFee: 0.1 },
  { id: "bybit", name: "Bybit", type: "CEX", tradingFee: 0.1 },
  { id: "uniswap", name: "Uniswap", type: "DEX", tradingFee: 0.3, networkFees: 15 },
  { id: "pancakeswap", name: "PancakeSwap", type: "DEX", tradingFee: 0.25, networkFees: 2 },
];

export const SUPPORTED_PAIRS: CryptoPair[] = [
  { symbol: "BTC/USDT", baseAsset: "BTC", quoteAsset: "USDT", name: "Bitcoin" },
  { symbol: "ETH/USDT", baseAsset: "ETH", quoteAsset: "USDT", name: "Ethereum" },
  { symbol: "BNB/USDT", baseAsset: "BNB", quoteAsset: "USDT", name: "Binance Coin" },
  { symbol: "SOL/USDT", baseAsset: "SOL", quoteAsset: "USDT", name: "Solana" },
  { symbol: "ADA/USDT", baseAsset: "ADA", quoteAsset: "USDT", name: "Cardano" },
  { symbol: "XRP/USDT", baseAsset: "XRP", quoteAsset: "USDT", name: "Ripple" },
  { symbol: "DOGE/USDT", baseAsset: "DOGE", quoteAsset: "USDT", name: "Dogecoin" },
  { symbol: "MATIC/USDT", baseAsset: "MATIC", quoteAsset: "USDT", name: "Polygon" },
  { symbol: "DOT/USDT", baseAsset: "DOT", quoteAsset: "USDT", name: "Polkadot" },
  { symbol: "AVAX/USDT", baseAsset: "AVAX", quoteAsset: "USDT", name: "Avalanche" },
];

// Database Tables
export const opportunityHistory = pgTable("opportunity_history", {
  id: serial("id").primaryKey(),
  pair: varchar("pair", { length: 50 }).notNull(),
  buyExchange: varchar("buy_exchange", { length: 50 }).notNull(),
  sellExchange: varchar("sell_exchange", { length: 50 }).notNull(),
  buyPrice: real("buy_price").notNull(),
  sellPrice: real("sell_price").notNull(),
  spreadPercentage: real("spread_percentage").notNull(),
  grossProfitUsd: real("gross_profit_usd").notNull(),
  tradingFees: real("trading_fees").notNull(),
  networkFees: real("network_fees").notNull(),
  slippage: real("slippage").notNull(),
  netProfitUsd: real("net_profit_usd").notNull(),
  netProfitPercentage: real("net_profit_percentage").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  executed: boolean("executed").default(false),
});

export type OpportunityHistory = typeof opportunityHistory.$inferSelect;
export type InsertOpportunityHistory = typeof opportunityHistory.$inferInsert;

export const insertOpportunityHistorySchema = createInsertSchema(opportunityHistory).omit({
  id: true,
  timestamp: true,
});
