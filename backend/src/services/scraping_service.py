"""Scraping Service — fetches and extracts readable text from URLs.

Takes an array of URLs (from dorking results), fetches each with a 3-second timeout,
strips HTML to plain text using BeautifulSoup, and returns concatenated readable content.
Falls back to the dorking snippet when a URL cannot be scraped.
"""

import asyncio
import re
from typing import Dict, List, Optional

import httpx
from bs4 import BeautifulSoup

from src.utils.logger import get_logger

logger = get_logger(__name__)

# Domains that commonly block scrapers — skip and use snippet
BLOCKED_DOMAINS = {
    "linkedin.com", "facebook.com", "instagram.com", "twitter.com",
    "x.com", "tiktok.com",
}

MAX_CONTENT_LENGTH = 15_000  # chars per page
TOTAL_CONTEXT_CAP = 80_000  # total chars across all pages
TIMEOUT_SECONDS = 3.0
MAX_URLS = 10


class ScrapedPage:
    """Result from scraping a single URL."""

    def __init__(
        self,
        url: str,
        title: str = "",
        text: str = "",
        snippet_fallback: str = "",
        success: bool = False,
        error: Optional[str] = None,
    ):
        self.url = url
        self.title = title
        self.text = text
        self.snippet_fallback = snippet_fallback
        self.success = success
        self.error = error

    @property
    def content(self) -> str:
        """Return best available content: full text or snippet fallback."""
        return self.text if self.success and self.text else self.snippet_fallback

    def to_dict(self) -> Dict:
        return {
            "url": self.url,
            "title": self.title,
            "text_length": len(self.content),
            "success": self.success,
            "error": self.error,
        }


class ScrapingService:
    """Fetches and extracts text from a list of URLs."""

    def __init__(self):
        self._headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }

    async def scrape_urls(
        self,
        urls_with_snippets: List[Dict],
        max_urls: int = MAX_URLS,
    ) -> List[ScrapedPage]:
        """Scrape a list of URLs concurrently.

        Args:
            urls_with_snippets: List of {"url": str, "snippet": str, "title": str}
            max_urls: Maximum number of URLs to scrape

        Returns:
            List of ScrapedPage results
        """
        targets = urls_with_snippets[:max_urls]
        if not targets:
            return []

        tasks = [self._scrape_one(t) for t in targets]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        pages: List[ScrapedPage] = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                pages.append(ScrapedPage(
                    url=targets[i].get("url", ""),
                    title=targets[i].get("title", ""),
                    snippet_fallback=targets[i].get("snippet", ""),
                    success=False,
                    error=str(result),
                ))
            else:
                pages.append(result)

        logger.info(
            "scraping_complete",
            total=len(pages),
            succeeded=sum(1 for p in pages if p.success),
            failed=sum(1 for p in pages if not p.success),
        )
        return pages

    def build_context(self, pages: List[ScrapedPage]) -> str:
        """Build a single context string from all scraped pages, capped at TOTAL_CONTEXT_CAP."""
        parts: List[str] = []
        total_len = 0

        for page in pages:
            content = page.content
            if not content:
                continue

            # Cap individual page
            if len(content) > MAX_CONTENT_LENGTH:
                content = content[:MAX_CONTENT_LENGTH] + "..."

            section = f"--- SOURCE: {page.url} ---\nTitle: {page.title}\n{content}\n"

            if total_len + len(section) > TOTAL_CONTEXT_CAP:
                remaining = TOTAL_CONTEXT_CAP - total_len
                if remaining > 200:
                    parts.append(section[:remaining] + "...[truncated]")
                break

            parts.append(section)
            total_len += len(section)

        return "\n".join(parts)

    async def _scrape_one(self, target: Dict) -> ScrapedPage:
        """Scrape a single URL."""
        url = target.get("url", "")
        snippet = target.get("snippet", "")
        title = target.get("title", "")

        # Skip known blocked domains
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.lower()
        for blocked in BLOCKED_DOMAINS:
            if blocked in domain:
                return ScrapedPage(
                    url=url, title=title,
                    snippet_fallback=snippet,
                    success=False,
                    error=f"Blocked domain: {domain}",
                )

        try:
            async with httpx.AsyncClient(
                timeout=TIMEOUT_SECONDS,
                follow_redirects=True,
                headers=self._headers,
            ) as client:
                resp = await client.get(url)
                resp.raise_for_status()

                content_type = resp.headers.get("content-type", "")
                if "text/html" not in content_type and "text/plain" not in content_type:
                    return ScrapedPage(
                        url=url, title=title,
                        snippet_fallback=snippet,
                        success=False,
                        error=f"Non-text content: {content_type}",
                    )

                text = self._extract_text(resp.text, url)
                page_title = self._extract_title(resp.text) or title

                if len(text.strip()) < 50:
                    return ScrapedPage(
                        url=url, title=page_title,
                        snippet_fallback=snippet,
                        success=False,
                        error="Extracted text too short (paywall or JS-rendered)",
                    )

                return ScrapedPage(
                    url=url,
                    title=page_title,
                    text=text,
                    snippet_fallback=snippet,
                    success=True,
                )

        except httpx.TimeoutException:
            return ScrapedPage(
                url=url, title=title,
                snippet_fallback=snippet,
                success=False,
                error="Timeout (>3s)",
            )
        except Exception as e:
            return ScrapedPage(
                url=url, title=title,
                snippet_fallback=snippet,
                success=False,
                error=str(e)[:200],
            )

    def _extract_text(self, html: str, url: str) -> str:
        """Extract readable text from HTML, stripping boilerplate."""
        soup = BeautifulSoup(html, "html.parser")

        # Remove non-content elements
        for tag in soup.find_all(["script", "style", "nav", "header", "footer",
                                   "aside", "iframe", "noscript", "form"]):
            tag.decompose()

        # Try to find main content area
        main = (
            soup.find("article") or
            soup.find("main") or
            soup.find(attrs={"role": "main"}) or
            soup.find(class_=re.compile(r"(article|content|post|entry|story)", re.I))
        )

        target = main if main else soup.body if soup.body else soup
        text = target.get_text(separator="\n", strip=True)

        # Clean up: collapse whitespace, remove very short lines
        lines = [line.strip() for line in text.splitlines() if len(line.strip()) > 20]
        return "\n".join(lines)

    def _extract_title(self, html: str) -> str:
        """Extract page title from HTML."""
        soup = BeautifulSoup(html, "html.parser")
        title_tag = soup.find("title")
        if title_tag and title_tag.string:
            return title_tag.string.strip()[:200]
        return ""
