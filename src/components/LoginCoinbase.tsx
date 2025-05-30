import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface LoginCoinbaseProps {
  onLoginSuccess: (accessToken: string) => void;
}

const COINBASE_AUTH_URL = "https://www.coinbase.com/oauth/authorize";
const CLIENT_ID = import.meta.env.VITE_COINBASE_CLIENT_ID || "";
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || "http://localhost:3000";
const SCOPES = "wallet:accounts:read wallet:transactions:read";

const LoginCoinbase = ({ onLoginSuccess }: LoginCoinbaseProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for access token in URL hash
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        onLoginSuccess(accessToken);
        // Clean up the URL and redirect to the main app
        window.history.replaceState({}, document.title, window.location.pathname);
        toast({
          title: "Login Successful",
          description: "Successfully connected to Coinbase",
        });
      }
    }
  }, [onLoginSuccess, toast]);

  const handleLogin = () => {
    if (!CLIENT_ID) {
      toast({
        title: "Configuration Error",
        description: "Coinbase Client ID is not configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Construct the OAuth2 URL with state parameter for security
      const state = Math.random().toString(36).substring(7);
      const url = `${COINBASE_AUTH_URL}?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&scope=${encodeURIComponent(SCOPES)}&state=${state}`;
      window.location.href = url;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "Failed to initiate login process. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 gap-4 border rounded-lg bg-muted/50">
      <h2 className="text-xl font-semibold">Connect to Coinbase</h2>
      <p className="text-sm text-muted-foreground text-center">
        Login to your Coinbase account to connect your wallet and access trading features.
      </p>
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleLogin}
        disabled={isLoading || !CLIENT_ID}
      >
        {isLoading ? "Redirecting..." : "Login with Coinbase"}
      </button>
      {!CLIENT_ID && (
        <p className="text-xs text-red-500 mt-2">
          Coinbase Client ID is not configured
        </p>
      )}
    </div>
  );
};

export default LoginCoinbase;
