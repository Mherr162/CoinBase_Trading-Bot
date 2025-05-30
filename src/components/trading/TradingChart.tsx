import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { CoinbaseAPI } from "@/services/coinbaseApi";

interface TradingChartProps {
  symbol: string;
}

type TimeFrame = "1h" | "4h" | "1d";

const TradingChart = ({ symbol }: TradingChartProps) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1d");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [realTimePrice, setRealTimePrice] = useState<number | null>(null);
  const [noData, setNoData] = useState(false);

  // Convert our symbol format (BTC/USDT) to Coinbase format (BTC-USD)
  const coinbaseSymbol = symbol.replace('/', '-').replace('USDT', 'USD');

  // Fetch real-time price (always update)
  useEffect(() => {
    let mounted = true;
    const fetchTicker = async () => {
      try {
        const ticker = await CoinbaseAPI.getTicker(coinbaseSymbol);
        if (ticker && mounted) {
          setRealTimePrice(Number(ticker.price));
        }
      } catch {}
    };
    fetchTicker();
    const interval = setInterval(fetchTicker, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, [coinbaseSymbol]);

  useEffect(() => {
    const fetchRealData = async () => {
      setLoading(true);
      try {
        // Map timeframes to granularity (in seconds)
        const granularityMap = {
          "1h": 300,   // 5 minutes
          "4h": 900,   // 15 minutes
          "1d": 3600,  // 1 hour

        };
        let granularity = granularityMap[timeFrame];
        let candles;
        
        // Calculate start and end times for each timeframe
        const now = new Date();
        let start;
        let end = now.toISOString();
        if (timeFrame === "1h") {
          // Last full hour
          const endDate = new Date(now);
          endDate.setMinutes(0, 0, 0);
          const startDate = new Date(endDate);
          startDate.setHours(endDate.getHours() - 1);
          start = startDate.toISOString();
          end = endDate.toISOString();
        } else if (timeFrame === "4h") {
          // Last 4 full hours
          const endDate = new Date(now);
          endDate.setMinutes(0, 0, 0);
          const startDate = new Date(endDate);
          startDate.setHours(endDate.getHours() - 4);
          start = startDate.toISOString();
          end = endDate.toISOString();
        } else if (timeFrame === "1d") {
          // Last 24 full hours
          const endDate = new Date(now);
          endDate.setMinutes(0, 0, 0);
          const startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 1);
          start = startDate.toISOString();
          end = endDate.toISOString();

        }

        candles = await CoinbaseAPI.getCandles(coinbaseSymbol, granularity, start, end);
        console.log('Candles fetched:', { timeFrame, candles, start, end, granularity, coinbaseSymbol });
        
        if (candles.length > 0) {
          let formattedData = candles.slice(-50).map((candle) => ({
            time: new Date(candle.timestamp * 1000).toLocaleTimeString(),
            value: candle.close,
            volume: candle.volume,
            high: candle.high,
            low: candle.low,
            open: candle.open
          }));
          // Append real-time price as last point for all timeframes if it's newer than last candle
          if (realTimePrice && formattedData.length > 0) {
            const lastCandleTime = candles[candles.length - 1].timestamp * 1000;
            if (Date.now() > lastCandleTime) {
              formattedData.push({
                time: new Date().toLocaleTimeString(),
                value: realTimePrice,
                volume: 0,
                high: realTimePrice,
                low: realTimePrice,
                open: realTimePrice
              });
            }
          }
          setChartData(formattedData);
          setNoData(false);
        } else {
          setChartData([]);
          setNoData(true);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData([]);
        setNoData(true);
      } finally {
        setLoading(false);
      }
    };

    const generateMockData = () => {
      const data = [];
      const baseValue = symbol.includes("BTC") ? 40000 : symbol.includes("ETH") ? 2000 : 1;
      const volatility = symbol.includes("BTC") ? 2000 : symbol.includes("ETH") ? 100 : 0.1;
      
      const dataPoints = timeFrame === "1h" ? 60 : 
                          timeFrame === "4h" ? 48 : 
                          timeFrame === "1d" ? 24 : 14;
      
      for (let i = 0; i < dataPoints; i++) {
        const time = new Date();
        
        if (timeFrame === "1h") {
          time.setMinutes(time.getMinutes() - (dataPoints - i));
        } else if (timeFrame === "4h") {
          time.setMinutes(time.getMinutes() - (dataPoints - i) * 15);
        } else if (timeFrame === "1d") {
          time.setHours(time.getHours() - (dataPoints - i));
        } else {
          time.setDate(time.getDate() - (dataPoints - i));
        }
        
        const randomChange = (Math.random() - 0.5) * volatility;
        const value = baseValue + randomChange;
        
        data.push({
          time: time.toLocaleTimeString(),
          value: parseFloat(value.toFixed(2)),
          volume: Math.floor(Math.random() * 100)
        });
      }
      
      setChartData(data);
    };
    
    fetchRealData();
  }, [symbol, timeFrame, coinbaseSymbol]);

  // Always show real-time price in the header if available
  const headerPrice = realTimePrice ?? (chartData.length > 0 ? chartData[chartData.length - 1].value : 0);
  const priceChange = chartData.length > 1 
    ? chartData[chartData.length - 1].value - chartData[0].value 
    : 0;
  const priceChangePercent = chartData.length > 1 
    ? (priceChange / chartData[0].value) * 100 
    : 0;
  const isPriceUp = priceChange >= 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col">
          <div className="text-3xl font-bold">
            ${headerPrice.toLocaleString()}
            {loading && <span className="text-sm text-muted-foreground ml-2">Loading...</span>}
          </div>
          <div className={`flex items-center ${isPriceUp ? "text-green-500" : "text-red-500"}`}>
            {isPriceUp ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span className="ml-1">
              ${Math.abs(priceChange).toFixed(2)} ({Math.abs(priceChangePercent).toFixed(2)}%)
            </span>
          </div>
        </div>
        <ToggleGroup type="single" value={timeFrame} onValueChange={(value) => value && setTimeFrame(value as TimeFrame)}>
          <ToggleGroupItem value="1h">1H</ToggleGroupItem>
          <ToggleGroupItem value="4h">4H</ToggleGroupItem>
          <ToggleGroupItem value="1d">1D</ToggleGroupItem>

        </ToggleGroup>
      </div>
      
      <div className="h-[300px] w-full">
        {noData ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-100 rounded-lg border border-dashed border-gray-300 p-8">
            <span className="text-lg font-semibold mb-2">No data available for this pair.</span>
            <span className="text-sm">This trading pair may not be supported or has no recent activity.</span>
            <span className="text-sm mt-2">Try selecting a different trading pair.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip formatter={(value) => [`$${value}`, "Price"]} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isPriceUp ? "#10b981" : "#ef4444"} 
                strokeWidth={2} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TradingChart;
