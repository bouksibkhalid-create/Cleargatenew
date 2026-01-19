# Due Diligence Platform - Frontend

Modern, responsive React application for sanctions screening with Material UI.

## Features

- ✅ Real-time search interface
- ✅ Material UI components
- ✅ TypeScript for type safety
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Error handling with user-friendly messages
- ✅ Loading states
- ✅ Sanction highlighting
- ✅ Country flag emojis
- ✅ External links to OpenSanctions

## Tech Stack

- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Vite** - Build tool
- **Material UI v5** - Component library
- **Axios** - HTTP client
- **Emotion** - CSS-in-JS

## Project Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   │   ├── search/      # Search components
│   │   └── results/     # Result display components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API client
│   ├── types/           # TypeScript types
│   ├── theme/           # Material UI theme
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── index.html          # HTML template
└── vite.config.ts      # Vite configuration
```

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file (optional):

```bash
cp .env.example .env
```

For local development, the proxy in `vite.config.ts` handles API requests.

## Development

### Start development server

```bash
npm run dev
```

Application will be available at `http://localhost:3000`

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint code

```bash
npm run lint
```

## Components

### SearchBar
- Input field with validation
- Clear button
- Loading indicator
- Auto-focus

### ResultCard
- Entity information display
- Sanction badges
- Aliases
- Sanction programs
- External links

### ResultsList
- Summary statistics
- Sanctioned entity warnings
- Result cards

### EmptyState
- Displayed when no results found
- User-friendly message

### ErrorState
- Error display
- Retry functionality

## Custom Hooks

### useSearch
- Search state management
- Loading states
- Error handling
- Reset functionality

## API Integration

The frontend communicates with the backend via `/api/search` endpoint.

**Request:**
```typescript
{
  query: string;
  limit?: number;
}
```

**Response:**
```typescript
{
  query: string;
  total_results: number;
  sanctioned_count: number;
  timestamp: string;
  results: OpenSanctionsEntity[];
}
```

## Responsive Design

The application is fully responsive:
- **Mobile**: 375px+
- **Tablet**: 768px+
- **Desktop**: 1024px+

## Accessibility

- Keyboard navigation
- ARIA labels
- Semantic HTML
- Focus indicators
- Color contrast (WCAG AA)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting
- Lazy loading
- Optimized bundle size
- Source maps for debugging

## Deployment

The frontend is deployed to Netlify along with the backend functions.

```bash
# Build command (configured in netlify.toml)
npm run build

# Output directory
dist/
```

## License

MIT
