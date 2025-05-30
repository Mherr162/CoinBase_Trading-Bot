
import { useState, useEffect } from "react";
import { CoinbaseAPI } from "@/services/coinbaseApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Search, Star } from "lucide-react";

interface CoinSelectionProps {
  selectedCoin: string;
  onCoinChange: (coin: string) => void;
}

interface Coin {
  symbol: string;
  name: string;
  price: number;
  change: number;
  isFavorite: boolean;
}

const CoinSelection = ({ selectedCoin, onCoinChange }: CoinSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [favorites, setFavorites] = useState<string[]>(["BTC/USDT", "ETH/USDT"]);
  
  // Coin list with real-time prices
  const initialCoins: Coin[] = [
    { symbol: "BTC/USDT", name: "Bitcoin", price: 0, change: 0, isFavorite: favorites.includes("BTC/USDT") },
    { symbol: "ETH/USDT", name: "Ethereum", price: 0, change: 0, isFavorite: favorites.includes("ETH/USDT") },
    { symbol: "SOL/USDT", name: "Solana", price: 0, change: 0, isFavorite: favorites.includes("SOL/USDT") },
    { symbol: "ADA/USDT", name: "Cardano", price: 0, change: 0, isFavorite: favorites.includes("ADA/USDT") },
    { symbol: "DOT/USDT", name: "Polkadot", price: 0, change: 0, isFavorite: favorites.includes("DOT/USDT") },
    { symbol: "XRP/USDT", name: "Ripple", price: 0, change: 0, isFavorite: favorites.includes("XRP/USDT") },
    { symbol: "DOGE/USDT", name: "Dogecoin", price: 0, change: 0, isFavorite: favorites.includes("DOGE/USDT") },
    { symbol: "LINK/USDT", name: "Chainlink", price: 0, change: 0, isFavorite: favorites.includes("LINK/USDT") },
    { symbol: "UNI/USDT", name: "Uniswap", price: 0, change: 0, isFavorite: favorites.includes("UNI/USDT") },
    { symbol: "AVAX/USDT", name: "Avalanche", price: 0, change: 0, isFavorite: favorites.includes("AVAX/USDT") },
  ];
  const [coins, setCoins] = useState<Coin[]>(initialCoins);

  // Fetch real-time prices from Coinbase every 5 seconds
  useEffect(() => {
    let mounted = true;
    let prevPrices: Record<string, number> = {};
    const fetchPrices = async () => {
      try {
        const tickers = await Promise.all(initialCoins.map(async (c) => {
          const coinbaseSymbol = c.symbol.replace('/', '-').replace('USDT', 'USD');
          const ticker = await CoinbaseAPI.getTicker(coinbaseSymbol);
          return {
            symbol: c.symbol,
            price: ticker ? Number(ticker.price) : c.price
          };
        }));
        const prices: Record<string, number> = {};
        tickers.forEach(t => { prices[t.symbol] = t.price; });
        setCoins(prevCoins => prevCoins.map(coin => {
          const newPrice = prices[coin.symbol] ?? coin.price;
          const prevPrice = prevPrices[coin.symbol] ?? coin.price;
          const change = prevPrice && prevPrice !== 0 ? (((newPrice - prevPrice) / prevPrice) * 100) : 0;
          return {
            ...coin,
            price: newPrice,
            change: Number(change.toFixed(2)),
            isFavorite: favorites.includes(coin.symbol),
          };
        }));
        prevPrices = prices;
      } catch (e) {
        // Ignore errors for now
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites]);
  
  // Filter coins based on search and active tab
  const filteredCoins = coins.filter(coin => {
    const matchesSearch = coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          coin.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "favorites") {
      return coin.isFavorite && matchesSearch;
    }
    
    return matchesSearch;
  });
  
  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol) 
        : [...prev, symbol]
    );
  };
  
  return (
    <div className="bg-card p-4 rounded-lg border h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Markets</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search coins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="mb-3 flex">
        <Button
          variant={activeTab === "all" ? "default" : "outline"}
          size="sm"
          className="flex-1 rounded-r-none"
          onClick={() => setActiveTab("all")}
        >
          All
        </Button>
        <Button
          variant={activeTab === "favorites" ? "default" : "outline"}
          size="sm"
          className="flex-1 rounded-l-none"
          onClick={() => setActiveTab("favorites")}
        >
          Favorites
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[500px]">
          <div className="space-y-1">
            {filteredCoins.map((coin) => (
              <div
                key={coin.symbol}
                className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted ${
                  selectedCoin === coin.symbol ? "bg-muted" : ""
                }`}
                onClick={() => onCoinChange(coin.symbol)}
              >
                <div className="flex items-center">
                  <button
                    className={`mr-2 focus:outline-none ${coin.isFavorite ? "text-yellow-400" : "text-muted-foreground"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(coin.symbol);
                    }}
                  >
                    <Star size={16} fill={coin.isFavorite ? "currentColor" : "none"} />
                  </button>
                  <div>
                    <div className="font-medium">{coin.symbol}</div>
                    <div className="text-xs text-muted-foreground">{coin.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div>${coin.price.toFixed(2)}</div>
                  <div className={coin.change >= 0 ? "text-green-500 text-xs" : "text-red-500 text-xs"}>
                    {coin.change >= 0 ? "+" : ""}{coin.change}%
                  </div>
                </div>
              </div>
            ))}
            
            {filteredCoins.length === 0 && (
              <div className="py-6 text-center text-muted-foreground">
                No coins found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CoinSelection;
