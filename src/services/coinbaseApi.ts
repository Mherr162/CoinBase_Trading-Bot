
interface CoinbaseProduct {
  id: string;
  display_name: string;
  base_currency: string;
  quote_currency: string;
  status: string;
}

interface CoinbaseTicker {
  price: string;
  size: string;
  bid: string;
  ask: string;
  volume: string;
  time: string;
}

interface CoinbaseCandle {
  timestamp: number;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
}

interface CoinbaseStats {
  high: string;
  last: string;
  low: string;
  open: string;
  volume: string;
  volume_30day: string;
}

const BASE_URL = 'https://api.exchange.coinbase.com';

import { fetchWithRetry } from './fetchWithRetry';

export class CoinbaseAPI {
  // Get all available trading pairs
  static async getProducts(): Promise<CoinbaseProduct[]> {
    try {
      const response = await fetchWithRetry(`${BASE_URL}/products`);
      if (!response.ok) throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Get current price data for a symbol
  static async getTicker(symbol: string): Promise<CoinbaseTicker | null> {
    try {
      const response = await fetchWithRetry(`${BASE_URL}/products/${symbol}/ticker`);
      if (!response.ok) throw new Error(`Failed to fetch ticker for ${symbol}: ${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching ticker:', error);
      return null;
    }
  }

  // Get 24hr stats for a symbol
  static async getStats(symbol: string): Promise<CoinbaseStats | null> {
    try {
      const response = await fetchWithRetry(`${BASE_URL}/products/${symbol}/stats`);
      if (!response.ok) throw new Error(`Failed to fetch stats for ${symbol}: ${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  }

  // Get historical candle data with better error handling
  static async getCandles(
    symbol: string, 
    granularity: number = 3600,
    start?: string,
    end?: string
  ): Promise<CoinbaseCandle[]> {
    try {
      // Use a more recent time range if none provided
      if (!start && !end) {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        end = now.toISOString();
        start = yesterday.toISOString();
      }

      const params = new URLSearchParams({
        granularity: granularity.toString(),
        ...(start && { start }),
        ...(end && { end })
      });
      
      const response = await fetchWithRetry(`${BASE_URL}/products/${symbol}/candles?${params}`);
      
      if (!response.ok) {
        console.warn(`Failed to fetch candles for ${symbol}, status: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`No candle data available for ${symbol}`);
        return [];
      }
      
      // Convert Coinbase format [timestamp, low, high, open, close, volume] to our format
      return data.map((candle: number[]) => ({
        timestamp: candle[0],
        low: candle[1],
        high: candle[2], 
        open: candle[3],
        close: candle[4],
        volume: candle[5]
      })).reverse(); // Coinbase returns newest first, we want oldest first
    } catch (error) {
      console.error('Error fetching candles:', error);
      return [];
    }
  }

  // Get order book data
  static async getOrderBook(symbol: string, level: number = 2) {
    try {
      const response = await fetchWithRetry(`${BASE_URL}/products/${symbol}/book?level=${level}`);
      if (!response.ok) throw new Error(`Failed to fetch order book for ${symbol}: ${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching order book:', error);
      return { bids: [], asks: [] };
    }
  }
}
