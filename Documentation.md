# Due Diligence App - Technical Documentation

> Complete reference for the Due Diligence Sanctions Screening Application.
> Use this document as a guide when making UI/UX changes.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Data Sources](#data-sources)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Reference](#api-reference)
7. [Database (Neo4j)](#database-neo4j)
8. [Configuration](#configuration)
9. [Current Features](#current-features)
10. [Known Issues](#known-issues)
11. [UI/UX Improvement Areas](#uiux-improvement-areas)

---

## Project Overview

**Purpose:** Multi-source entity screening application for AML/KYC due diligence. Searches across sanctions lists and offshore leaks databases to identify potentially risky entities.

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Python 3.13 + Flask (dev) / Netlify Functions (prod)
- **Database:** Neo4j Aura (ICIJ Offshore Leaks data)
- **APIs:** OpenSanctions, Sanctions.io

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND                              │
│  React + TypeScript + Vite                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ SearchForm  │ │ ResultsList │ │ ExportButton│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│         │               ▲               │                   │
│         └───────────────┼───────────────┘                   │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP/JSON
┌─────────────────────────┼───────────────────────────────────┐
│                    BACKEND API                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 /api/search (POST)                     │ │
│  │  ┌─────────────┬─────────────┬─────────────────────┐   │ │
│  │  │OpenSanctions│ Sanctions.io│ Offshore Leaks      │   │ │
│  │  │  Service    │  Service    │ Service (Neo4j)     │   │ │
│  │  └─────────────┴─────────────┴─────────────────────┘   │ │
│  │                         │                               │ │
│  │              ┌──────────▼──────────┐                   │ │
│  │              │  ResultAggregator   │                   │ │
│  │              │  + FuzzyMatcher     │                   │ │
│  │              └─────────────────────┘                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │                │                │
         ▼                ▼                ▼
   ┌──────────┐    ┌──────────┐    ┌──────────────┐
   │OpenSanc. │    │Sanctions │    │  Neo4j Aura  │
   │   API    │    │.io API   │    │  (2M nodes)  │
   └──────────┘    └──────────┘    └──────────────┘
```

---

## Data Sources

### 1. OpenSanctions ✅ Working
- **URL:** https://api.opensanctions.org
- **Data:** Global sanctions, PEPs, watchlists
- **Auth:** API key in `Authorization: ApiKey {key}` header
- **Entities:** Persons, Companies, Organizations

### 2. Sanctions.io ⚠️ 403 Error
- **URL:** https://api.sanctions.io
- **Data:** OFAC SDN, EU, UN sanctions
- **Auth:** API key in `X-API-Key` header
- **Status:** Returns 403 - may need subscription upgrade

### 3. Offshore Leaks (Neo4j) ✅ Working
- **Source:** ICIJ Offshore Leaks Database
- **Data:** Panama Papers, Paradise Papers, Pandora Papers
- **Records:** 2,016,523 nodes, 2,901,722 relationships
- **Node Types:** Officer, Entity, Intermediary, Address

---

## Backend Implementation

### Directory Structure
```
backend/
├── .env                       # Environment variables
├── requirements.txt           # Python dependencies
├── netlify/
│   └── functions/
│       ├── search.py          # Main search endpoint
│       ├── connections.py     # Graph connections endpoint
│       └── health.py          # Health check endpoint
├── scripts/
│   └── import_icij_data.py    # Neo4j data import script
├── data/
│   └── icij/                  # ICIJ CSV files
└── src/
    ├── models/
    │   ├── requests.py        # Pydantic request models
    │   ├── responses.py       # Pydantic response models
    │   └── graph_models.py    # Neo4j graph models
    ├── services/
    │   ├── opensanctions_service.py  # OpenSanctions API
    │   ├── sanctions_io_service.py   # Sanctions.io API
    │   ├── offshore_service.py       # Neo4j ICIJ search
    │   ├── aggregator.py             # Result aggregation
    │   ├── fuzzy_matcher.py          # Name matching
    │   ├── graph_service.py          # Graph traversal
    │   └── cache_service.py          # Response caching
    └── utils/
        ├── neo4j_client.py    # Neo4j connection
        ├── logger.py          # Structured logging
        ├── errors.py          # Custom exceptions
        └── decorators.py      # Rate limiting, caching
```

### Key Services

#### `opensanctions_service.py`
- Searches OpenSanctions API
- Parses entity responses
- Extracts sanction programs

#### `sanctions_io_service.py`
- Searches Sanctions.io API
- Handles fuzzy parameter
- Follows redirects (301)

#### `offshore_service.py`
- Uses Neo4j full-text search
- Index: `offshore_fulltext`
- Returns entity connections

#### `aggregator.py`
- Combines results from all sources
- Applies fuzzy scoring
- Tracks success/failure per source

#### `fuzzy_matcher.py`
- Uses RapidFuzz library
- `token_sort_ratio` + `partial_ratio`
- Threshold: 80% (configurable)

---

## Frontend Implementation

### Directory Structure
```
frontend/src/
├── App.tsx                    # Main app with routing
├── main.tsx                   # Entry point
├── index.css                  # Global styles
├── components/
│   ├── search/
│   │   ├── SearchForm.tsx     # Search input + filters
│   │   ├── SearchModeToggle.tsx
│   │   ├── SourceSelector.tsx
│   │   └── SuggestionChips.tsx
│   ├── results/
│   │   ├── ResultsList.tsx    # Results display
│   │   ├── ResultCard.tsx     # Individual result
│   │   ├── SourceTabs.tsx     # Filter by source
│   │   ├── SanctionBadge.tsx
│   │   ├── MatchScoreBadge.tsx
│   │   ├── CountryFlags.tsx
│   │   └── ErrorBanner.tsx
│   ├── export/
│   │   └── ExportButton.tsx   # PDF/CSV/JSON export
│   └── graph/
│       └── ConnectionGraph.tsx # React Flow graph
├── hooks/
│   ├── useSearch.ts           # Search API hook
│   ├── useConnections.ts      # Graph connections
│   └── useToast.ts            # Toast notifications
├── services/
│   └── api.ts                 # API client
├── types/
│   ├── search.ts              # Search types
│   ├── entity.ts              # Entity types
│   └── graph.ts               # Graph types
└── utils/
    ├── exportHelpers.ts       # Export logic
    ├── formatters.ts          # Date/text formatting
    └── validators.ts          # Input validation
```

### Key Components

#### `SearchForm.tsx`
- Query input with validation
- Search mode toggle (Exact/Fuzzy)
- Data source checkboxes
- Suggestion chips

#### `ResultsList.tsx`
- Displays aggregated results
- Source tabs (All/OpenSanctions/Sanctions.io/Offshore)
- Error banner for failed sources
- Export button integration

#### `ResultCard.tsx`
- Entity name and aliases
- Sanction status badge
- Match score badge
- Birth date, nationalities
- Source indicator

#### `ExportButton.tsx`
- Dropdown menu (PDF/CSV/JSON)
- Uses jsPDF + jspdf-autotable
- Respects current source filter

---

## API Reference

### POST /api/search
Main search endpoint for all data sources.

**Request:**
```json
{
  "query": "Vladimir Putin",
  "search_type": "fuzzy",
  "sources": ["opensanctions", "sanctions_io", "offshore_leaks"],
  "limit": 10,
  "fuzzy_threshold": 80
}
```

**Response:**
```json
{
  "query": "Vladimir Putin",
  "search_type": "fuzzy",
  "results_by_source": {
    "opensanctions": {
      "found": true,
      "count": 5,
      "sanctioned_count": 2,
      "error": null,
      "results": [...]
    },
    "sanctions_io": {...},
    "offshore_leaks": {...}
  },
  "all_results": [...],
  "total_results": 15,
  "total_sanctioned": 3,
  "sources_succeeded": ["opensanctions", "offshore_leaks"],
  "sources_failed": ["sanctions_io"],
  "fuzzy_threshold": 80
}
```

### POST /api/connections
Get graph connections for an offshore entity.

**Request:**
```json
{
  "node_id": 1597521,
  "depth": 2,
  "max_nodes": 50
}
```

### GET /api/health
Health check endpoint.

---

## Database (Neo4j)

### Connection
```
URI: neo4j+ssc://622a551e.databases.neo4j.io
User: neo4j
Password: [in .env file]
```

### Node Labels
| Label | Count | Description |
|-------|-------|-------------|
| Officer | 771,315 | Individuals in offshore structures |
| Entity | 814,344 | Shell companies, trusts |
| Intermediary | 25,629 | Law firms, service providers |
| Address | 402,246 | Registered addresses |
| Other | 2,989 | Miscellaneous |

### Relationships
~2.9M relationships connecting entities (OFFICER_OF, INTERMEDIARY_OF, REGISTERED_ADDRESS, etc.)

### Full-Text Index
```cypher
CREATE FULLTEXT INDEX offshore_fulltext 
FOR (n:Officer|Entity|Intermediary|Address|Other) 
ON EACH [n.name, n.address, n.countries, n.jurisdiction_description]
```

---

## Configuration

### Backend `.env`
```bash
# Logging
LOG_LEVEL=INFO

# OpenSanctions
OPENSANCTIONS_API_KEY=your_key_here
OPENSANCTIONS_TIMEOUT=5.0

# Sanctions.io
SANCTIONS_IO_API_KEY=your_key_here
SANCTIONS_IO_TIMEOUT=5.0

# Neo4j
NEO4J_URI=neo4j+ssc://622a551e.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here

# Fuzzy Matching
DEFAULT_FUZZY_THRESHOLD=80
```

### Frontend `.env`
```bash
VITE_API_URL=http://localhost:8888
```

---

## Current Features

### Search
- [x] Multi-source parallel search
- [x] Exact and fuzzy matching
- [x] Source selection (checkboxes)
- [x] Configurable result limit
- [x] Adjustable fuzzy threshold

### Results
- [x] Grouped by source (tabs)
- [x] Match score display
- [x] Sanction status badges
- [x] Alias display
- [x] Error handling per source

### Export
- [x] PDF export (formatted report)
- [x] CSV export (spreadsheet)
- [x] JSON export (raw data)

### Graph (Partial)
- [x] Connection graph component
- [ ] Full integration with search
- [ ] Interactive exploration

---

## Known Issues

1. **Sanctions.io 403 Error**
   - API returns 403 Forbidden
   - May require subscription upgrade
   - App handles gracefully (shows error)

2. **Neo4j SSL on some networks**
   - Fixed with `neo4j+ssc://` URI
   - Bypasses SSL certificate verification

3. **Pydantic Warnings**
   - Float to int conversion warnings
   - Cosmetic only, doesn't affect results

---

## UI/UX Improvement Areas

### 🎨 Design Improvements
- [ ] Modern design system (colors, typography)
- [ ] Dark mode support
- [ ] Mobile responsive layout
- [ ] Loading skeletons instead of spinners
- [ ] Better empty states

### 🔍 Search Experience
- [ ] Real-time search (debounced)
- [ ] Search history
- [ ] Saved searches
- [ ] Advanced filters (date, country)
- [ ] Autocomplete suggestions

### 📊 Results Display
- [ ] Grid vs List view toggle
- [ ] Sortable columns
- [ ] Collapsible entity details
- [ ] Risk score visualization
- [ ] Connection count badges

### 📈 Analytics
- [ ] Search statistics dashboard
- [ ] Source reliability indicators
- [ ] Historical search trends

### 🗺️ Graph Visualization
- [ ] Full-screen graph mode
- [ ] Node clustering
- [ ] Edge filtering
- [ ] Export graph as image

### 📱 UX Enhancements
- [ ] Keyboard shortcuts
- [ ] Bulk search (CSV upload)
- [ ] Comparison mode
- [ ] Report templates

---

## Running the App

### Development
```bash
# Terminal 1: Backend
cd "/Users/mac/Documents/Dev & Apps/New Works /Due DIlligence APp"
python3 dev_server.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Access
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8888

---

## File Quick Reference

### Must-Know Files for UI/UX Work

| File | Purpose | Modify for |
|------|---------|------------|
| `frontend/src/App.tsx` | Main layout, routing | Page structure |
| `frontend/src/index.css` | Global styles | Colors, fonts |
| `frontend/src/components/search/SearchForm.tsx` | Search UI | Input redesign |
| `frontend/src/components/results/ResultsList.tsx` | Results display | Card layout |
| `frontend/src/components/results/ResultCard.tsx` | Entity card | Card styling |
| `frontend/src/components/export/ExportButton.tsx` | Export dropdown | Export options |

### Don't Touch (Core Backend)

| File | Reason |
|------|--------|
| `backend/src/services/*.py` | API integrations working |
| `backend/src/models/*.py` | Data models stable |
| `backend/netlify/functions/search.py` | Main API endpoint |

---

## Summary

This app is a working multi-source sanctions screening tool with:
- 2 active data sources (OpenSanctions, Offshore Leaks)
- 2M+ searchable entities
- Fuzzy name matching
- PDF/CSV/JSON export

**Ready for:** UI/UX improvements, feature additions, design refresh

**Preserve:** Backend API logic, data integrations, core search flow
