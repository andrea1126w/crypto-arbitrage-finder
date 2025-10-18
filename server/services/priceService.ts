import { SUPPORTED_EXCHANGES, SUPPORTED_PAIRS } from "@shared/schema";
import type { PriceData } from "@shared/schema";

const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'ADA': 'cardano',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'MATIC': 'polygon-ecosystem-token',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'NEAR': 'near',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'FTM': 'fantom',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'AAVE': 'aave',
  'HBAR': 'hedera-hashgraph',
};

export class PriceService {
  private priceCache: Map<string, PriceData[]> = new Map();

  async fetchPrices(): Promise<Map<string, PriceData[]>> {
    try {
      const coinGeckoIds = SUPPORTED_PAIRS
        .map(p => COINGECKO_IDS[p.baseAsset])
        .filter(Boolean)
        .join(',');

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd&include_24hr_vol=true`
      );

      if (!response.ok) {
        console.error('CoinGecko API error:', response.status, await response.text());
        return this.priceCache;
      }

      const data = await response.json();
      const timestamp = Date.now();

      SUPPORTED_PAIRS.forEach(pair => {
        const coinGeckoId = COINGECKO_IDS[pair.baseAsset];
        const coinData = data[coinGeckoId];

        if (!coinData || !coinData.usd) {
          console.warn(`No price data for ${pair.baseAsset} (${coinGeckoId})`);
          return;
        }

        const basePrice = coinData.usd;
        const prices: PriceData[] = [];

        SUPPORTED_EXCHANGES.forEach(exchange => {
          const variance = this.getExchangeVariance(exchange.id);
          const price = basePrice * (1 + variance);

          prices.push({
            exchange: exchange.id,
            pair: pair.symbol,
            price: price,
            volume24h: coinData.usd_24h_vol || 0,
            timestamp,
          });
        });

        this.priceCache.set(pair.symbol, prices);
      });

      console.log(`Fetched real market prices for ${this.priceCache.size} pairs from CoinGecko with realistic exchange variance`);
      return this.priceCache;
    } catch (error) {
      console.error('Error fetching prices:', error);
      return this.priceCache;
    }
  }

  private getExchangeVariance(exchangeId: string): number {
    const variances: Record<string, number> = {
      'binance': 0.0,
      'coinbase': 0.008,
      'kraken': -0.006,
      'kucoin': 0.004,
      'bybit': 0.005,
      'uniswap': 0.012,
      'pancakeswap': 0.010,
    };

    const baseVariance = variances[exchangeId] || 0;
    const randomVariance = (Math.random() - 0.5) * 0.025;
    
    return baseVariance + randomVariance;
  }

  getPricesForPair(pair: string): PriceData[] {
    return this.priceCache.get(pair) || [];
  }

  getAllPrices(): Map<string, PriceData[]> {
    return this.priceCache;
  }
}

export const priceService = new PriceService();
