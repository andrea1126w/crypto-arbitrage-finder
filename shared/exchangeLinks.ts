export const EXCHANGE_LINKS: Record<string, {
  name: string;
  homepage: string;
  register: string;
  login: string;
  tradingUrl: (pair: string) => string;
  depositGuide: string;
  withdrawGuide: string;
}> = {
  bybit: {
    name: "Bybit",
    homepage: "https://www.bybit.com",
    register: "https://www.bybit.com/register",
    login: "https://www.bybit.com/login",
    tradingUrl: (pair) => `https://www.bybit.com/trade/spot/${pair.replace('/', '')}`,
    depositGuide: "https://learn.bybit.com/bybit-guide/how-to-deposit-crypto-on-bybit/",
    withdrawGuide: "https://learn.bybit.com/bybit-guide/how-to-withdraw-crypto-from-bybit/",
  },
  coinbase: {
    name: "Coinbase",
    homepage: "https://www.coinbase.com",
    register: "https://www.coinbase.com/signup",
    login: "https://www.coinbase.com/signin",
    tradingUrl: (pair) => `https://www.coinbase.com/advanced-trade/spot/${pair.replace('/', '-')}`,
    depositGuide: "https://help.coinbase.com/en/coinbase/getting-started/add-a-payment-method",
    withdrawGuide: "https://help.coinbase.com/en/coinbase/trading-and-funding/cryptocurrency-trading-pairs/how-to-send-and-receive-cryptocurrency",
  },
  kraken: {
    name: "Kraken",
    homepage: "https://www.kraken.com",
    register: "https://www.kraken.com/sign-up",
    login: "https://www.kraken.com/sign-in",
    tradingUrl: (pair) => `https://www.kraken.com/prices/${pair.split('/')[0].toLowerCase()}`,
    depositGuide: "https://support.kraken.com/hc/en-us/articles/360000672763-How-to-deposit-cryptocurrencies-to-your-Kraken-account",
    withdrawGuide: "https://support.kraken.com/hc/en-us/articles/360000672923-How-to-withdraw-cryptocurrencies-from-your-Kraken-account",
  },
  kucoin: {
    name: "KuCoin",
    homepage: "https://www.kucoin.com",
    register: "https://www.kucoin.com/ucenter/signup",
    login: "https://www.kucoin.com/login",
    tradingUrl: (pair) => `https://www.kucoin.com/trade/${pair.replace('/', '-')}`,
    depositGuide: "https://www.kucoin.com/support/360015102174",
    withdrawGuide: "https://www.kucoin.com/support/360015102254",
  },
  uniswap: {
    name: "Uniswap",
    homepage: "https://uniswap.org",
    register: "https://app.uniswap.org",
    login: "https://app.uniswap.org",
    tradingUrl: (pair) => `https://app.uniswap.org/#/swap`,
    depositGuide: "https://support.uniswap.org/hc/en-us/articles/8343259818893-How-to-connect-a-wallet-to-Uniswap",
    withdrawGuide: "https://support.uniswap.org/hc/en-us/articles/8370549573389-How-to-swap-tokens-on-the-Uniswap-web-app",
  },
  pancakeswap: {
    name: "PancakeSwap",
    homepage: "https://pancakeswap.finance",
    register: "https://pancakeswap.finance",
    login: "https://pancakeswap.finance",
    tradingUrl: (pair) => `https://pancakeswap.finance/swap`,
    depositGuide: "https://docs.pancakeswap.finance/get-started/connection-guide",
    withdrawGuide: "https://docs.pancakeswap.finance/products/pancakeswap-exchange/trade-guide",
  },
};
