import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface LoginCoinbaseProps {
  onLoginSuccess: (accessToken: string) => void;
}

const COINBASE_AUTH_URL = "https://www.coinbase.com/oauth/authorize";
const CLIENT_ID = import.meta.env.VITE_COINBASE_CLIENT_ID || "";
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || "http://localhost:8080";
const SCOPES = "wallet:accounts:read wallet:transactions:read wallet:user:read";

const LoginCoinbase = ({ onLoginSuccess }: LoginCoinbaseProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Validate token by making a test API call
  const validateToken = async (token: string) => {
    try {
      const response = await fetch('https://api.coinbase.com/v2/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'CB-VERSION': '2024-01-01'
        }
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('coinbase_token');
      return false;
    }
  };

  useEffect(() => {
    const handleAuth = async () => {
      // Check for access token in URL hash
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      const state = params.get('state');
      const savedState = localStorage.getItem('oauth_state');

      // Clean up state
      localStorage.removeItem('oauth_state');

      // Clean up URL immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      if (error || errorDescription) {
        toast({
          title: "Login Failed",
          description: errorDescription || "Failed to connect to Coinbase",
          variant: "destructive",
        });
        return;
      }

      if (accessToken) {
        if (state !== savedState) {
          toast({
            title: "Security Error",
            description: "OAuth state mismatch. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setIsLoading(true);
        try {
          const isValid = await validateToken(accessToken);
          if (isValid) {
            localStorage.setItem('coinbase_token', accessToken);
            onLoginSuccess(accessToken);
            toast({
              title: "Login Successful",
              description: "Successfully connected to Coinbase",
            });
          } else {
            throw new Error('Invalid token received');
          }
        } catch (error) {
          toast({
            title: "Authentication Error",
            description: "Failed to validate Coinbase connection",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleAuth();

    // Check for existing token on mount
    const checkExistingToken = async () => {
      const existingToken = localStorage.getItem('coinbase_token');
      if (existingToken) {
        setIsLoading(true);
        const isValid = await validateToken(existingToken);
        if (isValid) {
          onLoginSuccess(existingToken);
        }
        setIsLoading(false);
      }
    };

    checkExistingToken();
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

    try {
      // Generate a random state parameter for security
      const state = Math.random().toString(36).substring(7);
      localStorage.setItem('oauth_state', state);

      const url = new URL(COINBASE_AUTH_URL);
      url.searchParams.append('response_type', 'token');
      url.searchParams.append('client_id', CLIENT_ID);
      url.searchParams.append('redirect_uri', REDIRECT_URI);
      url.searchParams.append('scope', SCOPES);
      url.searchParams.append('state', state);
      url.searchParams.append('account', 'all');

      window.location.href = url.toString();
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "Failed to initiate login process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('coinbase_token');
    onLoginSuccess(null);
    toast({
      title: "Logged Out",
      description: "Successfully disconnected from Coinbase",
    });
  };

  const existingToken = localStorage.getItem('coinbase_token');

  return (
    <div className="flex flex-col items-center p-6 gap-4 border rounded-lg bg-muted/50">
      <h2 className="text-xl font-semibold">Coinbase Connection</h2>
      <p className="text-sm text-muted-foreground text-center">
        {existingToken 
          ? "Connected to Coinbase. You can now trade."
          : "Connect your Coinbase account to access trading features."
        }
      </p>
      {existingToken ? (
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Checking connection..." : "Disconnect Coinbase"}
        </Button>
      ) : (
        <Button
          className="w-full"
          onClick={handleLogin}
          disabled={isLoading || !CLIENT_ID}
        >
          {isLoading ? "Connecting..." : "Connect Coinbase"}
        </Button>
      )}
      {!CLIENT_ID && (
        <p className="text-xs text-destructive">
          Coinbase Client ID is not configured
        </p>
      )}
    </div>
  );
};

export default LoginCoinbase;