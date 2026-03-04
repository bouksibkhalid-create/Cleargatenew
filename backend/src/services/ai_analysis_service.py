"""AI Analysis Service — M4: Generates compliance narratives using Claude's API.

Calls Anthropic's Messages API with structured intelligence data and a carefully
engineered system prompt. Falls back to template-based summaries when the API
is unavailable or unconfigured.
"""

import json
import os
import re
import time
from datetime import datetime
from typing import Dict, List, Optional

import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from src.config.settings import Settings
from src.models.ai_analysis import AIAnalysisInput, AIAnalysisResult
from src.utils.logger import get_logger
from src.utils.circuit_breaker import ai_analysis_breaker, CircuitBreakerError

logger = get_logger(__name__)

# Retry: 2 attempts only (LLM calls are expensive). Retry on 5xx/timeout, NOT 4xx.
MAX_RETRIES = 2
RETRY_MIN_WAIT = 2.0
RETRY_MAX_WAIT = 10.0


# ---------------------------------------------------------------------------
# System prompt (PRD §4.1)
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are a senior KYC/AML compliance analyst at a leading financial institution. Your role is to synthesize intelligence data into clear, professional compliance narratives.

You will receive structured data about an entity (individual or organization) including sanctions screening results, PEP status, adverse media findings, offshore connection data, and a computed risk score.

Your task is to produce three outputs in a specific JSON format:

1. **executive_summary**: A single, fluent paragraph (200–350 words) that:
   - Opens by identifying WHO the entity is: their known public role, title, position, nationality, and any key affiliations or organizational ties. Use your knowledge to provide factual biographical context so the compliance officer can confirm they are reviewing the correct individual. For example, for a head of state, mention their country and tenure; for a businessperson, mention their company and sector.
   - States the risk score and risk level
   - Summarizes sanctions screening findings (number of hits, which lists, jurisdictions)
   - Addresses PEP status if applicable, with details on their political role
   - Describes adverse media findings with specific references to the most significant articles
   - Mentions offshore connections if present
   - Closes with a compliance recommendation (standard monitoring, enhanced due diligence, or escalation)
   - Uses professional, neutral compliance language — no speculation, no opinion
   - You MAY use your general knowledge to identify the entity (their role, position, country, etc.) but you must NOT invent sanctions data, risk scores, or screening results that are not in the provided data

2. **key_findings**: An array of 3–6 short bullet-point strings (one sentence each) highlighting the most important findings. The first finding should always be a brief identification of who the entity is. Remaining findings should be factual and cite the data source.

3. **recommendation**: A single sentence stating the recommended compliance action based on the risk level.

Respond ONLY with valid JSON in this exact format:
{
  "executive_summary": "...",
  "key_findings": ["...", "..."],
  "recommendation": "..."
}

Do not include any text outside the JSON object. Do not use markdown formatting inside the JSON values."""


# ---------------------------------------------------------------------------
# User prompt template (PRD §4.2)
# ---------------------------------------------------------------------------
USER_PROMPT_TEMPLATE = """Analyze the following entity for KYC/AML compliance:

=== ENTITY INFORMATION ===
Name: {entity_name}
Type: {entity_type}
Country: {country}

=== RISK ASSESSMENT ===
Risk Score: {risk_score}/100
Risk Level: {risk_level}
Risk Factors:
{risk_factors_formatted}

Score Breakdown:
- Sanctions: {breakdown_sanctions} points
- PEP: {breakdown_pep} points
- Adverse Media: {breakdown_adverse_media} points
- Offshore Connections: {breakdown_offshore} points

=== SANCTIONS SCREENING ===
Sanctions Hits: {sanctions_hits}
Sanctioned: {is_sanctioned}
Sanctions Lists: {sanctions_lists_or_none}

=== PEP STATUS ===
PEP: {is_pep}
PEP Hits: {pep_hits}
PEP Details: {pep_details_or_none}

=== ADVERSE MEDIA ({adverse_media_total} hits) ===
High Severity: {adverse_media_high}
Medium Severity: {adverse_media_medium}
Low Severity: {adverse_media_low}

Articles:
{adverse_media_articles_formatted}

=== OFFSHORE CONNECTIONS ===
Connections Found: {offshore_connections}
Officer Role: {offshore_is_officer}
Beneficial Owner: {offshore_is_beneficiary}

Generate the compliance analysis JSON."""


# ---------------------------------------------------------------------------
# Recommendation templates for fallback
# ---------------------------------------------------------------------------
RECOMMENDATION_MAP = {
    "low": "Standard monitoring procedures are sufficient.",
    "medium": "Enhanced due diligence is recommended.",
    "high": "Elevated scrutiny and senior review are required.",
    "critical": "Immediate escalation to compliance leadership is required.",
}


class AIAnalysisService:
    """Generates compliance narratives using Claude's API."""

    ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
    ANTHROPIC_VERSION = "2023-06-01"

    def __init__(self, settings: Optional[Settings] = None):
        if settings is None:
            settings = Settings()

        self.api_key = settings.ANTHROPIC_API_KEY
        self.model = settings.AI_ANALYSIS_MODEL
        self.max_tokens = settings.AI_ANALYSIS_MAX_TOKENS
        self.timeout = settings.AI_ANALYSIS_TIMEOUT
        self.enabled = bool(self.api_key)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def analyze(self, input_data: AIAnalysisInput) -> AIAnalysisResult:
        """Main entry point. Calls Claude API or falls back to templates."""
        if not self.enabled:
            logger.info("ai_analysis_disabled", reason="No ANTHROPIC_API_KEY configured")
            return self._fallback(input_data)

        # Check circuit breaker
        if ai_analysis_breaker.current_state == "open":
            logger.warning("ai_analysis_circuit_open")
            result = self._fallback(input_data)
            result.error = "AI analysis temporarily unavailable (circuit open). Using template summary."
            return result

        try:
            return await self._call_claude(input_data)
        except Exception as exc:
            logger.error("ai_analysis_claude_failed", error=str(exc))
            # Record failure on breaker
            try:
                ai_analysis_breaker.call(lambda: (_ for _ in ()).throw(exc))
            except (CircuitBreakerError, Exception):
                pass
            result = self._fallback(input_data)
            result.error = f"AI generation failed: {str(exc)}. Using template summary."
            return result

    # ------------------------------------------------------------------
    # Claude API call (PRD §6.2)
    # ------------------------------------------------------------------

    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=RETRY_MIN_WAIT, max=RETRY_MAX_WAIT),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        reraise=True,
    )
    async def _call_claude(self, input_data: AIAnalysisInput) -> AIAnalysisResult:
        """Execute Claude API call and parse response."""
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(input_data)

        start_time = time.time()

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                self.ANTHROPIC_API_URL,
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": self.ANTHROPIC_VERSION,
                    "content-type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": self.max_tokens,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                },
            )
            response.raise_for_status()

        elapsed_ms = int((time.time() - start_time) * 1000)
        data = response.json()

        # Extract text from response
        text = data["content"][0]["text"]
        usage = data.get("usage", {})
        tokens_used = usage.get("input_tokens", 0) + usage.get("output_tokens", 0)

        # Parse and validate JSON from Claude's response
        parsed = self._parse_response(text)
        self._validate_parsed(parsed)

        logger.info(
            "ai_analysis_complete",
            model=self.model,
            tokens=tokens_used,
            elapsed_ms=elapsed_ms,
        )

        return AIAnalysisResult(
            executive_summary=parsed["executive_summary"],
            key_findings=parsed["key_findings"],
            recommendation=parsed["recommendation"],
            model_used=self.model,
            tokens_used=tokens_used,
            generation_time_ms=elapsed_ms,
            generated_at=datetime.utcnow().isoformat() + "Z",
        )

    # ------------------------------------------------------------------
    # Prompt building
    # ------------------------------------------------------------------

    def _build_system_prompt(self) -> str:
        """Return the system prompt for Claude."""
        return SYSTEM_PROMPT

    def _build_user_prompt(self, input_data: AIAnalysisInput) -> str:
        """Build the user prompt with all entity data embedded."""
        return USER_PROMPT_TEMPLATE.format(
            entity_name=input_data.entity_name,
            entity_type=input_data.entity_type,
            country=input_data.country or "Not specified",
            risk_score=input_data.risk_score,
            risk_level=input_data.risk_level,
            risk_factors_formatted=self._format_risk_factors(input_data.risk_factors),
            breakdown_sanctions=input_data.score_breakdown.get("sanctions", 0),
            breakdown_pep=input_data.score_breakdown.get("pep", 0),
            breakdown_adverse_media=input_data.score_breakdown.get("adverse_media", 0),
            breakdown_offshore=input_data.score_breakdown.get("offshore", 0),
            sanctions_hits=input_data.sanctions_hits,
            is_sanctioned=input_data.is_sanctioned,
            sanctions_lists_or_none=", ".join(input_data.sanctions_lists) if input_data.sanctions_lists else "None",
            is_pep=input_data.is_pep,
            pep_hits=input_data.pep_hits,
            pep_details_or_none=input_data.pep_details or "None",
            adverse_media_total=input_data.adverse_media_total,
            adverse_media_high=input_data.adverse_media_high,
            adverse_media_medium=input_data.adverse_media_medium,
            adverse_media_low=input_data.adverse_media_low,
            adverse_media_articles_formatted=self._format_media_articles(input_data.adverse_media_hits),
            offshore_connections=input_data.offshore_connections,
            offshore_is_officer=input_data.offshore_is_officer,
            offshore_is_beneficiary=input_data.offshore_is_beneficiary,
        )

    def _format_risk_factors(self, factors: List[str]) -> str:
        """Format risk factors as a bulleted list."""
        if not factors:
            return "  None"
        return "\n".join(f"  - {f}" for f in factors)

    def _format_media_articles(self, hits: List[Dict], limit: int = 10) -> str:
        """Format adverse media hits for the prompt."""
        if not hits:
            return "  None"

        # Sort by severity (high first) and take top N
        severity_order = {"high": 0, "medium": 1, "low": 2}
        sorted_hits = sorted(
            hits,
            key=lambda h: severity_order.get(h.get("severity", "low"), 3),
        )[:limit]

        lines = []
        for hit in sorted_hits:
            severity = hit.get("severity", "unknown").upper()
            title = hit.get("title", "Untitled")
            source = hit.get("source_name", "Unknown")
            date = hit.get("published_date", "Unknown date")
            snippet = hit.get("snippet", "")
            lines.append(f'- [{severity}] "{title}" ({source}, {date})')
            if snippet:
                lines.append(f"  Excerpt: {snippet}")
        return "\n".join(lines) if lines else "  None"

    # ------------------------------------------------------------------
    # Response parsing (PRD §7)
    # ------------------------------------------------------------------

    def _parse_response(self, text: str) -> Dict:
        """Parse Claude's JSON response with fallback extraction."""

        # Step 1: Try direct JSON parse
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass

        # Step 2: Strip markdown code fences if present
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        try:
            return json.loads(cleaned.strip())
        except json.JSONDecodeError:
            pass

        # Step 3: Extract JSON object from anywhere in the text
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # Step 4: Failed to parse
        raise ValueError(f"Could not parse Claude response as JSON: {text[:200]}...")

    def _validate_parsed(self, parsed: Dict) -> Dict:
        """Ensure all required fields exist with correct types."""
        if not isinstance(parsed.get("executive_summary"), str):
            raise ValueError("Missing or invalid executive_summary")
        if not isinstance(parsed.get("key_findings"), list):
            raise ValueError("Missing or invalid key_findings")
        if not isinstance(parsed.get("recommendation"), str):
            raise ValueError("Missing or invalid recommendation")
        if len(parsed["executive_summary"]) < 50:
            raise ValueError("Summary too short")
        if len(parsed["key_findings"]) < 1:
            raise ValueError("No findings")
        return parsed

    # ------------------------------------------------------------------
    # Fallback (PRD §8)
    # ------------------------------------------------------------------

    def _fallback(self, input_data: AIAnalysisInput) -> AIAnalysisResult:
        """Generate a template-based summary without Claude."""
        parts = []

        # Opening
        type_label = "an individual" if input_data.entity_type == "individual" else "an organization"
        country_str = f" based in {input_data.country}" if input_data.country else ""
        parts.append(
            f"{input_data.entity_name} is {type_label}{country_str} "
            f"with a risk score of {input_data.risk_score}/100 ({input_data.risk_level} risk)."
        )

        # Sanctions
        if input_data.is_sanctioned:
            lists_str = ", ".join(input_data.sanctions_lists) if input_data.sanctions_lists else "international sanctions lists"
            parts.append(f"The entity has active matches on {lists_str}.")
        else:
            parts.append("No matches were found on active sanctions lists.")

        # PEP
        if input_data.is_pep:
            if input_data.pep_details:
                parts.append(f"The entity is classified as a Politically Exposed Person: {input_data.pep_details}.")
            else:
                parts.append("The entity is classified as a Politically Exposed Person (PEP).")

        # Adverse media
        if input_data.adverse_media_total > 0:
            parts.append(
                f"{input_data.adverse_media_total} adverse media hit(s) were identified "
                f"({input_data.adverse_media_high} high severity, "
                f"{input_data.adverse_media_medium} medium severity, "
                f"{input_data.adverse_media_low} low severity)."
            )

        # Offshore
        if input_data.offshore_connections > 0:
            parts.append(
                f"The entity has {input_data.offshore_connections} connection(s) "
                f"in the ICIJ Offshore Leaks database."
            )

        # Recommendation
        recommendation = RECOMMENDATION_MAP.get(
            input_data.risk_level, "Further review is recommended."
        )
        parts.append(recommendation)

        # Build key findings from risk factors
        key_findings = (
            input_data.risk_factors
            if input_data.risk_factors
            else ["No significant risk indicators identified."]
        )

        return AIAnalysisResult(
            executive_summary=" ".join(parts),
            key_findings=key_findings,
            recommendation=recommendation,
            model_used="fallback-template-v1",
            tokens_used=0,
            generation_time_ms=0,
            generated_at=datetime.utcnow().isoformat() + "Z",
        )
