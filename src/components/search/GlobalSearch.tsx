"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import ArrowBackIcon from "@/components/icons/material/ArrowBackIcon";
import CloseIcon from "@/components/icons/material/CloseIcon";
import { getDetailsSummaryByFields, getFoodOpeningStatus, hasSchemaField } from "@/lib/listing-details";
import type { ListingSchemaFieldSummary } from "@/types/listing";
import { getListingPath } from "@/lib/listing-path";

type SearchSuggestion = {
  id: string;
  label: string;
  query: string;
};

type SearchResult = {
  id: string;
  slug: string;
  title: string;
  details: Record<string, unknown>;
  primaryCategory: {
    slug: string;
    label: string;
    schema: {
      fields: ListingSchemaFieldSummary[];
    } | null;
  };
  categories: Array<{
    category: {
      slug: string;
      label: string;
    };
  }>;
};

type SearchResponse = {
  suggestions: SearchSuggestion[];
  results: SearchResult[];
};

const MIN_SEARCH_CHARACTERS = 2;
const SEARCH_DEBOUNCE_MS = 280;
const SUGGESTIONS_CACHE_TTL_MS = 60 * 1000;

type GlobalSearchProps = {
  placeholder?: string;
};

function getSearchResultDetails(result: SearchResult): { summary: string; openingStatus: string | null } {
  const summary = getDetailsSummaryByFields(result.primaryCategory.schema?.fields, result.details);

  if (!hasSchemaField(result.primaryCategory.schema?.fields, "openingHours")) {
    return { summary, openingStatus: null };
  }

  const openingStatus = getFoodOpeningStatus(result.details);

  if (!openingStatus) {
    return { summary, openingStatus: null };
  }

  const summaryWithoutOpeningStatus = summary
    .replace(` · ${openingStatus}`, "")
    .replace(`${openingStatus} · `, "")
    .replace(openingStatus, "")
    .trim();

  return {
    summary: summaryWithoutOpeningStatus,
    openingStatus
  };
}

export default function GlobalSearch({ placeholder = "What are you looking for?" }: GlobalSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsCacheRef = useRef<{ data: SearchSuggestion[]; loadedAt: number } | null>(null);
  const searchRequestRef = useRef(0);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const suggestionsOpenRequestRef = useRef(0);
  const wasOpenRef = useRef(false);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [displayMode, setDisplayMode] = useState<"suggestions" | "results">("suggestions");
  const [lastCompletedQuery, setLastCompletedQuery] = useState("");
  const [searchVersion, setSearchVersion] = useState(0);
  const [resultsOpenVersion, setResultsOpenVersion] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingResultId, setPendingResultId] = useState<string | null>(null);
  const [routeAtResultClick, setRouteAtResultClick] = useState(pathname);
  const [isResultNavigationPending, startResultNavigation] = useTransition();

  const trimmedQuery = useMemo(() => searchQuery.trim(), [searchQuery]);
  const isShowingResults = displayMode === "results";

  const loadAllSuggestions = useCallback(async (force = false) => {
    if (force) {
      suggestionsCacheRef.current = null;
    }

    const cachedSuggestions = suggestionsCacheRef.current;
    const hasFreshCachedSuggestions =
      cachedSuggestions && Date.now() - cachedSuggestions.loadedAt <= SUGGESTIONS_CACHE_TTL_MS;

    if (!force && hasFreshCachedSuggestions) {
      setSuggestions(cachedSuggestions.data);
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/search");
      const payload = (await response.json()) as SearchResponse & { error?: string };

      if (!response.ok) {
        setSuggestions([]);
        setError(payload.error ?? "Could not load suggestions.");
        return;
      }

      const nextSuggestions = payload.suggestions ?? [];
      setSuggestions(nextSuggestions);
      suggestionsCacheRef.current = {
        data: nextSuggestions,
        loadedAt: Date.now()
      };
    } catch {
      setSuggestions([]);
      setError("Could not load suggestions.");
    }
  }, []);

  const openSuggestionsDropdown = useCallback(async (force = false) => {
    const requestId = suggestionsOpenRequestRef.current + 1;
    suggestionsOpenRequestRef.current = requestId;

    await loadAllSuggestions(force);

    if (suggestionsOpenRequestRef.current !== requestId) {
      return;
    }

    if (document.activeElement === inputRef.current) {
      setIsOpen(true);
    }
  }, [loadAllSuggestions]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (isMobileOpen) {
        return;
      }
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        suggestionsOpenRequestRef.current += 1;
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.classList.add("mobileSearchOpen");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("mobileSearchOpen");
    };
  }, [isMobileOpen]);

  useEffect(() => {
    return () => {
      searchAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (trimmedQuery.length < MIN_SEARCH_CHARACTERS) {
      searchAbortControllerRef.current?.abort();

      if (trimmedQuery.length === 0) {
        searchRequestRef.current += 1;
        setResults([]);
        setLastCompletedQuery("");
        setDisplayMode("suggestions");
      } else if (trimmedQuery.length > 0) {
        searchRequestRef.current += 1;
      }
      return;
    }

    if (trimmedQuery === lastCompletedQuery) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const requestId = searchRequestRef.current + 1;
      searchRequestRef.current = requestId;
      searchAbortControllerRef.current?.abort();
      const controller = new AbortController();
      searchAbortControllerRef.current = controller;

      setError("");

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal
        });
        const payload = (await response.json()) as SearchResponse & { error?: string };

        if (requestId !== searchRequestRef.current) {
          return;
        }

        if (!response.ok) {
          setError(payload.error ?? "Could not search.");
          setSearchVersion((prev) => prev + 1);
          setDisplayMode("results");
          if (document.activeElement === inputRef.current) {
            setIsOpen(true);
          }
          return;
        }

        setResults(payload.results ?? []);
        setLastCompletedQuery(trimmedQuery);
        setSearchVersion((prev) => prev + 1);
        setDisplayMode("results");
        if (document.activeElement === inputRef.current) {
          setIsOpen(true);
        }
      } catch {
        if (controller.signal.aborted || requestId !== searchRequestRef.current) {
          return;
        }

        setError("Could not search.");
        setSearchVersion((prev) => prev + 1);
        setDisplayMode("results");
        if (document.activeElement === inputRef.current) {
          setIsOpen(true);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery, lastCompletedQuery]);

  useEffect(() => {
    if (!wasOpenRef.current && isOpen && isShowingResults) {
      setResultsOpenVersion((prev) => prev + 1);
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, isShowingResults]);

  async function runSuggestionQuery(suggestion: SearchSuggestion) {
    setQuery(suggestion.label);
    setSearchQuery(suggestion.query);
    setError("");
    setDisplayMode("suggestions");
    setIsOpen(true);
    inputRef.current?.focus();
  }

  function clearQuery() {
    searchRequestRef.current += 1;
    searchAbortControllerRef.current?.abort();
    setQuery("");
    setSearchQuery("");
    setDisplayMode("suggestions");
    setResults([]);
    setError("");
    setLastCompletedQuery("");

    openSuggestionsDropdown().catch(() => {
      setSuggestions([]);
      setError("Could not load suggestions.");
      setIsOpen(true);
    });

    inputRef.current?.focus();
  }

  const closeMobileOverlay = () => {
    setIsMobileOpen(false);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const isMobileViewport = useCallback(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches,
    []
  );

  useEffect(() => {
    if (!isOpen) {
      setPendingResultId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!pendingResultId) {
      return;
    }

    if (pathname !== routeAtResultClick) {
      setPendingResultId(null);
      setRouteAtResultClick(pathname);
      setIsOpen(false);

      if (isMobileOpen) {
        setIsMobileOpen(false);
        inputRef.current?.blur();
      }
    }
  }, [isMobileOpen, pathname, pendingResultId, routeAtResultClick]);

  const handleResultClick = (event: ReactMouseEvent<HTMLAnchorElement>, result: SearchResult) => {
    event.preventDefault();

    if (isResultNavigationPending) {
      return;
    }

    const href = getListingPath(result);
    if (href === pathname) {
      setPendingResultId(null);
      setIsOpen(false);
      if (isMobileOpen) {
        closeMobileOverlay();
      }
      return;
    }

    setPendingResultId(result.id);
    setRouteAtResultClick(pathname);

    startResultNavigation(() => {
      router.push(href);
    });
  };

  return (
    <div className={`globalSearch${isMobileOpen ? " isMobileOpen" : ""}`} ref={rootRef}>
      <div className="searchInputRow">
        {isMobileOpen ? (
          <button type="button" className="mobileSearchBack" onClick={closeMobileOverlay} aria-label="Close">
            <ArrowBackIcon aria-hidden="true" />
          </button>
        ) : null}
        <input
          ref={inputRef}
          className="globalSearchInput"
          placeholder={placeholder}
          value={query}
          onFocus={() => {
            if (isMobileViewport()) {
              setIsMobileOpen(true);
            }

            if (query.trim().length === 0) {
              setDisplayMode("suggestions");
              openSuggestionsDropdown().catch(() => {
                setSuggestions([]);
                setError("Could not load suggestions.");
                setIsOpen(true);
              });
              return;
            }

            if (displayMode === "results") {
              setIsOpen(true);
            }
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            setSearchQuery(nextValue);
            const trimmed = nextValue.trim();
            if (trimmed.length === 0) {
              searchRequestRef.current += 1;
              setResults([]);
              setError("");
              setLastCompletedQuery("");
              setDisplayMode("suggestions");
              openSuggestionsDropdown().catch(() => {
                setSuggestions([]);
                setError("Could not load suggestions.");
                setIsOpen(true);
              });
              return;
            } else if (trimmed.length < MIN_SEARCH_CHARACTERS) {
              searchRequestRef.current += 1;
              setError("");
              setIsOpen(false);
              return;
            }
            setError("");
            if (trimmed === lastCompletedQuery) {
              setDisplayMode("results");
              setIsOpen(true);
            }
          }}
        />

        {query.trim().length > 0 ? (
          <button className="globalSearchClear" type="button" onClick={clearQuery} aria-label="Clear search">
            <CloseIcon aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div
          key={isShowingResults ? `results-${searchVersion}-${resultsOpenVersion}` : "suggestions"}
          className="searchDropdown"
        >
          {error ? <p className="statusMessage">{error}</p> : null}
          {displayMode === "suggestions" ? (
            <div className="searchSection">
              <p className="searchSectionTitle">Suggestions</p>
              {suggestions.length === 0 ? (
                <p className="muted">No suggestions yet.</p>
              ) : (
                suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className="searchSuggestionBtn"
                    type="button"
                    onClick={() => runSuggestionQuery(suggestion)}
                  >
                    {suggestion.label}
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="searchSection">
              <div className="searchResultsState" aria-busy={isResultNavigationPending}>
                {results.length === 0 && lastCompletedQuery.length > 0 ? (
                  <p className="muted">No matching places.</p>
                ) : null}
                {results.map((result) => {
                  const resultDetails = getSearchResultDetails(result);

                  return (
                    <Link
                      key={result.id}
                      href={getListingPath(result)}
                      className={`searchResultLink${pendingResultId === result.id ? " isPending" : ""}`}
                      onClick={(event) => handleResultClick(event, result)}
                      aria-disabled={isResultNavigationPending}
                    >
                      <strong className="searchResultTitle">
                        {result.title}
                        {pendingResultId === result.id ? <span className="routeSpinner" aria-hidden="true" /> : null}
                      </strong>
                      <span className="muted">{result.primaryCategory.label}</span>
                      {resultDetails.openingStatus ? <span className="muted">{resultDetails.openingStatus}</span> : null}
                      {resultDetails.summary ? <span className="muted">{resultDetails.summary}</span> : null}
                      <span className="muted">
                        {result.categories
                          .map((item) => item.category.label)
                          .filter((label, index, all) => all.indexOf(label) === index)
                          .join(" · ")}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
