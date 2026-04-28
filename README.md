# Theta — Covered Call Cockpit

A regime-aware covered call decision-support tool. Personal use, web app, read-only — no order execution. Surfaces ranked covered-call opportunities across a portfolio using Monte Carlo simulation, regime context, and three independent ranking lenses, augmented by edge and volatility risk premium metrics.

## Features

### Regime Dashboard
Rules-based market regime classifier with 8 states (shocked, vol expansion, high/low vol variants, neutral). Displays VIX level gauge, term structure (VIX9D/VIX, VIX/VIX3M), SPY trend vs 50/200 DMA, confidence scoring, and a 90-day regime history strip. Each regime maps to actionable covered call guidance.

### Strike Picker
Three-lens recommendation engine for a single holding:
- **Lens 1: Max Expected Return** — annualized MC-simulated expected total return
- **Lens 2: Max Yield** — annualized premium yield, penalizing high assignment probability
- **Lens 3: Risk-Adjusted** — expected return / std dev (Sharpe-like)

Shows top 3 picks per lens, Pareto-optimal candidates, earnings risk flags, and a full option chain table with all scored candidates.

### MC Simulator
Monte Carlo simulation engine with two models:
- **GBM** — Geometric Brownian Motion with Box-Muller transform
- **Bootstrap** — Resample historical log returns

Outputs P&L histogram, fan chart with strike line overlay, percentile stats, expected return, P(assignment), and edge per contract.

### Holdings Management
Manual position entry and CSV/TSV bulk import. Positions persist in localStorage across sessions.

## Tech Stack

- **React 18** + **Vite** + **TypeScript** (strict mode)
- **Tailwind CSS v4** for styling
- **Zustand** for state management with localStorage persistence
- **Recharts** for histograms/charts, Canvas for fan chart
- **Web Workers** for off-main-thread MC computation
- **IndexedDB** (`idb`) for dual-layer data caching (in-memory + IDB)
- **Vitest** + **Testing Library** for tests

## Architecture

Five tiers, top-to-bottom data flow:

1. **External data** — Tradier API (chains, Greeks, prices, VIX), with mock adapter for offline dev
2. **Data adapter + cache** — Provider-agnostic `DataAdapter` interface with TTL-based `CachedAdapter`
3. **Analytics primitives** — Pure functions: regime classifier, MC engine, Black-Scholes, edge/VRP, IV rank, recommendation engine
4. **User features** — Regime dashboard, strike picker, MC simulator, holdings
5. **Manual holdings** — CSV/TSV import or manual entry

## Getting Started

```bash
npm install
npm run dev
```

The app runs with a mock data adapter by default. To use live Tradier data:

```bash
cp .env.example .env
# Add your Tradier API key to .env
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
├── analytics/       # Pure functions: MC engine, Black-Scholes, regime classifier,
│   └── __tests__/   #   recommendation engine, stats, edge, VRP, IV rank
├── components/      # Layout, Sidebar, Footer
├── data/            # DataAdapter interface, Tradier adapter, mock adapter, cache
├── features/        # Feature pages
│   ├── holdings/    #   Position management + bulk import
│   ├── regime/      #   Regime dashboard (VIX, term structure, SPY trend)
│   ├── simulator/   #   MC simulator with histogram + fan chart
│   └── strike-picker/ # Three-lens strike recommender + chain table
├── hooks/           # useRegime, useMCSimulation, useMarketData
├── lib/             # Constants, formatting, seeded PRNG
├── store/           # Zustand stores (holdings, config, regime)
├── types/           # All TypeScript type definitions
└── workers/         # Web Worker for MC simulation
```

## Tests

130 unit tests covering all analytics modules:

```bash
npx vitest run
```

Key test validations:
- GBM MC expected payout converges to Black-Scholes within 2% at 100K paths
- Regime classifier matches historical scenarios (March 2020 → shocked, Q4 2017 → low_vol_trending_up, Feb 2018 → vol_expansion)
- Seeded PRNG ensures reproducible MC results
- Recommendation engine Pareto frontier and three-lens scoring
