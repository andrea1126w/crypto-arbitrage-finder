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
  { id: "bybit", name: "Bybit", type: "CEX", tradingFee: 0.1 },
  { id: "kucoin", name: "KuCoin", type: "CEX", tradingFee: 0.1 },
  { id: "coinbase", name: "Coinbase", type: "CEX", tradingFee: 0.5 },
  { id: "kraken", name: "Kraken", type: "CEX", tradingFee: 0.26 },
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
  { symbol: "LINK/USDT", baseAsset: "LINK", quoteAsset: "USDT", name: "Chainlink" },
  { symbol: "UNI/USDT", baseAsset: "UNI", quoteAsset: "USDT", name: "Uniswap" },
  { symbol: "ATOM/USDT", baseAsset: "ATOM", quoteAsset: "USDT", name: "Cosmos" },
  { symbol: "LTC/USDT", baseAsset: "LTC", quoteAsset: "USDT", name: "Litecoin" },
  { symbol: "NEAR/USDT", baseAsset: "NEAR", quoteAsset: "USDT", name: "Near Protocol" },
  { symbol: "APT/USDT", baseAsset: "APT", quoteAsset: "USDT", name: "Aptos" },
  { symbol: "ARB/USDT", baseAsset: "ARB", quoteAsset: "USDT", name: "Arbitrum" },
  { symbol: "OP/USDT", baseAsset: "OP", quoteAsset: "USDT", name: "Optimism" },
  { symbol: "FTM/USDT", baseAsset: "FTM", quoteAsset: "USDT", name: "Fantom" },
  { symbol: "ALGO/USDT", baseAsset: "ALGO", quoteAsset: "USDT", name: "Algorand" },
  { symbol: "VET/USDT", baseAsset: "VET", quoteAsset: "USDT", name: "VeChain" },
  { symbol: "ICP/USDT", baseAsset: "ICP", quoteAsset: "USDT", name: "Internet Computer" },
  { symbol: "FIL/USDT", baseAsset: "FIL", quoteAsset: "USDT", name: "Filecoin" },
  { symbol: "AAVE/USDT", baseAsset: "AAVE", quoteAsset: "USDT", name: "Aave" },
  { symbol: "HBAR/USDT", baseAsset: "HBAR", quoteAsset: "USDT", name: "Hedera" },
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

// Exchange Credentials (encrypted storage)
export const exchangeCredentials = pgTable("exchange_credentials", {
  id: serial("id").primaryKey(),
  exchange: varchar("exchange", { length: 50 }).notNull(),
  apiKey: varchar("api_key", { length: 500 }).notNull(), // Encrypted
  apiSecret: varchar("api_secret", { length: 500 }).notNull(), // Encrypted
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ExchangeCredentials = typeof exchangeCredentials.$inferSelect;
export type InsertExchangeCredentials = typeof exchangeCredentials.$inferInsert;

// Trading Bot Configuration
export const botConfig = pgTable("bot_config", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").default(false),
  mode: varchar("mode", { length: 20 }).default("conservative"), // conservative | aggressive
  minProfitPercent: real("min_profit_percent").default(1.0),
  maxDailyTrades: integer("max_daily_trades").default(20),
  maxDailyProfit: real("max_daily_profit").default(50),
  tradingHoursStart: integer("trading_hours_start").default(0), // 0-23
  tradingHoursEnd: integer("trading_hours_end").default(23),
  cooldownSeconds: integer("cooldown_seconds").default(60),
  positionSizePercent: real("position_size_percent").default(10), // % of capital per trade
  whitelistExchanges: varchar("whitelist_exchanges", { length: 500 }), // JSON array
  blacklistExchanges: varchar("blacklist_exchanges", { length: 500 }), // JSON array
  stopOnConsecutiveLosses: integer("stop_on_consecutive_losses").default(3),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type BotConfig = typeof botConfig.$inferSelect;
export type InsertBotConfig = typeof botConfig.$inferInsert;

// Trade Execution History (detailed)
export const tradeExecutions = pgTable("trade_executions", {
  id: serial("id").primaryKey(),
  opportunityId: varchar("opportunity_id", { length: 100 }),
  pair: varchar("pair", { length: 50 }).notNull(),
  buyExchange: varchar("buy_exchange", { length: 50 }).notNull(),
  sellExchange: varchar("sell_exchange", { length: 50 }).notNull(),
  buyPrice: real("buy_price").notNull(),
  sellPrice: real("sell_price").notNull(),
  quantity: real("quantity").notNull(),
  capitalUsed: real("capital_used").notNull(),
  estimatedProfit: real("estimated_profit").notNull(),
  actualProfit: real("actual_profit"),
  status: varchar("status", { length: 20 }).notNull(), // pending | completed | failed | partial
  executionType: varchar("execution_type", { length: 20 }).notNull(), // manual | auto
  buyOrderId: varchar("buy_order_id", { length: 100 }),
  sellOrderId: varchar("sell_order_id", { length: 100 }),
  errorMessage: varchar("error_message", { length: 500 }),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
});

export type TradeExecution = typeof tradeExecutions.$inferSelect;
export type InsertTradeExecution = typeof tradeExecutions.$inferInsert;

// Alert Configuration
export const alertConfigs = pgTable("alert_configs", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // telegram | discord | email | browser
  enabled: boolean("enabled").default(true),
  webhookUrl: varchar("webhook_url", { length: 500 }),
  telegramChatId: varchar("telegram_chat_id", { length: 100 }),
  telegramBotToken: varchar("telegram_bot_token", { length: 200 }),
  minProfitPercent: real("min_profit_percent").default(1.5), // Only alert if > this
  silentHoursStart: integer("silent_hours_start"), // 0-23, optional
  silentHoursEnd: integer("silent_hours_end"), // 0-23, optional
  alertFrequency: varchar("alert_frequency", { length: 20 }).default("immediate"), // immediate | digest
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AlertConfig = typeof alertConfigs.$inferSelect;
export type InsertAlertConfig = typeof alertConfigs.$inferInsert;

// Portfolio Metrics (daily aggregation)
export const portfolioMetrics = pgTable("portfolio_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalCapital: real("total_capital").notNull(),
  totalProfit: real("total_profit").notNull(),
  totalTrades: integer("total_trades").notNull(),
  winningTrades: integer("winning_trades").notNull(),
  losingTrades: integer("losing_trades").notNull(),
  avgProfitPerTrade: real("avg_profit_per_trade").notNull(),
  bestTrade: real("best_trade").notNull(),
  worstTrade: real("worst_trade").notNull(),
  winRate: real("win_rate").notNull(), // percentage
  sharpeRatio: real("sharpe_ratio"),
  maxDrawdown: real("max_drawdown"),
  arbitrageProfits: real("arbitrage_profits").notNull(),
  yieldFarmingProfits: real("yield_farming_profits").notNull(),
  flashLoanProfits: real("flash_loan_profits").notNull(),
});

export type PortfolioMetrics = typeof portfolioMetrics.$inferSelect;
export type InsertPortfolioMetrics = typeof portfolioMetrics.$inferInsert;

// AI Price Predictions
export const aiPredictions = pgTable("ai_predictions", {
  id: serial("id").primaryKey(),
  pair: varchar("pair", { length: 50 }).notNull(),
  currentPrice: real("current_price").notNull(),
  predicted1h: real("predicted_1h"),
  predicted6h: real("predicted_6h"),
  predicted24h: real("predicted_24h"),
  confidence: real("confidence"), // 0-1
  modelVersion: varchar("model_version", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AIPrediction = typeof aiPredictions.$inferSelect;
export type InsertAIPrediction = typeof aiPredictions.$inferInsert;

// Pattern Detection Results
export const detectedPatterns = pgTable("detected_patterns", {
  id: serial("id").primaryKey(),
  patternType: varchar("pattern_type", { length: 100 }).notNull(),
  pair: varchar("pair", { length: 50 }),
  exchange: varchar("exchange", { length: 50 }),
  description: varchar("description", { length: 500 }).notNull(),
  confidence: real("confidence").notNull(), // 0-1
  expectedProfitPercent: real("expected_profit_percent"),
  timeframe: varchar("timeframe", { length: 50 }), // hourly | daily | weekly
  occurrences: integer("occurrences").default(1),
  lastOccurrence: timestamp("last_occurrence").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DetectedPattern = typeof detectedPatterns.$inferSelect;
export type InsertDetectedPattern = typeof detectedPatterns.$inferInsert;
