# Crypto Arbitrage Finder

## Overview
A real-time cryptocurrency arbitrage opportunity finder that monitors price differences across multiple centralized (CEX) and decentralized (DEX) exchanges. The application helps users identify profitable trading opportunities with a specified capital amount (default: $100 USD) and provides step-by-step execution guides for manual trading.

## Purpose
- Monitor cryptocurrency prices across 7+ major exchanges in real-time
- Calculate arbitrage opportunities considering all fees (trading, network, slippage)
- Provide profit calculations based on user capital
- Guide users through manual execution of arbitrage trades
- Display opportunities with detailed fee breakdowns and execution steps

## Current State
**Phase 1 - Schema & Frontend: IN PROGRESS**
- ✅ Data models defined (ArbitrageOpportunity, Exchange, CryptoPair, PriceData)
- ✅ Design tokens configured (dark mode crypto trading theme)
- ✅ Complete dashboard UI with real-time updates
- ✅ Opportunity cards with detailed breakdowns
- ✅ Profit calculator component
- ✅ Execution guide modal with step-by-step instructions
- ✅ Live status indicator
- ✅ Fee breakdown visualization
- ✅ Filtering system (exchange type, min profit percentage)

**Phase 2 - Backend: PENDING**
- WebSocket server for real-time price updates
- API endpoints for opportunities and exchange data
- Price fetching service (CoinGecko API + exchange public APIs)
- Arbitrage calculation engine
- Fee calculation logic

**Phase 3 - Integration: PENDING**
- Connect frontend to WebSocket and REST APIs
- Real-time data updates
- Testing and polish

## Recent Changes
- 2025-10-18: Initial project setup with schema and complete frontend implementation

## Project Architecture

### Frontend (React + TypeScript)
- **Dashboard**: Main page displaying all opportunities with filters
- **Components**:
  - `OpportunityCard`: Individual arbitrage opportunity display
  - `ProfitCalculator`: Calculates potential profits based on capital
  - `ExecutionGuideModal`: Step-by-step manual execution instructions
  - `LiveStatusIndicator`: WebSocket connection status
  - `FeeBreakdown`: Detailed fee visualization

### Backend (Express + Node.js)
- **WebSocket Server**: Real-time price update broadcasting
- **REST API**:
  - `GET /api/opportunities`: Fetch current arbitrage opportunities
  - `GET /api/exchanges`: List supported exchanges
  - `GET /api/pairs`: List supported crypto pairs
- **Services**:
  - Price fetching from multiple exchange APIs
  - Arbitrage calculation with fee considerations
  - Real-time data aggregation

### Data Model
- **ArbitrageOpportunity**: Complete opportunity with buy/sell prices, fees, and profit calculations
- **Exchange**: Exchange information (name, type, fees)
- **CryptoPair**: Cryptocurrency trading pair information
- **PriceData**: Real-time price information from exchanges

### Supported Exchanges
**Centralized (CEX):**
- Binance (0.1% fee)
- Coinbase (0.5% fee)
- Kraken (0.26% fee)
- KuCoin (0.1% fee)
- Bybit (0.1% fee)

**Decentralized (DEX):**
- Uniswap (0.3% fee + $15 gas)
- PancakeSwap (0.25% fee + $2 gas)

### Supported Cryptocurrency Pairs
BTC/USDT, ETH/USDT, BNB/USDT, SOL/USDT, ADA/USDT, XRP/USDT, DOGE/USDT, MATIC/USDT, DOT/USDT, AVAX/USDT

## Design System
- **Theme**: Dark mode fintech aesthetic (inspired by TradingView, Binance)
- **Colors**:
  - Primary (Profit): Crypto Green (#8BC34A)
  - Destructive (Loss): Red (#EF5350)
  - Warning (Alert): Yellow (#FFCA28)
  - Background: Deep charcoal
- **Typography**:
  - Sans: Inter (UI and labels)
  - Mono: JetBrains Mono (prices and data)
- **Components**: Shadcn UI with custom crypto trading styling

## User Preferences
- Italian language support for user communication
- Focus on visual clarity and professional fintech aesthetics
- Real-time updates are critical
- Manual execution workflow (no automated trading)

## Next Steps
1. Implement backend WebSocket server and API endpoints
2. Build price fetching service with multiple exchange APIs
3. Create arbitrage calculation engine
4. Connect frontend to backend with real-time updates
5. Test and polish the complete application
