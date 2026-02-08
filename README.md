# Receipt Insights (grocer-gist)

A smart grocery spending tracker that uses AI to parse receipt images and PDFs, providing insights into spending habits and price comparisons across stores.

## Features

- 📷 **Receipt Parsing** - Upload receipt images or PDFs, AI extracts items automatically
- 📊 **Spending Dashboard** - Visualize spending by category, store, and time period
- 💰 **Price Comparison** - Compare prices across stores to find the best deals
- 🏷️ **Smart Categorization** - AI-powered product categorization with learning from corrections
- 🔄 **Product Grouping** - Automatically group similar products for better tracking
- 🛡️ **Parser Reliability** - Automated regression testing and anomaly detection to ensure high parsing accuracy

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **AI**: Google Gemini API (Receipt parsing, categorization)
- **Hosting**: Vercel (frontend) / Supabase (backend)

## Development

### Quality Control

The project includes a robust system for ensuring parser quality:

- **Regression Testing**: Run `npm run test:regression` to verify the parser against a "Golden Set" of known receipts.
- **Anomaly Detection**: Automated detection of absurd prices, high quantities, and other parsing errors.
- **Diagnostics Dashboard**: Visit `/diagnostics` in the app to view parser health metrics and drill down into specific errors for correction.

### Prerequisites

- Node.js 18+ (install via [nvm](https://github.com/nvm-sh/nvm))
- npm

### Getting Started

```sh
# Clone the repository
git clone https://github.com/claessandahl-arch/grocer-gist-2.0.git

# Navigate to project directory
cd grocer-gist-2.0

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Edge Functions

The app uses Supabase Edge Functions for AI-powered features:

| Function | Purpose |
|----------|---------|
| `parse-receipt` | Parse receipt images/PDFs using Gemini AI |
| `suggest-categories` | AI category suggestions for products |
| `suggest-product-groups` | AI product grouping suggestions |
| `suggest-group-merges` | AI merge suggestions for product groups |
| `auto-map-products` | Auto-map products to groups |
| `cleanup-categories` | Scan and fix invalid category keys |
| `export-data` | Export user data |
| `admin-delete-all` | Admin utility for data cleanup |

Edge Functions require `GEMINI_API_KEY` to be set as a secret.

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # Supabase client & types
│   └── lib/            # Utility functions
├── supabase/
│   ├── functions/      # Edge Functions
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## Documentation

- [AGENTS.md](./AGENTS.md) - Detailed project documentation and agent guidelines
- [docs/](docs/) - Architecture, feature documentation, and technical stack
- [TODO.md](./TODO.md) - Roadmap and planned features

## License

Private project - All rights reserved.
