# Crypto Arbitrage Finder - Design Guidelines

## Design Approach
**System-Based with Fintech References**
Primary inspiration: TradingView, Robinhood, Binance dashboards
Design System: Material Design with modern fintech aesthetics
Focus: Data clarity, real-time updates, actionable insights

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**
- Background: 222 15% 10% (deep charcoal)
- Surface: 222 15% 15% (card backgrounds)
- Primary: 142 76% 36% (crypto green - profit indicator)
- Danger: 0 84% 60% (loss indicator)
- Warning: 45 93% 58% (opportunity alerts)
- Text Primary: 0 0% 98%
- Text Secondary: 0 0% 71%

**Accent Colors for Data**
- Positive Change: 142 76% 36% (green)
- Negative Change: 0 84% 60% (red)
- Neutral/Info: 217 91% 60% (blue for informational elements)

### B. Typography

**Fonts**
- Primary: 'Inter' (Google Fonts) - clean, excellent for data
- Monospace: 'JetBrains Mono' - for numbers, prices, percentages

**Scale**
- Hero Headings: text-4xl font-bold (dashboard title)
- Section Headers: text-2xl font-semibold
- Data Labels: text-sm font-medium uppercase tracking-wide
- Price Display: text-3xl font-mono font-bold
- Body Text: text-base
- Small Data: text-xs font-mono (timestamps, fees)

### C. Layout System

**Spacing Units**: Tailwind primitives - 2, 4, 6, 8, 12, 16, 24
- Card padding: p-6
- Section spacing: space-y-8
- Grid gaps: gap-6
- Component margins: m-4 or m-6

**Grid Structure**
- Desktop: 12-column grid with max-w-7xl container
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Main content area: Two-column layout (opportunity list + calculator sidebar)

### D. Component Library

**Navigation**
- Fixed top navbar with logo, key metrics ticker, wallet connection status
- Sidebar navigation (optional) for different views (CEX, DEX, History)
- Height: h-16, dark background with subtle border-b

**Dashboard Cards**
- Elevated cards with rounded-xl borders
- Each opportunity card shows: Exchange pair, price difference %, estimated profit
- Color-coded borders (green for profitable after fees, yellow for marginal)
- Quick action buttons within each card

**Data Display Components**
- Price comparison table with alternating row backgrounds
- Live updating badges for price changes (with pulse animation)
- Percentage displays with directional arrows (↑↓)
- Fee breakdown accordions

**Calculator Panel**
- Sticky sidebar card on desktop
- Input field for capital amount (default: $100)
- Real-time profit calculation
- Fee breakdown visualization (bar chart or breakdown list)
- "Execute Manually" guide button

**Alert System**
- Toast notifications (top-right) for new opportunities
- Color-coded by profit margin (>5% = green, 2-5% = yellow)
- Sound toggle option
- Dismissible with X button

**Forms & Inputs**
- Dark themed input fields with border-2 focus states
- Number inputs with step controls for capital amount
- Dropdown selects for exchange/pair filtering
- Toggle switches for alert preferences

**Status Indicators**
- Live connection status badge (green dot + "Live")
- Last update timestamp
- API rate limit indicator
- Loading skeletons for data fetching

### E. Animations

Use sparingly and purposefully:
- Pulse animation on live price updates (1-2 second fade)
- Smooth transitions for card hover states (transition-all duration-200)
- Toast slide-in from right for alerts
- Number count-up animation for profit calculations
- NO complex scroll animations or parallax effects

## Page Structure

**Main Dashboard**
1. Top metrics bar (total opportunities found today, best opportunity %, average profit margin)
2. Filter controls (exchange type, min profit %, cryptocurrency pair)
3. Opportunities grid (3-column on desktop, stacked on mobile)
4. Each card displays: Exchange names, crypto pair, buy/sell prices, spread %, profit after fees, "View Details" button
5. Sticky calculator sidebar (right side, 30% width on desktop)

**Opportunity Detail Modal**
- Full breakdown: buy exchange, sell exchange, current prices
- Fee calculation table (network fees, trading fees, slippage estimate)
- Step-by-step execution guide with numbered instructions
- Timer showing how long the opportunity has been available
- MetaMask integration button (disabled initially, shown for future feature)

## Images

**Hero Section**: No traditional hero image needed (data dashboard starts immediately)

**Educational Graphics**
- Iconography for different exchanges (use exchange logos via API or placeholders)
- Simple line chart visualization of price differences over time
- Flowchart diagram in "How It Works" section showing arbitrage process flow

**Empty States**
- Illustration for "No opportunities found" state (searching/waiting graphic)
- Network disconnection state graphic

## Accessibility

- Maintain full dark mode throughout
- High contrast for price data (WCAG AAA compliance)
- Color is not the only indicator (use icons + text for profit/loss)
- Keyboard navigation for all interactive elements
- Screen reader labels for all data points
- Focus indicators visible on all focusable elements

## Mobile Optimization

- Single column layout for opportunity cards
- Calculator panel moves to bottom sheet
- Collapsible filters section
- Swipeable cards for quick comparison
- Large touch targets (min 44x44px)
- Bottom navigation for primary actions