import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CoinbaseAPI } from "@/services/coinbaseApi";

interface OrderFormProps {
  symbol: string;
  accessToken?: string | null;
}

type OrderType = "market" | "limit";
type OrderSide = "buy" | "sell";

import { useEffect } from "react";

const OrderForm = ({ symbol, accessToken }: OrderFormProps) => {
  const { toast } = useToast();
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [orderSide, setOrderSide] = useState<OrderSide>("buy");
  const [amount, setAmount] = useState<string>("0.01");
  const [price, setPrice] = useState<string>("0.00");
  const [advanced, setAdvanced] = useState<boolean>(false);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  
  // Balances
  const baseCurrency = symbol.split('/')[0]; // e.g., "BTC" from "BTC/USDT"
  const quoteCurrency = symbol.split('/')[1]; // e.g., "USDT" from "BTC/USDT"
  const [baseBalance, setBaseBalance] = useState<number>(0);
  const [quoteBalance, setQuoteBalance] = useState<number>(0);

  // Convert our symbol format to Coinbase format
  const coinbaseSymbol = symbol.replace('/', '-').replace('USDT', 'USD');

  // Fetch real-time price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const ticker = await CoinbaseAPI.getTicker(coinbaseSymbol);
        if (ticker) {
          setCurrentPrice(parseFloat(ticker.price));
        }
      } catch (error) {
        console.error('Error fetching price:', error);
        toast({
          title: "Price Fetch Error",
          description: "Failed to fetch current price. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [coinbaseSymbol]);

  // Fetch real balances from Coinbase if accessToken is present
  useEffect(() => {
    if (!accessToken) return;
    const fetchBalances = async () => {
      try {
        const res = await fetch("https://api.coinbase.com/v2/accounts", {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'CB-VERSION': '2023-01-01'
          }
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch balances: ${res.status}`);
        }
        const data = await res.json();
        console.log('Fetched balances:', data); // Debug log
        if (data && data.data) {
          const base = data.data.find((acc: any) => acc.currency === baseCurrency);
          const quote = data.data.find((acc: any) => acc.currency === quoteCurrency);
          if (base) setBaseBalance(Number(base.balance.amount));
          if (quote) setQuoteBalance(Number(quote.balance.amount));
        }
      } catch (e) {
        console.error('Error fetching balances:', e);
        toast({
          title: "Error fetching balances",
          description: "Could not fetch account balances. Please try again.",
          variant: "destructive",
        });
      }
    };
    fetchBalances();
  }, [accessToken, symbol, baseCurrency, quoteCurrency, toast]);
  
  // Calculate total order value
  const calculateTotal = () => {
    if (!amount || isNaN(Number(amount))) return 0;
    const orderPrice = orderType === "market" ? currentPrice : Number(price);
    return Number(amount) * orderPrice;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!accessToken) {
      toast({
        title: "Login Required",
        description: "Please connect your Coinbase account to place orders",
        variant: "destructive",
      });
      return;
    }
    
    const total = calculateTotal();
    
    // Validate order
    if (Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    if (orderType === "limit" && (Number(price) <= 0 || isNaN(Number(price)))) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }
    
    if (orderSide === "buy" && total > quoteBalance) {
      toast({
        title: "Insufficient balance",
        description: `You don't have enough ${quoteCurrency}`,
        variant: "destructive",
      });
      return;
    }
    
    if (orderSide === "sell" && Number(amount) > baseBalance) {
      toast({
        title: "Insufficient balance",
        description: `You don't have enough ${baseCurrency}`,
        variant: "destructive",
      });
      return;
    }
    
    // Submit order
    toast({
      title: "Order placed successfully",
      description: `${orderSide.toUpperCase()} ${amount} ${baseCurrency} at ${orderType === "market" ? "market price" : `$${price}`}`,
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Tabs defaultValue="buy" onValueChange={(value) => setOrderSide(value as OrderSide)}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Buy</TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">Sell</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="orderType">Order Type</Label>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant={orderType === "market" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setOrderType("market")}
            >
              Market
            </Button>
            <Button 
              type="button" 
              variant={orderType === "limit" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setOrderType("limit")}
            >
              Limit
            </Button>
          </div>
        </div>
        
        {orderType === "limit" && (
          <div className="space-y-2">
            <Label htmlFor="price">Price ({quoteCurrency})</Label>
            <Input 
              id="price" 
              type="number" 
              placeholder="0.00" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              step="any"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="amount">Amount ({baseCurrency})</Label>
            <span className="text-sm text-muted-foreground">
              Balance: {baseBalance} {baseCurrency}
            </span>
          </div>
          <Input 
            id="amount" 
            type="number" 
            placeholder="0.00" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            step="any"
          />
        </div>
        
        <div className="space-y-1">
          <Label className="text-sm">Amount</Label>
          <div className="flex gap-2 pt-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setAmount((baseBalance * 0.25).toFixed(6))}>25%</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setAmount((baseBalance * 0.5).toFixed(6))}>50%</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setAmount((baseBalance * 0.75).toFixed(6))}>75%</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setAmount(baseBalance.toFixed(6))}>100%</Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between py-2">
          <span>Advanced</span>
          <Switch checked={advanced} onCheckedChange={setAdvanced} />
        </div>
        
        {advanced && (
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Stop Loss</Label>
                <span className="text-sm">Optional</span>
              </div>
              <Input type="number" placeholder="Stop price" step="any" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Take Profit</Label>
                <span className="text-sm">Optional</span>
              </div>
              <Input type="number" placeholder="Target price" step="any" />
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Total</span>
            <span>{calculateTotal().toFixed(2)} {quoteCurrency}</span>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          variant={orderSide === "buy" ? "default" : "destructive"}
        >
          {orderSide === "buy" ? "Buy" : "Sell"} {baseCurrency}
        </Button>
      </div>
    </form>
  );
};

export default OrderForm;
