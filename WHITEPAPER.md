# ClearGate — Technical White Paper

**Intelligence-Grade Sanctions Screening & Due Diligence Platform**

Version 1.0 · February 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Platform Overview](#3-platform-overview)
4. [System Architecture](#4-system-architecture)
5. [Data Sources & Ingestion](#5-data-sources--ingestion)
6. [Backend Engine](#6-backend-engine)
7. [Frontend Application](#7-frontend-application)
8. [Search & Matching Pipeline](#8-search--matching-pipeline)
9. [Graph Intelligence Engine](#9-graph-intelligence-engine)
10. [Security & Access Control](#10-security--access-control)
11. [Resilience & Fault Tolerance](#11-resilience--fault-tolerance)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Data Model](#13-data-model)
14. [Export & Reporting](#14-export--reporting)
15. [Roadmap](#15-roadmap)

---

## 1. Executive Summary

**ClearGate** is a production-grade, full-stack due diligence platform designed for real-time sanctions screening and intelligence analysis. The platform aggregates data from multiple international sanctions databases, offshore leaks records, and regulatory sources into a single, unified search interface.

A single query cross-references **three distinct data backends** — Supabase (structured sanctions data), OpenSanctions API (live global sanctions), and a Neo4j graph database (ICIJ Offshore Leaks) — returning consolidated, risk-scored results in under 3 seconds. The platform supports fuzzy name matching, interactive relationship graph visualization, comprehensive entity intelligence panels, and multi-format export.

### Key Capabilities

- **Multi-source search**: Simultaneously queries OpenSanctions, Sanctions.io, Supabase, and ICIJ Offshore Leaks databases.
- **Fuzzy matching**: RapidFuzz-powered name matching handles misspellings, transliterations, and name order variations.
- **Graph intelligence**: Neo4j-backed relationship traversal with interactive force-directed visualization using React Flow.
- **Enhanced entity profiles**: 40+ fields per entity including sanctions reasoning, identification documents, addresses, regulations, and timeline events.
- **Real-time screening**: Sub-3-second search latency across 2.1M+ entity records.
- **Export**: PDF, CSV, and JSON export of search results and intelligence reports.
- **Serverless deployment**: Vercel-hosted with Python serverless API functions and Vite-built React frontend.

---

## 2. Problem Statement

Compliance teams, intelligence analysts, and financial institutions must screen individuals, organizations, and vessels against dozens of international sanctions lists — OFAC SDN, EU Consolidated List, UN Security Council, UK Sanctions, Canadian SEMA, and more. The challenges are:

1. **Fragmented data**: Sanctions data is spread across incompatible APIs, XML feeds, CSV dumps, and proprietary databases.
2. **Name ambiguity**: Entities appear under transliterated names, aliases, and variations across different lists.
3. **Hidden relationships**: Offshore corporate structures, nominee directors, and shell companies obscure beneficial ownership.
4. **Compliance velocity**: Regulatory deadlines require sub-minute screening turnaround, not batch processing.
5. **Data richness**: Basic name matching is insufficient — analysts need sanctions reasoning, legal basis, identification documents, and regulatory history.

ClearGate solves these by providing a unified query interface that federates across all major data sources, applies intelligent fuzzy matching, and exposes deep entity intelligence through an interactive UI.

---

## 3. Platform Overview

### Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React/TypeScript)           │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │ Search   │  │ Results   │  │ Intelligence Panel   │  │
│  │ Section  │  │ List/Tabs │  │ (Overview, Sanctions, │  │
│  │          │  │           │  │  Relationships, OSINT)│  │
│  └──────────┘  └───────────┘  └──────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐    │
│  │         Interactive Graph Visualization          │    │
│  │              (React Flow + D3 Force)             │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (Axios)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              VERCEL SERVERLESS API LAYER                 │
│     ┌──────────┐  ┌──────────────┐  ┌─────────┐        │
│     │ /api/    │  │ /api/        │  │ /api/   │        │
│     │ search   │  │ connections  │  │ health  │        │
│     └────┬─────┘  └──────┬───────┘  └────┬────┘        │
└──────────┼───────────────┼───────────────┼──────────────┘
           │               │               │
     ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
     │ Supabase  │  │  Neo4j    │  │  Neo4j    │
     │ (Postgres)│  │  (Graph)  │  │  (Health) │
     └───────────┘  └───────────┘  └───────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7, TailwindCSS 3, Radix UI, Framer Motion, React Flow, D3-Force |
| **API Layer** | Python 3.11, Vercel Serverless Functions (`http.server.BaseHTTPRequestHandler`) |
| **Backend Services** | FastAPI (dev), Pydantic v2, httpx (async HTTP), RapidFuzz, structlog |
| **Databases** | Supabase (PostgreSQL), Neo4j Aura (graph), OpenSanctions API, Sanctions.io API |
| **Resilience** | Tenacity (retry), PyBreaker (circuit breaker), in-memory caching |
| **Deployment** | Vercel (serverless + CDN), GitHub CI/CD |
| **Export** | jsPDF, jspdf-autotable, html-to-image |

---

## 4. System Architecture

### 4.1 Monorepo Structure

```
ClearGate/
├── api/                          # Vercel serverless functions (production)
│   ├── search.py                 # POST /api/search
│   ├── connections.py            # POST /api/connections
│   ├── health.py                 # GET  /api/health
│   └── requirements.txt          # Python runtime dependencies
│
├── backend/                      # Backend business logic library
│   ├── src/
│   │   ├── config/settings.py    # Pydantic-based configuration
│   │   ├── models/               # Pydantic data models (requests, responses, graph)
│   │   ├── services/             # Core business logic
│   │   │   ├── opensanctions_service.py
│   │   │   ├── sanctions_io_service.py
│   │   │   ├── offshore_service.py
│   │   │   ├── graph_service.py
│   │   │   ├── enhanced_search_service.py
│   │   │   ├── fuzzy_matcher.py
│   │   │   ├── aggregator.py
│   │   │   ├── cache_service.py
│   │   │   ├── supabase_client.py
│   │   │   └── data_sources/     # Sanctions list downloaders & normalizers
│   │   ├── parsers/              # XML/CSV sanctions data parsers
│   │   └── utils/                # Neo4j client, circuit breaker, logging
│   └── tests/
│
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── App.tsx               # Root component with routing state
│   │   ├── components/           # UI component library
│   │   │   ├── auth/             # Lock screen authentication
│   │   │   ├── search/           # Search bar, OSINT loader
│   │   │   ├── results/          # Entity cards, result tabs, badges
│   │   │   ├── panel/            # Intelligence deep-dive panel
│   │   │   ├── graph/            # Interactive graph visualization
│   │   │   ├── export/           # PDF/CSV/JSON export
│   │   │   ├── home/             # Landing page stats & data sources
│   │   │   └── ui/               # Shadcn/Radix base components
│   │   ├── hooks/                # useSearch, useConnections, useToast
│   │   ├── services/api.ts       # Axios API client
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Export helpers, graph utilities
│   └── package.json
│
├── vercel.json                   # Vercel deployment configuration
└── .env.example                  # Environment variable template
```

### 4.2 Request Flow

A typical search request follows this path:

1. **User** types a query in the `SearchSection` component and submits.
2. **`useSearch` hook** constructs a `SearchRequest` and calls `apiClient.search()`.
3. **`api.ts` (Axios)** sends `POST /api/search` with JSON body to the Vercel serverless function.
4. **`api/search.py`** (Vercel Python function) executes:
   - **Supabase RPC call**: Invokes `search_sanctions` PostgreSQL function with trigram similarity matching.
   - **Neo4j Cypher query**: Runs `CONTAINS` text search on all nodes in the Offshore Leaks graph.
5. **Results are merged** into a unified `SearchResponse` with per-source breakdown.
6. **Frontend receives** the response, transforms entities via `toUnifiedEntity()`, and renders `ResultsList`.
7. **User clicks** an entity card → `IntelligencePanel` slides in with tabbed deep-dive view.
8. **User clicks** "Relationships" tab → `InteractiveGraph` fetches `POST /api/connections` and renders a force-directed graph.

---

## 5. Data Sources & Ingestion

### 5.1 Live API Sources

| Source | Type | Coverage | Integration |
|--------|------|----------|-------------|
| **OpenSanctions** | REST API | Global consolidated sanctions (OFAC, EU, UN, UK, etc.) | `OpenSanctionsService` via httpx async client |
| **Sanctions.io** | REST API | OFAC SDN, EU, UN, and additional lists | `SanctionsIoService` via httpx async client |

Both services implement automatic retry with exponential backoff (via Tenacity) and circuit breaker protection (via PyBreaker).

### 5.2 Supabase (PostgreSQL)

The platform maintains a **Supabase PostgreSQL database** containing a normalized, enriched copy of sanctions data. The `search_sanctions` RPC function performs trigram-based fuzzy matching (`pg_trgm`) with a configurable similarity threshold (default: 0.3).

Key tables:
- `sanctions_entities` — Core entity records (40+ fields)
- `entity_identifications` — Passport numbers, tax IDs, national IDs
- `entity_addresses` — Structured address records
- `entity_regulations` — Legal basis, programmes, regulation IDs
- `entity_timeline_events` — Chronological listing/delisting events

### 5.3 Neo4j (Offshore Leaks Graph)

The ICIJ Offshore Leaks database is imported into **Neo4j Aura** as a property graph:

- **Node types**: `Officer`, `Entity`, `Intermediary`, `Address`
- **Relationship types**: `OFFICER_OF`, `SHAREHOLDER_OF`, `REGISTERED_ADDRESS`, `INTERMEDIARY_OF`, `CONNECTED_TO`, `BENEFICIAL_OWNER`, `DIRECTOR_OF`
- **Search**: Full-text index (`offshore_fulltext`) with fallback to `CONTAINS` string matching.
- **Traversal**: Variable-length path matching up to configurable depth (default: 2 hops, max: 3).

### 5.4 Offline Data Downloaders

The `backend/src/services/data_sources/` module contains downloaders for direct sanctions list ingestion:

- **OFAC SDN** (`ofac_downloader.py`)
- **EU Consolidated List** (`eu_downloader.py`)
- **UN Security Council** (`un_downloader.py`)
- **UK Sanctions** (`uk_downloader.py`)
- **Canadian SEMA** (`canada_downloader.py`)

Each downloader fetches raw XML/CSV data, parses it through the `EnhancedBaseParser` pipeline (extracting 40+ fields per entity), normalizes it via `DataNormalizer`, and loads it into Supabase.

---

## 6. Backend Engine

### 6.1 Configuration

All configuration is centralized in `backend/src/config/settings.py` using **Pydantic Settings**:

```python
class Settings(BaseSettings):
    OPENSANCTIONS_API_KEY: Optional[str]
    SANCTIONS_IO_API_KEY: Optional[str]
    NEO4J_URI: Optional[str]
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: Optional[str]
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: Optional[str]
    DEFAULT_FUZZY_THRESHOLD: int = 80
    MAX_GRAPH_DEPTH: int = 3
    MAX_GRAPH_NODES: int = 100
    CACHE_TTL_SECONDS: int = 3600
    RATE_LIMIT_MAX_REQUESTS: int = 100
    ENABLE_CACHE: bool = True
    ENABLE_RATE_LIMITING: bool = True
    SENTRY_DSN: Optional[str]
    ...
```

Settings are loaded from environment variables (and `.env` files in development), following the 12-factor app methodology.

### 6.2 Service Layer

#### OpenSanctionsService
- **Endpoint**: `GET https://api.opensanctions.org/search/default`
- **Features**: Retry (3 attempts, exponential backoff 1–10s), circuit breaker (5 failures → 30s cooldown).
- **Parsing**: Extracts English/Latin names preferentially, handles multi-value properties, detects sanctioned status from topics and program lists.

#### SanctionsIoService
- **Endpoint**: `GET https://api.sanctions.io/search`
- **Features**: Same retry/circuit breaker pattern, API key authentication.

#### EnhancedSupabaseSearchService
- **Database**: Supabase PostgreSQL
- **Modes**: Fuzzy search (`ILIKE` across name, full_name, sanctions_reason, current_position) and exact search.
- **Related data**: Joins `entity_identifications`, `entity_addresses`, `entity_regulations`, and `entity_timeline_events` for complete entity profiles.

#### OffshoreLeaksService
- **Database**: Neo4j Aura
- **Search strategy**: Full-text index (`offshore_fulltext`) as primary, `CONTAINS` as fallback.
- **Returns**: Entity metadata + connection counts + sample connections (top 5).

#### GraphService
- **Traversal**: Variable-length Cypher path matching: `(start)-[*1..{depth}]-(connected)`.
- **Output**: Deduplicated `ConnectionGraph` with typed, colored nodes and labeled edges.
- **Serialization**: Handles Neo4j DateTime types for JSON compatibility.

#### ResultAggregator
- Combines results from all sources.
- Applies fuzzy scoring via `FuzzyMatcher`.
- Sorts by: sanctioned first, then match score descending.
- Produces per-source breakdown and summary statistics.

### 6.3 Fuzzy Matching Engine

The `FuzzyMatcher` class (powered by **RapidFuzz**) implements:

1. **Text normalization**: Lowercasing, title removal (Mr., Dr., Prof., Sir, etc.), suffix removal (Jr., Sr., II, III), special character stripping.
2. **Dual scoring**: Takes the maximum of `token_sort_ratio` (handles word order) and `partial_ratio` (handles substring matches).
3. **Configurable threshold**: Default 80% — balances precision and recall.
4. **Alias matching**: If the primary name score is below threshold, all aliases are checked.

### 6.4 Caching

The `CacheService` provides in-memory TTL-based caching (default: 1 hour) with MD5-based key generation. This prevents redundant API calls for repeated queries within the cache window.

---

## 7. Frontend Application

### 7.1 Application Shell

The React SPA (`App.tsx`) manages three states:

1. **Lock screen** → Password-protected access gate (`LockScreen` component).
2. **Home** → Hero section with search bar, stats cards, data source overview, update status.
3. **Results** → Search bar (persistent), OSINT loader animation, results list with intelligence panel.

State management is handled via React hooks (`useState`, `useCallback`) — no external state library is needed given the app's focused scope.

### 7.2 Component Architecture

#### Search Layer
- **`SearchSection`**: Single input field with auto-focus, clear button, loading spinner. Submits to `useSearch` hook.
- **`OSINTLoader`**: Animated intelligence-gathering simulation. Displays progress across 6 sources (OFAC, EU, UN, UK, Canada, Graph Analysis) with weighted progress bar and status indicators.

#### Results Layer
- **`ResultsList`**: Tabbed view — "Sanctions" (OpenSanctions + Sanctions.io) and "Intelligence Graph" (Offshore Leaks).
- **`EntityCard`**: Premium intelligence cards with match score badge, sanction/PEP/connection badges, biographical info grid, collapsible aliases, and status bar.
- **`ResultsTabs`**: Source-aware tab navigation with counts.
- **`ExportButton`**: Dropdown for PDF, CSV, and JSON export.

#### Intelligence Panel
The **`IntelligencePanel`** is a slide-in panel (max-width 4xl) with 5 tabs:

| Tab | Content |
|-----|---------|
| **Overview** | Risk score, biographical data, key facts, sanctions summary, identification documents, addresses |
| **Sanctions** | Detailed sanctions program listings, legal basis, authority, dates, reasoning |
| **Relationships** | Interactive graph visualization, connection exploration, node details sidebar |
| **OSINT & Web** | Open-source intelligence links and web presence analysis |
| **Timeline** | Chronological listing/delisting events *(Phase 5 — planned)* |

#### Graph Visualization
- **`InteractiveGraph`**: Built on **React Flow** with **D3-Force** layout.
- **Layout**: Force-directed with charge repulsion (-400), link distance (150), collision avoidance (60px radius).
- **Interaction**: Pan, zoom, node click, node double-click (expansion planned).
- **Styling**: Color-coded relationship types (7 colors), animated edges, graph legend, control panel.

### 7.3 Type System

The frontend uses a rich TypeScript type hierarchy:

- **`Entity`** (union): `OpenSanctionsEntity | SanctionsIoEntity | OffshoreEntity | EnhancedEntity`
- **`UnifiedEntity`**: Normalized display type with `toUnifiedEntity()` transformation functions.
- **`EnhancedEntity`**: 40+ field type for Supabase-sourced entities (identifications, addresses, regulations, timeline events).
- **`SearchResponse`**: Aggregated response with per-source breakdown, summary stats, and metadata.
- **`ConnectionGraph`**: Typed graph structure with `GraphNode[]` and `GraphEdge[]`.

### 7.4 API Client

The `APIClient` class wraps Axios with:
- Base URL: `VITE_API_URL` environment variable or `/api` (relative, for Vercel).
- 15-second timeout (extended for multi-source queries).
- Response interceptor for structured error handling (`APIError` class).
- Two endpoints: `search()` and `getConnections()`.

---

## 8. Search & Matching Pipeline

### End-to-End Search Flow

```
User Query: "Vladimir Putin"
        │
        ▼
┌─────────────────────────────┐
│  POST /api/search           │
│  { query, limit, sources }  │
└──────────┬──────────────────┘
           │
     ┌─────┴─────┐
     │  PARALLEL  │
     ▼            ▼
┌─────────┐  ┌──────────┐
│Supabase │  │  Neo4j   │
│   RPC   │  │  Cypher  │
│search_  │  │  CONTAINS│
│sanctions│  │  search  │
└────┬────┘  └────┬─────┘
     │            │
     ▼            ▼
┌─────────────────────────────┐
│     RESULT AGGREGATION      │
│  • Fuzzy scoring (RapidFuzz)│
│  • Sanction prioritization  │
│  • Per-source breakdown     │
│  • Deduplication            │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│     SearchResponse JSON     │
│  • results_by_source        │
│  • all_results (sorted)     │
│  • total_results            │
│  • total_sanctioned         │
│  • sources_succeeded/failed │
│  • timestamp                │
└─────────────────────────────┘
```

### Matching Modes

| Mode | Behavior |
|------|----------|
| **Exact** | Only 100% name matches (or exact alias matches) are returned. |
| **Fuzzy** (default) | RapidFuzz `token_sort_ratio` + `partial_ratio` above configurable threshold (default 80%). Handles typos, name order variations, partial matches. |

### Supabase Search (PostgreSQL)

The `search_sanctions` RPC function uses PostgreSQL `pg_trgm` extension for trigram similarity:
- Similarity threshold: 0.3 (configurable)
- Searches across: name, aliases, nationalities, source
- Returns: match_score, programs, date_added, source_url

### Neo4j Search

Cypher query with `toLower(n.name) CONTAINS toLower($search_term)`:
- Scans all node types (Officer, Entity, Intermediary, Address)
- Returns connection counts via `COUNT { (n)--() }`
- Limited to configurable result count

---

## 9. Graph Intelligence Engine

### 9.1 Connection Retrieval

When a user requests the relationship graph for an entity:

1. `POST /api/connections` with `{ node_id, depth, max_nodes }`.
2. The `GraphService` executes a variable-length Cypher traversal:
   ```cypher
   MATCH (start) WHERE id(start) = $node_id
   MATCH path = (start)-[*1..{depth}]-(connected)
   LIMIT $max_nodes
   ```
3. Extracts all unique nodes and relationships from matched paths.
4. Deduplicates by node ID and edge (source, target, type) tuple.
5. Returns a `ConnectionGraph` with typed, colored nodes and labeled edges.

### 9.2 Visualization

The frontend transforms the `ConnectionGraph` into React Flow format:

- **Nodes**: Circular initial layout, then D3-Force simulation with configurable charge strength, link distance, and collision radius.
- **Edges**: Smooth-step type with directional arrows, color-coded by relationship type.
- **Controls**: Restart simulation, stop simulation, fit view, zoom, pan.
- **Legend**: Color key for central vs. connected entities and relationship direction.

### 9.3 Node Types & Colors

| Node Type | Color | Hex |
|-----------|-------|-----|
| Officer | Blue | `#3B82F6` |
| Entity | Green | `#10B981` |
| Intermediary | Orange | `#F59E0B` |
| Address | Gray | `#6B7280` |

---

## 10. Security & Access Control

### 10.1 Application Access

The platform is protected by a **password-locked access gate**:

- `LockScreen` component requires a pre-shared password before granting access.
- Successful authentication is persisted in `sessionStorage` for the browser session.
- The lock screen features a mesh gradient background and French-language UI (localized for the target deployment).

### 10.2 API Security

- **CORS**: All API endpoints set `Access-Control-Allow-Origin: *` (configured for serverless deployment).
- **Environment secrets**: All API keys, database credentials, and sensitive configuration are stored as Vercel environment variables — never committed to source.
- **Supabase**: Uses service key (server-side only) for full database access, with fallback to anon key.
- **Neo4j**: Authenticated connections with configurable connection pooling (max lifetime: 3600s, max pool: 50).

### 10.3 Input Validation

- **Frontend**: Minimum 2-character query validation before API call.
- **Backend**: Pydantic v2 model validation on all request payloads (`ConnectionRequest`, `SearchRequest`).
- **Error handling**: Structured error responses with type classification (`ValidationError`, `APIError`, `InternalError`).

---

## 11. Resilience & Fault Tolerance

### 11.1 Circuit Breaker Pattern

Each external service has a dedicated **PyBreaker circuit breaker**:

| Service | Fail Max | Reset Timeout |
|---------|----------|---------------|
| OpenSanctions | 5 | 30 seconds |
| Sanctions.io | 5 | 30 seconds |
| Neo4j | 5 | 60 seconds |

States: **CLOSED** (normal) → **OPEN** (fail-fast after threshold) → **HALF-OPEN** (testing recovery).

### 11.2 Retry with Exponential Backoff

External API calls use **Tenacity** retry logic:
- Max attempts: 3
- Wait: Exponential backoff (1s min, 10s max)
- Retry on: `TimeoutException`, `ConnectError`
- Non-retryable errors (4xx) fail immediately.

### 11.3 Graceful Degradation

The search pipeline is designed to return **partial results** when one or more sources fail:

- Each source is queried independently.
- Errors are captured per-source and included in the response (`sources_failed` array).
- The frontend displays source-specific error alerts while still showing results from healthy sources.

### 11.4 Health Check

`GET /api/health` returns system status:
```json
{
  "status": "healthy|degraded",
  "timestamp": "2026-02-28T12:00:00",
  "version": "1.0.0",
  "services": {
    "neo4j": { "status": "healthy", "message": "Connected" }
  }
}
```

---

## 12. Deployment & Infrastructure

### 12.1 Vercel Configuration

The platform deploys as a Vercel project with:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/frontend/dist/index.html" }
  ],
  "framework": "vite",
  "buildCommand": "cd frontend && npm ci --include=dev && npm run build",
  "outputDirectory": "frontend/dist"
}
```

- **Frontend**: Vite builds the React SPA to `frontend/dist/`, served via Vercel CDN.
- **API**: Python serverless functions in `api/` directory, each exporting a `handler` class extending `BaseHTTPRequestHandler`.
- **Routing**: `/api/*` routes to serverless functions; all other routes serve the SPA (client-side routing).

### 12.2 CI/CD

- GitHub repository (`bouksibkhalid-create/Cleargatenew`) is connected to Vercel.
- Every push to `main` triggers automatic deployment.
- Pull request comments and deployment status events are enabled.

### 12.3 Environment Variables

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (fallback) |
| `NEO4J_URI` | Neo4j Aura connection URI |
| `NEO4J_USER` | Neo4j username |
| `NEO4J_PASSWORD` | Neo4j password |
| `OPENSANCTIONS_API_KEY` | OpenSanctions API key |
| `SANCTIONS_IO_API_KEY` | Sanctions.io API key |
| `SENTRY_DSN` | Sentry error tracking (optional) |
| `VITE_API_URL` | Frontend API base URL |

---

## 13. Data Model

### 13.1 Enhanced Entity Model (40+ Fields)

```
CORE IDENTITY (9 fields)
├── id, external_id, name, full_name
├── first_name, middle_name, last_name
├── title, aliases[]

CLASSIFICATION (2 fields)
├── entity_type (Person | Organization | Vessel)
└── source

BIOGRAPHICAL (5 fields)
├── birth_date, birth_place, birth_city
├── birth_country, gender

GEOGRAPHIC (2 fields)
├── citizenship_countries[]
└── nationalities[]

IDENTIFICATIONS (array)
└── IdentificationDocument { type, number, country, dates, verified }

ADDRESSES (array)
└── StructuredAddress { street, city, region, postal, country, type }

PROFESSIONAL (4 fields)
├── positions[], current_position
├── business_affiliations[]
└── industry_sectors[]

SANCTIONS (7 fields) — CRITICAL
├── is_sanctioned, sanctions_reason, sanctions_summary
├── legal_basis, legal_articles[]
├── measures[], sanction_lists[]

REGULATORY (5 fields)
├── regulation_ids[], programmes[]
├── first_listed_date, last_updated_date
└── designation_status

REGULATIONS (array)
└── RegulationDetail { id, programme, type, dates, legal_basis, remarks }

TIMELINE (array)
└── TimelineEvent { type, date, description, regulation_id, source }

RISK (3 fields)
├── risk_score, risk_level
└── risk_factors[]

METADATA (4 fields)
├── data_completeness_score
├── last_verified_at, source_url, updated_at
└── match_score
```

### 13.2 Graph Model (Neo4j)

```
(:Officer)-[:OFFICER_OF]->(:Entity)
(:Officer)-[:SHAREHOLDER_OF]->(:Entity)
(:Entity)-[:REGISTERED_ADDRESS]->(:Address)
(:Intermediary)-[:INTERMEDIARY_OF]->(:Entity)
(:Officer)-[:CONNECTED_TO]->(:Officer)
(:Officer)-[:BENEFICIAL_OWNER]->(:Entity)
(:Officer)-[:DIRECTOR_OF]->(:Entity)
```

### 13.3 Unified Display Model

The frontend transforms all source-specific types into a `UnifiedEntity` for consistent rendering:

| Field | Source: OpenSanctions | Source: Offshore Leaks | Source: Enhanced (Supabase) |
|-------|----------------------|------------------------|---------------------------|
| `isSanctioned` | From programs + topics | Always `false` | Always `true` |
| `isPEP` | From datasets containing "pep" | `false` | `false` (planned) |
| `riskScore` | 75 (sanctioned) / 25 (not) | 50 (fixed) | From `risk_score` field |
| `source` | "OpenSanctions" | "Intelligence" | From `source` field |

---

## 14. Export & Reporting

The `ExportButton` component provides three export formats:

| Format | Library | Content |
|--------|---------|---------|
| **PDF** | jsPDF + jspdf-autotable | Formatted report with header, entity table, sanctions details |
| **CSV** | Native JS | Tabular data export (name, type, sanctioned, score, source, aliases) |
| **JSON** | Native JS | Full `SearchResponse` object for programmatic consumption |

---

## 15. Roadmap

| Phase | Status | Features |
|-------|--------|----------|
| **Module 1** | Completed | OpenSanctions integration, basic search, entity cards |
| **Module 2** | Completed | Fuzzy matching, Sanctions.io integration, multi-source aggregation |
| **Module 3** | Completed | Neo4j Offshore Leaks, graph visualization, connection exploration |
| **Module 4** | Completed | Export (PDF/CSV/JSON), enhanced entity profiles (40+ fields), Supabase integration |
| **Phase 5** | Planned | Event timeline, PEP detection, node expansion in graph, advanced filtering |
| **Future** | Planned | Real-time monitoring/alerts, batch screening, API access for third-party integration |

---

## Appendix A: API Reference

### POST /api/search

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
    "opensanctions": { "found": true, "count": 5, "sanctioned_count": 3, "results": [...] },
    "sanctions_io": { "found": false, "count": 0, "error": "Not configured", "results": [] },
    "offshore_leaks": { "found": true, "count": 2, "sanctioned_count": 0, "results": [...] }
  },
  "all_results": [...],
  "total_results": 7,
  "total_sanctioned": 3,
  "offshore_connections_found": true,
  "sources_searched": ["opensanctions", "sanctions_io", "offshore_leaks"],
  "sources_succeeded": ["opensanctions", "offshore_leaks"],
  "sources_failed": ["sanctions_io"],
  "timestamp": "2026-02-28T12:00:00Z",
  "fuzzy_threshold": 80
}
```

### POST /api/connections

**Request:**
```json
{
  "node_id": 12345,
  "depth": 2,
  "max_nodes": 50
}
```

**Response:**
```json
{
  "node_id": 12345,
  "node_name": "Mossack Fonseca",
  "graph": {
    "nodes": [
      { "id": "12345", "label": "Mossack Fonseca", "node_type": "Entity", "color": "#10B981", "properties": {} }
    ],
    "edges": [
      { "id": "1", "source": "12345", "target": "67890", "relationship_type": "INTERMEDIARY_OF", "properties": {} }
    ],
    "center_node_id": "12345",
    "depth": 2,
    "node_count": 15,
    "edge_count": 22
  }
}
```

### GET /api/health

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-28T12:00:00",
  "version": "1.0.0",
  "services": {
    "neo4j": { "status": "healthy", "message": "Connected" }
  }
}
```

---

*ClearGate Intelligence Platform — Developed for comprehensive sanctions screening and due diligence analysis.*
