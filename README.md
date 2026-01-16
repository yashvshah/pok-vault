# POKVault Dashboard

A React + TypeScript application for managing and interacting with POKVault on BSC. POKVault is an ERC4626 vault that enables early exits for prediction market arbitragers across Polymarket (Polygon) and Opinion (BSC, bridged via Axelar GMP).

## Features

### Vault Page
- **Deposit & Withdraw**: Users can deposit USDT to earn yield and withdraw their shares
- **Real-time Vault Stats**: Display APY, total assets, and vault performance metrics
- **Activity History**: Monitor all vault deposits, withdrawals, and new outcome token pairs
- **Multi-Chain Support**: Seamless switching between Polygon and BSC networks

### Markets Page
- **Supported Markets**: View all active markets enabled for early exit arbitrage (defaults to showing "Allowed" status only)
- **Market Details**: Display actual market questions, outcome tokens, and status (✅ Active, ⏸️ Paused, 🔴 Expired)
- **Cross-Market Pairs**: See which Polymarket/Opinion pairs are configured
- **Market Filtering**: Search markets and filter by status (All, Allowed, Paused, Expired)
- **Token Balances**: View your Polymarket and Opinion token balances with automatic Gnosis Safe detection
- **Cross-Chain Bridging**: Bridge Polymarket tokens between Polygon and BSC via Axelar GMP
- **Merge & Exit**: Combine opposite outcome tokens and exit early for discounted USDT
- **Split & Acquire**: Use USDT to acquire opposite outcome token pairs for arbitrage
- **Gnosis Safe Support**: Automatic detection and support for Polymarket and Opinion Safe wallets
  - Polymarket Safe (Polygon): Derived from EOA using known factory
  - Opinion Safe (BSC): Fetched from Safe API and validated against Opinion factory
  - Toggle between EOA and Safe for transactions

### Markets Page - Owner Actions (Owner Only)
When the connected wallet is the vault owner, an additional "Owner Actions" tab appears for each market, allowing:
- **Remove Pair**: Remove an opposite outcome token pair from the vault
- **Start Redeem Process**: Initiate redemption after market expiry
- **Report Profit/Loss**: Report profit or loss amounts for a specific pair
- **Report & Remove Pair**: Report profit/loss and remove the pair in one transaction

### Manage Markets Page (Owner Only)
- **Add Market Pairs**: Configure new Polymarket/Opinion market pairs for arbitrage
- **Market Validation**: Automatically fetch and validate market details from both platforms
- **Early Exit Contracts**: Create and configure early exit amount contracts with custom APY and expiry settings
- **Token Pair Management**: Add opposite outcome token pairs (YES Poly + NO Opinion, NO Poly + YES Opinion)
- **Real-time Status**: View isAllowed, isPaused, early exited amounts, and contract addresses for configured pairs

### Web3 Integration
- **Wallet Connection**: Connect via RainbowKit with support for MetaMask, WalletConnect, Coinbase Wallet, and more
- **Multi-Network Support**: Automatic network switching for deposits and withdrawals
- **Smart Contract Interactions**: Direct interaction with vault and early exit contracts

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Web3**: Wagmi v2 + Viem + RainbowKit
- **Data Fetching**: TanStack React Query
- **Styling**: Tailwind CSS v4 (custom primary color: #EC6769)
- **Routing**: React Router v7
- **Blockchain Data**: The Graph protocol subgraph queries
- **External APIs**: 
  - Polymarket Gamma API (market data)
  - Opinion API (market data)
  - Custom middleware for CORS handling

## Project Structure

```
src/
├── pages/                # Application pages
│   ├── valut.tsx                     # Main vault page (deposit/withdraw)
│   ├── marketsPage.tsx               # Markets page with merge/exit, split/acquire, owner actions
│   └── ManageMarketsPage.tsx         # Market management (owner only)
├── components/           # React components
│   ├── Header.tsx                    # Navigation header
│   ├── Footer.tsx                    # Page footer
│   ├── MarketCard.tsx                # Market display card with dynamic tabs
│   ├── MarketActionCard.tsx          # Market interaction card
│   ├── MarketFilters.tsx             # Market filtering UI
│   ├── BalanceItem.tsx               # Token balance display
│   ├── ConnectButton.tsx             # Wallet connection button
│   └── Tabs/                         # Tab components
├── hooks/                # Custom React hooks
│   ├── useDeposits.ts                # Deposit data fetching
│   ├── useWithdrawals.ts             # Withdrawal data fetching
│   ├── useNewOutcomePairs.ts         # New outcome pairs data
│   ├── usePausedOutcomePairs.ts      # Paused outcome pairs data
│   ├── useRemovedOutcomePairs.ts     # Removed outcome pairs data
│   ├── useProfitLossReported.ts      # Profit/loss reporting events
│   ├── useEarlyExits.ts              # Early exit events
│   ├── useSplitOutcomeTokens.ts      # Split outcome token events
│   ├── useSupportedMarkets.ts        # Combined markets data with status
│   ├── useMarketInfo.ts              # Single market info
│   ├── useMarketInfos.ts             # Multiple market info fetching
│   ├── useVaultActivities.ts         # Combined activities hook
│   ├── useAPY.ts                     # Vault APY calculation
│   ├── useSafeAddresses.ts           # Gnosis Safe detection hook
│   ├── useSafeWrite.ts               # Safe transaction writing
│   └── useErc1155Balance.ts          # ERC1155 balance reading
├── services/             # External service integrations
│   ├── ctfExchange.ts                # CTF exchange contract calls
│   ├── polymarket.ts                 # Polymarket API client
│   ├── opinion.ts                    # Opinion API client
│   └── marketInfo.ts                 # Market info utilities
├── utils/                # Utility functions
│   └── safe.ts                       # Gnosis Safe address derivation
├── types/                # TypeScript type definitions
│   └── vault.ts                      # Vault activity types
├── config/               # Configuration files
│   ├── subgraph.ts                   # GraphQL queries and client
│   ├── addresses.ts                  # Contract addresses and constants
│   └── safe.ts                       # Safe factory addresses
├── abi/                  # Contract ABIs
│   ├── EarlyExitVault.json
│   ├── EarlyExitAmountBasedOnFixedAPY.json
│   ├── EarlyExitAmountFactoryBasedOnFixedAPY.json
│   ├── CTFExchange.json
│   ├── NegRiskCTFExchange.json
│   └── GnosisSafe.json
├── App.tsx               # Main app component with routing
├── Web3Provider.tsx      # Web3 context provider
└── main.tsx              # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pok-vault
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add:
- `VITE_OPINION_API_KEY`: Your Opinion API key
- `VITE_WALLETCONNECT_PROJECT_ID`: Your WalletConnect project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com/)

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Configuration

### Network Configuration
The app supports multiple networks:
- **BSC Mainnet**: Primary network for vault operations
- **Polygon Mainnet**: Source chain for Polymarket ERC1155 tokens (bridged to BSC)
- Automatic network switching based on user actions; Polymarket conditional ERC1155 tokens must be bridged from Polygon to BSC for early exit

### Contract Addresses (see `src/config/addresses.ts`)
- **Vault Address**: Main ERC4626 vault contract
- **Early Exit Factory**: Factory for creating early exit amount contracts
- **Token Addresses**: USDT (BSC), Polymarket ERC1155 (bridged from Polygon), Opinion ERC1155 (BSC)

### API Configuration
The application uses a middleware proxy to avoid CORS issues:

- **Development**: `http://localhost:3001` (local proxy server)
- **Production**: `https://pokvault-middleware-server.vercel.app` (deployed proxy)

API endpoints:
- `/api/polymarket/markets/slug/:slug` - Fetch Polymarket market by slug
- `/api/opinion/market/:id` - Fetch Opinion market by ID

### Subgraph Configuration
- **Endpoint**: The Graph protocol endpoint for vault events
- **Queries**: Deposits, withdrawals, and new opposite outcome token pairs

## How It Works

### Vault Operations
1. **Deposits**: Users deposit USDT into the vault and receive vault shares (ERC4626 standard)
2. **Withdrawals**: Users redeem their shares to receive back their USDT plus earned yield
3. **APY Calculation**: Real-time APY calculation based on vault performance

### Markets Page Features
1. **View Markets**: Browse all configured prediction market pairs with filtering and search
2. **Token Balances**: Automatic display of your ERC1155 token balances across Polygon and BSC
3. **Gnosis Safe Integration**:
   - Polymarket Safe (Polygon): Automatically derived from your EOA
   - Opinion Safe (BSC): Fetched from Safe API and validated
   - Toggle between EOA and Safe for each transaction
4. **Cross-Chain Bridging**: Bridge Polymarket tokens between Polygon and BSC via Axelar GMP
5. **Merge & Exit**: Arbitragers combine opposite outcome tokens to exit early at a discounted rate
6. **Split & Acquire**: Use USDT to acquire opposite outcome token pairs for arbitrage opportunities

### Owner Actions (Markets Page)
When connected as vault owner, each market displays an "Owner Actions" tab with:
1. **Remove Pair**: Remove an outcome pair from vault operations
2. **Start Redeem Process**: Initiate post-expiry redemption for a pair
3. **Report Profit/Loss**: Submit profit or loss amounts for vault accounting
4. **Report & Remove**: Atomically report and remove a pair in one transaction

### Market Management (Owner Only)
1. **Market Discovery**: Enter Polymarket market slug and Opinion market ID
2. **Validation**: App fetches and validates market details from both APIs
3. **Contract Creation**: Create early exit amount contracts with:
   - Market expiry timestamp
   - Expected APY (basis points)
   - Fixed time after expiry (hours)
4. **Token Pair Configuration**: Add opposite outcome token pairs:
   - YES Polymarket + NO Opinion
   - NO Polymarket + YES Opinion
5. **Monitoring**: View pair status (allowed/paused), early exited amounts, and contract addresses

### Early Exit Flow
1. Arbitragers acquire opposite outcome tokens across Polymarket and Opinion
2. They redeem these tokens through the vault for discounted USDT
3. Vault depositors earn yield from the arbitrage profit margins
4. Early exit amount is calculated based on configured APY and time remaining

### Data Fetching
1. **Subgraph**: Fetches on-chain vault events (deposits, withdrawals, new pairs)
2. **Market APIs**: Resolves token IDs to human-readable market questions
3. **Contract Calls**: Reads vault state, balances, and configuration
4. **React Query**: Efficient caching and automatic refetching for real-time data

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

### Code Style

- Strict TypeScript with comprehensive type checking
- ESLint with React and TypeScript rules
- Prettier for code formatting (via ESLint)

### Architecture Patterns

- **Custom Hooks**: Data fetching logic separated into reusable hooks
- **Service Layer**: External API and contract interactions abstracted into services
- **Type Safety**: Comprehensive TypeScript types for all data structures
- **Error Handling**: Graceful error handling with user-friendly messages
- **Array Destructuring**: Contract tuple responses properly mapped to structured objects
- **Decimal Handling**: Proper conversion for different token decimals (Polymarket: 6, Opinion: 18, USDT: 18)
- **Owner Detection**: Automatic vault owner detection via `owner()` contract call
- **Conditional UI**: Owner-specific actions only visible to vault owner
- **Safe Integration**: Automatic Gnosis Safe detection and transaction routing
- **Multi-Chain Operations**: Seamless chain switching for Polygon and BSC operations
- **Status Management**: Market pair status tracking (allowed, paused, removed)

## Key Technical Details

### Token Decimals
- **Polymarket ERC1155**: 6 decimals
- **Opinion ERC1155**: 18 decimals  
- **USDT**: 18 decimals
- **Early Exited Amounts**: Displayed with 18 decimal formatting

### Contract Integration
The app interfaces with several contracts:
- **EarlyExitVault**: Main vault contract (ERC4626) with owner-controlled pair management
  - `owner()`: Returns vault owner address
  - `removeAllowedOppositeOutcomeTokens()`: Remove outcome pair (owner only)
  - `startRedeemProcess()`: Start post-expiry redemption (owner only)
  - `reportProfitOrLoss()`: Report profits/losses (owner only)
  - `reportProfitOrLossAndRemovePair()`: Report and remove atomically (owner only)
  - `earlyExit()`: Arbitragers merge opposite tokens for early exit
  - `splitOppositeOutcomeTokens()`: Acquire opposite outcome pairs
  - `estimateEarlyExitAmount()`: Calculate exit amount preview
  - `estimateSplitOppositeOutcomeTokensAmount()`: Calculate split amount preview
- **EarlyExitAmountBasedOnFixedAPY**: Calculates early exit amounts based on APY and time
- **EarlyExitAmountFactoryBasedOnFixedAPY**: Creates new early exit contracts
- **CTF Exchange**: Polymarket conditional token framework
- **NegRisk CTF Exchange**: Negative risk CTF implementation
- **Gnosis Safe**: Multi-sig wallet support for Polymarket and Opinion accounts

### Solidity Struct Mapping
Smart contracts return structs as arrays. The app maps them to TypeScript interfaces:
```typescript
// Contract returns: [bool, bool, uint8, uint8, address, uint256]
// Mapped to:
interface OppositeOutcomeTokensInfo {
  isAllowed: boolean;      // [0]
  isPaused: boolean;       // [1]
  decimalsA: number;       // [2]
  decimalsB: number;       // [3]
  earlyExitAmountContract: string;  // [4]
  earlyExitedAmount: bigint;       // [5]
}
```

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for new data structures
3. Write descriptive commit messages
4. Test your changes thoroughly
5. Ensure decimal handling is correct for all token types
6. Maintain proper array-to-object mapping for contract responses

## Domain-Specific Notes

### POKVault Business Logic
- **Depositors**: Earn yield by providing liquidity for arbitragers to exit early
- **Arbitragers**: Pay a discount (based on APY) to exit positions immediately instead of waiting for market resolution
- **Discount Calculation**: Based on expected APY and time remaining until market expiry plus fixed time
- **Cross-Chain**: Polymarket operates on Polygon, Opinion on BSC (bridged via Axelar GMP)

### Market Pairing Rules
- Markets must represent the same real-world event
- Opposite outcome tokens must be configured (YES/NO pairs)
- Each pair requires a dedicated early exit amount contract
- Contract addresses are sorted lexicographically before hashing for lookups

## Troubleshooting

### Common Issues

**"Network not supported"**
- Make sure wallet is connected to BSC for vault operations
- Switch networks when prompted by the app

**"Cannot read properties of undefined"**
- Check that contract responses are properly destructured from arrays
- Verify middleware server is running for API requests

**Incorrect decimal display**
- Verify token decimal constants match actual token implementations
- Check formatEarlyExitedAmount uses 18 decimals (1e18)

**Market info not loading**
- Ensure middleware server has correct CORS configuration
- Check that market IDs/slugs are valid and markets exist

## License

This project is part of the POKVault ecosystem. See the main repository for licensing information.
