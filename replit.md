# Crypto Arbitrage Finder

## Overview
A real-time cryptocurrency arbitrage opportunity finder that monitors price differences across multiple centralized (CEX) and decentralized (DEX) exchanges. The application helps users identify profitable trading opportunities with a specified capital amount (default: $100 USD) and provides step-by-step execution guides for manual trading.

The project's ambition is to provide a comprehensive, multi-strategy platform for crypto traders, incorporating advanced features like an automated trading bot, AI-driven price predictions, and portfolio rebalancing to maximize profitability and efficiency.

## User Preferences
- Italian language support for user communication (100% tradotto)
- Focus on visual clarity and professional fintech aesthetics
- Real-time updates are critical
- Semi-automatic + Manual execution workflows
  - Semi-automatic: One-click trading con conferma
  - Manual: Guide step-by-step per esecuzione manuale
- Massimizzare profitti con multiple strategie combinate
- Automazione dove possibile, controllo utente dove necessario

## System Architecture

### UI/UX Decisions
The application features a dark mode fintech aesthetic inspired by platforms like TradingView and Binance. It uses Inter for UI text and JetBrains Mono for data displays. Components are built with Shadcn UI, customized for a crypto trading environment. Key UI elements include a dashboard with real-time updates, opportunity cards with detailed breakdowns, profit calculators, and execution guide modals.

### Technical Implementations
The system is built with a React and TypeScript frontend, an Express and Node.js backend, and a PostgreSQL database. Real-time data updates are handled via WebSocket, pushing price information every 30 seconds.

**Exchange API Integration Status:**
-   **KuCoin**: ✅ Fully functional - Real API calls working with HMAC-SHA256 authentication
-   **Binance**: ❌ Blocked on Replit servers due to geographic restrictions ("Service unavailable from a restricted location")
-   **Auto-Save Credentials**: Implemented with 2-second debounce - credentials automatically saved as user types
-   **Encryption**: AES-256-GCM encryption for all API keys stored in PostgreSQL database
-   **Real Balance Tracking**: `/api/rebalance/status` endpoint fetches actual account balances from connected exchanges

**Key Features Implemented:**
-   **Automated Trading Bot**: A 24/7 auto-execution engine with intelligent position sizing, cooldown systems, and daily profit limits. Supports aggressive and conservative modes.
-   **Advanced Alert System**: Multi-channel notifications (Telegram, Discord, Email) with custom triggers based on profit percentage, price changes, or volume, categorized by urgency.
-   **Portfolio Analytics Pro**: Advanced metrics like Sharpe ratio, win rate, ROI, max drawdown, and profit factor, displayed through equity curves and performance heatmaps.
-   **AI Price Predictions**: ML forecasting engine for time series analysis, pattern detection, and sentiment analysis, providing smart entry/exit signals and confidence scores for 1h, 4h, and 24h forecasts.
-   **Auto-Rebalancing**: Optimizes capital allocation dynamically, tracks multi-exchange balances, and manages liquidity.
-   **One-Click Trading System**: Allows for automatic trade execution with prior confirmation, supporting both demo and real trading modes.
-   **QuickConnect Exchange**: Facilitates rapid connection to Binance, KuCoin, and MetaMask, with secure credential management.
-   **Yield Farming Dashboard**: Tracks APY for staking positions (BTC/ETH/USDT) with auto-compound options.
-   **Flash Loan Simulator**: Simulates arbitrage opportunities using borrowed capital, including fee calculations and step-by-step execution guides.
-   **Multi-Strategy Calculator**: Provides combined profit projections from arbitrage, yield farming, and flash loans.
-   **Comprehensive Monitoring**: Supports 25 crypto pairs across 7 exchanges (5 CEX, 2 DEX).
-   **Browser Notifications**: Customizable alerts for profitable opportunities with sound and adjustable thresholds.
-   **Full Italian Translation**: The entire interface, guides, and messages are in Italian.

### System Design Choices
-   **Data Models**: `ArbitrageOpportunity`, `Exchange`, `CryptoPair`, `PriceData`, `bot_config`, `alert_config`, `portfolio_metrics`, `ai_predictions`, and `rebalancing_history` are used for structured data management.
-   **API Security**: AES-256-GCM encryption is used for storing API credentials, and rate limiting is implemented for security.
-   **Scalability**: The architecture supports real-time data processing and can handle multiple trading strategies simultaneously.

## External Dependencies
-   **CoinGecko API**: Used for fetching real-time cryptocurrency price data.
-   **Binance**: Centralized Exchange (CEX) integration for trading.
-   **KuCoin**: Centralized Exchange (CEX) integration for trading.
-   **Kraken**: Centralized Exchange (CEX) integration for trading.
-   **Coinbase**: Centralized Exchange (CEX) integration for trading.
-   **Bybit**: Centralized Exchange (CEX) integration for trading.
-   **Uniswap**: Decentralized Exchange (DEX) integration for trading.
-   **PancakeSwap**: Decentralized Exchange (DEX) integration for trading.
-   **MetaMask**: Wallet integration for Web3 interactions, primarily with DEXes.
-   **PostgreSQL**: Primary database for storing opportunities, historical data, configurations, and metrics.
-   **Recharts**: JavaScript charting library used for analytics dashboards and performance visualizations.
-   **Telegram Bot API**: For advanced alert system notifications.
-   **Discord Webhooks**: For advanced alert system notifications.
-   **Nodemailer**: For email notifications in the advanced alert system.