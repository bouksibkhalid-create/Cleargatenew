# Due Diligence Platform - Module 1

Production-grade due diligence platform with OpenSanctions API integration.

## 🎯 Overview

A full-stack application for real-time sanctions screening, built with:
- **Backend**: Python/FastAPI with Netlify Functions
- **Frontend**: React/TypeScript with Material UI
- **Deployment**: Netlify (serverless)

## ✨ Features

- ✅ Real-time OpenSanctions API integration
- ✅ Integration with Sanctions.io API
- ✅ ICIJ Offshore Leaks integration (Neo4j)
- ✅ Interactive graph visualization
- ✅ Fast search (<3 seconds)
- ✅ Comprehensive entity information
- ✅ Sanction highlighting
- ✅ Responsive design
- ✅ Error handling
- ✅ Type-safe (TypeScript + Pydantic)
- ✅ Production-ready

## 📁 Project Structure

```
.
├── backend/              # Python backend
│   ├── netlify/
│   │   └── functions/   # Serverless functions
│   ├── src/
│   │   ├── services/    # Business logic
│   │   ├── models/      # Data models
│   │   ├── utils/       # Utilities
│   │   └── config/      # Configuration
│   └── tests/           # Test suite
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API client
│   │   ├── types/       # TypeScript types
│   │   └── theme/       # Material UI theme
│   └── public/          # Static assets
│
└── netlify.toml         # Netlify configuration
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- Netlify CLI (optional, for local development)

### Installation

1. **Clone the repository**
   ```bash
   cd "/Users/mac/Documents/Dev & Apps/New Works /Due DIlligence APp"
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements-dev.txt
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

### Local Development

#### Option 1: Using Netlify Dev (Recommended)

```bash
# From project root
netlify dev
```

This starts both frontend and backend:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8888/.netlify/functions/`

#### Option 2: Separate Servers

**Terminal 1 - Backend:**
```bash
cd backend
netlify dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest --cov=src --cov-report=term-missing
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📦 Deployment

### Deploy to Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Environment Variables

Set in Netlify Dashboard:
- `LOG_LEVEL`: `INFO`
- `OPENSANCTIONS_TIMEOUT`: `5.0`
- `ENVIRONMENT`: `production`
- `SANCTIONS_IO_API_KEY`: Your Sanctions.io API key
- `NEO4J_URI`: `neo4j+s://xxxxx.databases.neo4j.io`
- `NEO4J_USER`: `neo4j`
- `NEO4J_PASSWORD`: Your Neo4j password

### Module 3: Offshore Leaks Setup

To enable the Offshore Leaks integration:

1.  **Neo4j Aura**:
    - Create a free instance at [https://neo4j.com/cloud/aura/](https://neo4j.com/cloud/aura/)
    - Note your Connection URI, Username, and Password.

2.  **Data Download**:
    - Download the CSV database from [ICIJ Offshore Leaks Database](https://offshoreleaks.icij.org/pages/database).
    - You need: `nodes-officers.csv`, `nodes-entities.csv`, `nodes-intermediaries.csv`, `nodes-addresses.csv`, `relationships.csv`.
    - Place them in `backend/data/icij/`.

3.  **Data Import**:
    ```bash
    cd backend
    # Configure .env with your Neo4j credentials first
    python scripts/import_icij_data.py
    ```

    This will create the necessary graph structure and indexes.

4.  **Verification**:
    ```bash
    python scripts/verify_data.py
    ```

## 🎨 Features Showcase

### Search Interface
- Auto-focus search bar
- Real-time validation
- Loading indicators
- Clear button

### Results Display
- Entity cards with detailed information
- Sanction badges
- Alias display
- Country flags
- External links

### Error Handling
- User-friendly error messages
- Retry functionality
- Network error handling
- Validation errors

## 📊 API Endpoints

### POST /api/search

Search for entities in OpenSanctions database.

**Request:**
```json
{
  "query": "Vladimir Putin",
  "limit": 10
}
```

**Response:**
```json
{
  "query": "Vladimir Putin",
  "total_results": 5,
  "sanctioned_count": 3,
  "timestamp": "2024-01-17T10:30:00Z",
  "results": [...]
}
}
```

### POST /api/connections

Retrieve graph connections for an entity.

**Request:**
```json
{
  "node_id": "12345",
  "depth": 2,
  "max_nodes": 50
}
```

**Response:**
```json
{
  "graph": {
    "nodes": [...],
    "edges": [...]
  }
}
```

## 🔧 Tech Stack

### Backend
- Python 3.11
- FastAPI
- Pydantic v2
- httpx (async HTTP)
- structlog (logging)
- pytest (testing)

### Frontend
- React 18
- TypeScript 5
- Vite
- Material UI v5
- Axios
- Emotion

### Deployment
- Netlify Functions (serverless)
- Netlify CDN

## 📝 Documentation

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [API Documentation](backend/README.md#api-endpoints)

## ✅ Success Criteria

Module 1 is complete when:

- ✅ User can search and get results in <3 seconds
- ✅ All sanctioned entities are clearly marked
- ✅ Errors are handled gracefully
- ✅ Application is responsive on all devices
- ✅ Backend has >80% test coverage
- ✅ Frontend components are tested
- ✅ Application is deployed to Netlify
- ✅ Code follows best practices
- ✅ No console errors or warnings
- ✅ Lighthouse score >90

## 🛣️ Roadmap

- **Module 2**: Fuzzy matching & multiple data sources (Completed)
- **Module 3**: Neo4j integration & graph visualization (Completed)
- **Module 4**: Export functionality & advanced features

## 📄 License

MIT

## 🙏 Acknowledgments

- [OpenSanctions](https://www.opensanctions.org/) for the sanctions database
- [Material UI](https://mui.com/) for the component library
- [Netlify](https://www.netlify.com/) for hosting
