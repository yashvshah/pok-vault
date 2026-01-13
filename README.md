# POKVault Dashboard

A React + TypeScript application for monitoring POKVault activities on Polygon. POKVault is an ERC4626 vault that enables early exits for prediction market arbitragers across Polymarket (Polygon) and Opinion (BSC, bridged via Axelar GMP).

## Features

- **Real-time Vault Activities**: Monitor deposits, withdrawals, and new outcome token pairs
- **Market Information**: Display actual market questions instead of token IDs using Polymarket API
- **Web3 Integration**: Connect to Polygon network using Wagmi and RainbowKit
- **Responsive Design**: Clean, modern UI built with Tailwind CSS

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Web3**: Wagmi + Viem + RainbowKit
- **Data Fetching**: TanStack React Query
- **Styling**: Tailwind CSS v4
- **Blockchain Data**: The Graph protocol subgraph queries
- **External APIs**: Polymarket Gamma API

## Project Structure

```
src/
├── components/          # React components
│   ├── VaultActivitiesTable.tsx    # Main activities table
│   └── VaultActivitiesTest.tsx     # Test component (legacy)
├── hooks/              # Custom React hooks
│   ├── useDeposits.ts              # Deposit data fetching
│   ├── useWithdrawals.ts           # Withdrawal data fetching
│   ├── useNewOutcomePairs.ts       # New outcome pairs data
│   ├── useMarketInfo.ts            # Single market info (legacy)
│   ├── useMarketInfos.ts           # Multiple market info fetching
│   └── useVaultActivities.ts       # Combined activities hook
├── services/           # External service integrations
│   ├── ctfExchange.ts               # CTF exchange contract calls
│   └── polymarket.ts               # Polymarket API client
├── types/              # TypeScript type definitions
│   └── vault.ts                    # Vault activity types
├── config/             # Configuration files
│   └── subgraph.ts                 # GraphQL queries and client
├── abi/                # Contract ABIs
│   ├── CTFExchange.json
│   └── NegRiskCTFExchange.json
└── Web3Provider.tsx    # Web3 context provider
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

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5174](http://localhost:5174) in your browser

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Configuration

The app is configured to work with:
- **Network**: Polygon Mainnet
- **Subgraph**: The Graph protocol endpoint for vault events
- **APIs**: Polymarket Gamma API (via proxy to avoid CORS issues)

### Development Setup

The application uses a backend proxy to avoid CORS issues when calling the Polymarket API:

- **Development**: `http://localhost:3001/api/polymarket` (local proxy server)
- **Production**: `https://pokvault-middleware-server.vercel.app/api/polymarket` (deployed proxy)

Make sure to run the proxy server locally on port 3001 during development.

## How It Works

1. **Data Fetching**: The app fetches vault activities from a The Graph subgraph including deposits, withdrawals, and new outcome token pairs.

2. **Market Resolution**: For outcome token pairs, the app calls CTF exchange contracts on Polygon to get condition IDs, then queries the Polymarket API to retrieve actual market questions and outcomes.

3. **Real-time Updates**: Uses TanStack React Query for efficient data fetching and caching with automatic refetching.

4. **Web3 Integration**: Users can connect their wallets to interact with the vault (future feature).

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

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for new data structures
3. Write descriptive commit messages
4. Test your changes thoroughly

## License

This project is part of the POKVault ecosystem. See the main repository for licensing information.
