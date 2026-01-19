# Due Diligence Platform - Backend

Production-grade backend for the due diligence platform with OpenSanctions API integration.

## Features

- ✅ OpenSanctions API integration
- ✅ Async HTTP client with timeout handling
- ✅ Comprehensive error handling
- ✅ Structured logging
- ✅ Request validation with Pydantic
- ✅ Netlify Functions (serverless)
- ✅ CORS support
- ✅ Type-safe with Python 3.11+

## Project Structure

```
backend/
├── netlify/functions/     # Serverless functions
│   └── search.py         # Search endpoint
├── src/
│   ├── services/         # Business logic
│   ├── models/           # Data models
│   ├── utils/            # Utilities
│   └── config/           # Configuration
├── tests/                # Test suite
└── requirements.txt      # Dependencies
```

## Setup

### Prerequisites

- Python 3.11+
- pip
- Netlify CLI (for local development)

### Installation

1. Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements-dev.txt
```

3. Create environment file:
```bash
cp .env.example .env
```

## Development

### Run locally with Netlify Dev

```bash
# From project root
netlify dev
```

This starts the Netlify Dev server with functions accessible at:
- `http://localhost:8888/.netlify/functions/search`

### Run tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=term-missing

# Run specific test file
pytest tests/test_services/test_opensanctions_service.py
```

### Code quality

```bash
# Format code
black .

# Lint
ruff check .

# Type check
mypy .
```

## API Endpoints

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
  "results": [
    {
      "id": "entity-123",
      "name": "Vladimir Putin",
      "schema": "Person",
      "is_sanctioned": true,
      "sanction_programs": [
        {
          "program": "OFAC SDN",
          "authority": "US Treasury",
          "start_date": "2022-02-24",
          "reason": "Ukraine invasion"
        }
      ],
      "aliases": ["Putin, Vladimir"],
      "birth_date": "1952-10-07",
      "nationalities": ["RU"],
      "countries": ["RU"],
      "datasets": ["us_ofac_sdn"],
      "url": "https://api.opensanctions.org/entities/entity-123"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "ValidationError",
  "message": "Invalid request parameters",
  "details": "...",
  "timestamp": "2024-01-17T10:30:00Z"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `INFO` |
| `OPENSANCTIONS_TIMEOUT` | API timeout in seconds | `5.0` |
| `API_REQUEST_LIMIT` | Max results per request | `50` |
| `ENVIRONMENT` | Environment name | `development` |

## Deployment

Deploy to Netlify:

```bash
# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod
```

## Testing

The test suite includes:
- Unit tests for services
- Integration tests for endpoints
- Mock API responses
- Error handling tests

Target coverage: >80%

## License

MIT
