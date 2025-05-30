
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUp, ArrowDown } from "lucide-react";
import { CoinbaseAPI } from "@/services/coinbaseApi";

interface MarketDataProps {
  symbol: string;
}

interface MarketStat {
  label: string;
  value: string;
  change?: number;
}

const MarketData = ({ symbol }: MarketDataProps) => {
  const { toast } = useToast();
  const [marketData, setMarketData] = useState<MarketStat[]>([]);

  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  
  // Convert our symbol format to Coinbase format
  const coinbaseSymbol = symbol.replace('/', '-').replace('USDT', 'USD');
  
  useEffect(() => {
    const fetchRealMarketData = async () => {
      setLoading(true);
      try {
        console.log(`Fetching market data for ${coinbaseSymbol}`);
        
        // Fetch both ticker and stats data
        const [ticker, stats] = await Promise.all([
          CoinbaseAPI.getTicker(coinbaseSymbol),
          CoinbaseAPI.getStats(coinbaseSymbol)
        ]);
        
        if (ticker && stats) {
          const price = parseFloat(ticker.price);
          const volume = parseFloat(ticker.volume);
          const high24h = parseFloat(stats.high);
          const low24h = parseFloat(stats.low);
          const open24h = parseFloat(stats.open);
          const change24h = price - open24h;
          const changePercent = (change24h / open24h) * 100;
          
          setCurrentPrice(price);
          
          const statsData: MarketStat[] = [
            { 
              label: "Current Price", 
              value: `$${price.toFixed(2)}`,
            },
            { 
              label: "24h High", 
              value: `$${high24h.toFixed(2)}`,
            },
            { 
              label: "24h Low", 
              value: `$${low24h.toFixed(2)}`,
            },
            { 
              label: "24h Change", 
              value: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
              change: changePercent,
            },
            { 
              label: "24h Volume", 
              value: `${volume.toFixed(2)} ${symbol.split('/')[0]}`,
            },
            { 
              label: "Bid/Ask Spread", 
              value: `$${(parseFloat(ticker.ask) - parseFloat(ticker.bid)).toFixed(2)}`,
            },
          ];
          
          setMarketData(statsData);
          console.log(`Successfully fetched data for ${coinbaseSymbol}:`, { price, volume, high24h, low24h });
        } else {
          console.warn(`No ticker or stats data available for ${coinbaseSymbol}`);
          setMarketData([]);
        }
        

      } catch (error) {
        console.error('Error fetching market data:', error);
        setMarketData([]);
        toast({
          title: "Market Data Error",
          description: "Failed to fetch market data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRealMarketData();
    
    // Update data every 5 seconds for more real-time updates
    const interval = setInterval(fetchRealMarketData, 5000);
    
    return () => clearInterval(interval);
  }, [symbol, coinbaseSymbol]);

  return (
    <div className="space-y-6">
      {/* Market stats */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Market Stats</h3>
          {loading && <span className="text-sm text-muted-foreground">Updating...</span>}
          {currentPrice > 0 && !loading && (
            <span className="text-sm text-green-500">● Live</span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {marketData.map((stat) => (
            <div key={stat.label} className="bg-muted/50 p-3 rounded-md">
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <div className="flex items-center">
                <span className="text-lg font-medium">{stat.value}</span>
                {stat.change !== undefined && (
                  <span className={`ml-1 ${stat.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {stat.change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      

    </div>
  );
};

export default MarketData;
