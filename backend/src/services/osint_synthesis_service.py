"""OSINT Synthesis Service — generates due diligence profiles for non-sanctioned entities.

Takes scraped web content from dorking results and uses Claude to synthesize a
structured profile: biography, adverse media summary, risk assessment, and source list.
Supports EN/FR output language. Falls back to a template when Claude is unavailable.
"""

import json
import re
import time
from datetime import datetime
from typing import Dict, List, Optional

import httpx

from src.config.settings import Settings
from src.utils.logger import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# System prompts (EN / FR)
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_EN = """You are a senior due diligence analyst. You have been given web content scraped from multiple sources about an entity that was NOT found on any international sanctions list.

Your task is to synthesize a structured due diligence profile based ONLY on the provided text. Do not hallucinate external knowledge. If the text does not contain enough information for a section, explicitly state that the information is unavailable.

Produce a JSON object with these fields:

1. **biography**: A fluent paragraph (100-200 words) summarizing who the entity is — their role, occupation, nationality, key affiliations, and public profile. If the scraped text is insufficient, write: "Insufficient public information available to establish a biographical profile."

2. **adverse_summary**: A paragraph (100-200 words) summarizing any negative findings — legal issues, controversies, fraud allegations, regulatory actions, negative press. If nothing adverse was found, write: "No adverse media or negative findings were identified in the sources investigated."

3. **risk_assessment**: One of "low", "medium", or "high" based on the findings.

4. **risk_rationale**: 1-2 sentences explaining why you assigned that risk level.

Respond ONLY with valid JSON:
{
  "biography": "...",
  "adverse_summary": "...",
  "risk_assessment": "low|medium|high",
  "risk_rationale": "..."
}

Do not include any text outside the JSON object."""

SYSTEM_PROMPT_FR = """Vous êtes un analyste senior en due diligence. On vous a fourni du contenu web extrait de plusieurs sources concernant une entité qui n'a été trouvée sur AUCUNE liste de sanctions internationales.

Votre tâche est de synthétiser un profil de due diligence structuré basé UNIQUEMENT sur le texte fourni. N'inventez pas d'informations externes. Si le texte ne contient pas suffisamment d'informations pour une section, indiquez explicitement que l'information n'est pas disponible.

Produisez un objet JSON avec ces champs :

1. **biography** : Un paragraphe fluide (100-200 mots) résumant qui est l'entité — son rôle, sa profession, sa nationalité, ses affiliations clés et son profil public. Si le texte est insuffisant, écrivez : « Informations publiques insuffisantes pour établir un profil biographique. »

2. **adverse_summary** : Un paragraphe (100-200 mots) résumant les résultats négatifs — problèmes juridiques, controverses, allégations de fraude, actions réglementaires, presse négative. Si rien de négatif n'a été trouvé, écrivez : « Aucun média défavorable ni résultat négatif n'a été identifié dans les sources examinées. »

3. **risk_assessment** : « low », « medium » ou « high » selon les résultats.

4. **risk_rationale** : 1-2 phrases expliquant pourquoi vous avez attribué ce niveau de risque.

Répondez UNIQUEMENT avec du JSON valide :
{
  "biography": "...",
  "adverse_summary": "...",
  "risk_assessment": "low|medium|high",
  "risk_rationale": "..."
}

N'incluez aucun texte en dehors de l'objet JSON."""


USER_PROMPT_TEMPLATE = """Entity under investigation: {entity_name}
Entity type: {entity_type}
Country: {country}

This entity was screened against international sanctions databases (OFAC, EU, UN, UK, Canada) and NO matches were found. The entity is NOT sanctioned.

Below is the content scraped from {source_count} web sources found via targeted search queries:

{scraped_context}

Based ONLY on the above text, generate the due diligence profile JSON."""


# ---------------------------------------------------------------------------
# Fallback templates
# ---------------------------------------------------------------------------

FALLBACK_BIO_EN = "Insufficient public information available to establish a biographical profile from the sources investigated."
FALLBACK_BIO_FR = "Informations publiques insuffisantes pour établir un profil biographique à partir des sources examinées."

FALLBACK_ADVERSE_EN = "No adverse media or negative findings were identified in the sources investigated."
FALLBACK_ADVERSE_FR = "Aucun média défavorable ni résultat négatif n'a été identifié dans les sources examinées."

NO_SOURCES_EN = "Not Sanctioned. No significant digital footprint found during OSINT scan."
NO_SOURCES_FR = "Non sanctionné. Aucune empreinte numérique significative trouvée lors de l'analyse OSINT."


class OSINTSynthesisResult:
    """Structured result from OSINT synthesis."""

    def __init__(
        self,
        biography: str = "",
        adverse_summary: str = "",
        risk_assessment: str = "low",
        risk_rationale: str = "",
        model_used: str = "fallback",
        error: Optional[str] = None,
    ):
        self.biography = biography
        self.adverse_summary = adverse_summary
        self.risk_assessment = risk_assessment
        self.risk_rationale = risk_rationale
        self.model_used = model_used
        self.error = error


class OSINTSynthesisService:
    """Generates due diligence profiles using Claude API."""

    ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
    ANTHROPIC_VERSION = "2023-06-01"

    def __init__(self, settings: Optional[Settings] = None):
        if settings is None:
            settings = Settings()
        self.api_key = settings.ANTHROPIC_API_KEY
        self.model = settings.AI_ANALYSIS_MODEL
        self.timeout = settings.AI_ANALYSIS_TIMEOUT
        self.enabled = bool(self.api_key)

    async def synthesize(
        self,
        entity_name: str,
        entity_type: str = "individual",
        country: str = "",
        scraped_context: str = "",
        source_count: int = 0,
        lang: str = "en",
    ) -> OSINTSynthesisResult:
        """Main entry point. Calls Claude or falls back to templates."""

        # No scraped content at all
        if not scraped_context.strip():
            return self._no_sources_fallback(lang)

        if not self.enabled:
            logger.info("osint_synthesis_disabled", reason="No ANTHROPIC_API_KEY")
            return self._fallback(lang)

        try:
            return await self._call_claude(
                entity_name, entity_type, country,
                scraped_context, source_count, lang,
            )
        except Exception as exc:
            logger.error("osint_synthesis_failed", error=str(exc))
            result = self._fallback(lang)
            result.error = f"OSINT synthesis failed: {str(exc)}"
            return result

    async def _call_claude(
        self,
        entity_name: str,
        entity_type: str,
        country: str,
        scraped_context: str,
        source_count: int,
        lang: str,
    ) -> OSINTSynthesisResult:
        """Execute Claude API call."""
        system_prompt = SYSTEM_PROMPT_FR if lang == "fr" else SYSTEM_PROMPT_EN
        user_prompt = USER_PROMPT_TEMPLATE.format(
            entity_name=entity_name,
            entity_type=entity_type,
            country=country or "Not specified",
            source_count=source_count,
            scraped_context=scraped_context,
        )

        start = time.time()

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(
                self.ANTHROPIC_API_URL,
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": self.ANTHROPIC_VERSION,
                    "content-type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": 2048,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                },
            )
            resp.raise_for_status()

        elapsed_ms = int((time.time() - start) * 1000)
        data = resp.json()
        text = data["content"][0]["text"]

        parsed = self._parse_response(text)

        logger.info(
            "osint_synthesis_complete",
            entity=entity_name,
            risk=parsed.get("risk_assessment", "unknown"),
            elapsed_ms=elapsed_ms,
        )

        return OSINTSynthesisResult(
            biography=parsed.get("biography", ""),
            adverse_summary=parsed.get("adverse_summary", ""),
            risk_assessment=parsed.get("risk_assessment", "low"),
            risk_rationale=parsed.get("risk_rationale", ""),
            model_used=self.model,
        )

    def _parse_response(self, text: str) -> Dict:
        """Parse Claude's JSON response."""
        # Try direct parse
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass

        # Strip markdown fences
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

        # Extract JSON object
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Could not parse OSINT synthesis response: {text[:200]}")

    def _fallback(self, lang: str) -> OSINTSynthesisResult:
        """Template-based fallback when Claude is unavailable."""
        if lang == "fr":
            return OSINTSynthesisResult(
                biography=FALLBACK_BIO_FR,
                adverse_summary=FALLBACK_ADVERSE_FR,
                risk_assessment="low",
                risk_rationale="Aucune information défavorable identifiée. Analyse IA indisponible.",
                model_used="fallback-template-v1",
            )
        return OSINTSynthesisResult(
            biography=FALLBACK_BIO_EN,
            adverse_summary=FALLBACK_ADVERSE_EN,
            risk_assessment="low",
            risk_rationale="No adverse information identified. AI analysis unavailable.",
            model_used="fallback-template-v1",
        )

    def _no_sources_fallback(self, lang: str) -> OSINTSynthesisResult:
        """Fallback when dorking returned 0 links."""
        if lang == "fr":
            return OSINTSynthesisResult(
                biography=NO_SOURCES_FR,
                adverse_summary=FALLBACK_ADVERSE_FR,
                risk_assessment="low",
                risk_rationale="Aucune empreinte numérique significative trouvée.",
                model_used="no-sources",
            )
        return OSINTSynthesisResult(
            biography=NO_SOURCES_EN,
            adverse_summary=FALLBACK_ADVERSE_EN,
            risk_assessment="low",
            risk_rationale="No significant digital footprint found.",
            model_used="no-sources",
        )
