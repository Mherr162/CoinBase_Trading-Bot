import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TradingChart from "@/components/trading/TradingChart";
import OrderForm from "@/components/trading/OrderForm";
import MarketData from "@/components/trading/MarketData";
import CoinSelection from "@/components/trading/CoinSelection";
import LoginCoinbase from "@/components/LoginCoinbase";


const Index = () => {
  const [selectedCoin, setSelectedCoin] = useState("BTC/USDT");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Trading Dashboard</h1>
          <p className="text-muted-foreground">Monitor markets and execute trades in real-time</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with coin selection */}
          <div className="lg:col-span-1">
            <CoinSelection 
              selectedCoin={selectedCoin} 
              onCoinChange={setSelectedCoin} 
            />
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Trading chart card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">
                  {selectedCoin} Price Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradingChart symbol={selectedCoin} />
              </CardContent>
            </Card>
            
            {/* Trading interface tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">New Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LoginCoinbase onLoginSuccess={setAccessToken} />
                    <OrderForm symbol={selectedCoin} accessToken={accessToken} />
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                <Tabs defaultValue="market">
                  <TabsList className="mb-2">
                    <TabsTrigger value="market">Market Data</TabsTrigger>
                  </TabsList>
                  <TabsContent value="market">
                    <Card>
                      <CardContent className="pt-6">
                        <MarketData symbol={selectedCoin} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
