# Coinbase Trading Bot

A modern web app for monitoring cryptocurrency markets and executing trades on Coinbase. Built with React, TypeScript, Vite, and Shadcn UI. Includes OAuth login, real-time price charts, market data, order placement, and robust error handling.

## Features

- **Coinbase OAuth Login**: Securely connect your Coinbase account to access trading features and balances.
- **Real-Time Market Data**: View live prices, 24h statistics, and order book data for supported trading pairs.
- **Interactive Trading Charts**: Visualize historical and real-time price movements with dynamic charting.
- **Order Placement**: Place market and limit buy/sell orders directly from the dashboard.
- **Balance Display**: See your available balances for each trading pair.
- **Favorites and Coin Search**: Quickly find and favorite your most traded coins.
- **Robust Error Handling**: User-friendly toasts and retry logic for API/network errors and Coinbase outages.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Setup
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd CoinBase_Trading-Bot
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` (if provided) or create a `.env` file:
     ```env
     VITE_COINBASE_CLIENT_ID=your_coinbase_client_id
     VITE_REDIRECT_URI=http://localhost:8080
     ```
   - Register your redirect URI in the [Coinbase developer dashboard](https://developers.coinbase.com/).

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app will be available at [http://localhost:8080](http://localhost:8080) (or your configured port).

## Usage
- **Login:** Click "Login with Coinbase" and authorize the app.
- **Select Market:** Choose a trading pair from the sidebar.
- **View Data:** See real-time prices, stats, and interactive charts.
- **Place Orders:** Use the order form to buy/sell (requires login).
- **Favorites:** Mark coins as favorites for quick access.

## Error Handling
- If Coinbase is down or an API error occurs, the app will show a clear toast notification.
- Automatic retry logic is implemented for transient errors.
- Make sure your redirect URI and client ID are correctly set up if you encounter OAuth issues.

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Shadcn UI
- **API:** Coinbase REST API
- **State & Data:** React hooks, custom services

## Troubleshooting
- **OAuth 400 errors:** Ensure your redirect URI in `.env` matches exactly with what is registered on Coinbase.
- **Port issues:** If port 8080 is in use, kill the process or change the port in your `.env` and Coinbase settings.
- **Coinbase 500 errors:** This is a Coinbase outage. Wait and retry later.

## License
MIT

---

For questions or contributions, open an issue or pull request!