
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TradingHistoryProps {
  symbol: string;
}

interface Trade {
  id: string;
  time: string;
  type: "buy" | "sell";
  price: number;
  amount: number;
  total: number;
  status: "completed" | "pending" | "canceled";
}

const TradingHistory = ({ symbol }: TradingHistoryProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  
  // Generate mock trade history based on symbol
  useEffect(() => {
    const baseCurrency = symbol.split('/')[0];
    const quoteCurrency = symbol.split('/')[1];
    const basePrice = baseCurrency === "BTC" ? 40000 : 
                      baseCurrency === "ETH" ? 2000 : 
                      baseCurrency === "SOL" ? 100 : 1;
    
    // Generate mock trades
    const mockTrades: Trade[] = [];
    const now = new Date();
    
    for (let i = 0; i < 10; i++) {
      const time = new Date(now);
      time.setMinutes(now.getMinutes() - i * 30); // Each trade 30 mins apart
      
      const type = Math.random() > 0.5 ? "buy" : "sell";
      const price = basePrice * (1 + (Math.random() * 0.1 - 0.05)); // ±5% from base price
      const amount = +(Math.random() * (baseCurrency === "BTC" ? 0.1 : baseCurrency === "ETH" ? 1 : 10)).toFixed(6);
      const total = price * amount;
      
      // Randomly assign status with higher chance of completed
      const statusRnd = Math.random();
      const status = statusRnd > 0.8 ? "pending" : statusRnd > 0.9 ? "canceled" : "completed";
      
      mockTrades.push({
        id: `T${Math.floor(Math.random() * 1000000)}`,
        time: time.toLocaleString(),
        type,
        price,
        amount,
        total,
        status,
      });
    }
    
    setTrades(mockTrades);
  }, [symbol]);
  
  if (trades.length === 0) {
    return <div className="text-center py-10">No trading history found</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell className="text-sm">{trade.time}</TableCell>
              <TableCell>
                <span className={trade.type === "buy" ? "text-green-500" : "text-red-500"}>
                  {trade.type.toUpperCase()}
                </span>
              </TableCell>
              <TableCell>${trade.price.toFixed(2)}</TableCell>
              <TableCell>{trade.amount.toFixed(6)}</TableCell>
              <TableCell>${trade.total.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={
                  trade.status === "completed" ? "default" : 
                  trade.status === "pending" ? "outline" : "destructive"
                }>
                  {trade.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TradingHistory;
