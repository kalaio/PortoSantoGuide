"use client";

import Link from "next/link";
import { ArrowLeft, SearchMd, XClose } from "@untitledui/icons";
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
import { cn } from "@/lib/cn";
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
  const isHomeRoute = pathname === "/";
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
    if (!isMobileOpen) {
      return;
    }

    if (query.trim().length === 0) {
      setDisplayMode("suggestions");
      openSuggestionsDropdown().catch(() => {
        setSuggestions([]);
        setError("Could not load suggestions.");
        setIsOpen(true);
      });
    }
  }, [isMobileOpen, query, openSuggestionsDropdown]);

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
    <div
      className={cn(
        isMobileOpen
          ? "fixed inset-0 z-[9999] flex max-w-none flex-col gap-4 bg-white px-4 py-4"
          : cn("relative w-full", isHomeRoute ? "max-w-[50rem]" : "max-w-[35rem]")
      )}
      ref={isMobileOpen ? undefined : rootRef}
    >
      <div className={cn("flex items-center", isMobileOpen && "gap-3")}>
        {isMobileOpen ? (
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-brand-300 hover:text-brand-700 cursor-pointer"
            onClick={closeMobileOverlay}
            aria-label="Close"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}

        <div className="relative flex-1">
          <SearchMd
            className={cn(
              "pointer-events-none absolute left-4 top-1/2 z-[1] h-5 w-5 -translate-y-1/2 text-gray-500",
              isHomeRoute && !isMobileOpen && "h-6 w-6"
            )}
            aria-hidden="true"
          />

          <input
            ref={inputRef}
            className={cn(
              "w-full rounded-full border bg-white pl-12 pr-12 text-base text-gray-900 outline-none transition placeholder:text-gray-400",
              isHomeRoute && !isMobileOpen
                ? "h-[4.5rem] border-white/70 text-lg"
                : "h-14 border-white",
              !isMobileOpen && "focus:border-brand-600 focus:ring-4 focus:ring-brand-100",
              isMobileOpen && "h-12 border-brand-600 ring-4 ring-brand-50"
            )}
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
              }

              if (trimmed.length < MIN_SEARCH_CHARACTERS) {
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
            <button
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
              type="button"
              onClick={clearQuery}
              aria-label="Clear search"
            >
              <XClose className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen ? (
        <div
          key={isShowingResults ? `results-${searchVersion}-${resultsOpenVersion}` : "suggestions"}
          className={cn(
            "overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-[0_24px_60px_rgba(10,13,18,0.08)]",
            isMobileOpen ? "min-h-0" : "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50"
          )}
        >
          <div className="max-h-[min(70vh,34rem)] overflow-y-auto px-3 py-3">
            {error ? <p className="px-2 py-2 text-sm text-error-600">{error}</p> : null}

            {displayMode === "suggestions" ? (
              <div className="grid gap-1">
                <p className="px-2 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-700">Suggestions</p>
                {suggestions.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-gray-500">No suggestions yet.</p>
                ) : (
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      className="rounded-2xl px-4 py-3 text-left text-lg text-gray-900 transition hover:bg-gray-100 cursor-pointer"
                      type="button"
                      onClick={() => runSuggestionQuery(suggestion)}
                    >
                      {suggestion.label}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="grid gap-1" aria-busy={isResultNavigationPending}>
                {results.length === 0 && lastCompletedQuery.length > 0 ? (
                  <p className="px-2 py-2 text-sm text-gray-500">No matching places.</p>
                ) : null}

                {results.map((result, index) => {
                  const resultDetails = getSearchResultDetails(result);

                  return (
                    <Link
                      key={result.id}
                      href={getListingPath(result)}
                      className={cn(
                        "grid gap-1 rounded-3xl border border-transparent px-4 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50",
                        pendingResultId === result.id && "pointer-events-none opacity-75"
                      )}
                      onClick={(event) => handleResultClick(event, result)}
                      aria-disabled={isResultNavigationPending}
                    >
                      <strong className="inline-flex items-center gap-2 text-xl font-semibold text-gray-950">
                        {result.title}
                        {pendingResultId === result.id ? <span className="routeSpinner" aria-hidden="true" /> : null}
                      </strong>
                      <span className="text-base text-gray-500">{result.primaryCategory.label}</span>
                      {resultDetails.openingStatus ? (
                        <span className="text-base text-gray-500">{resultDetails.openingStatus}</span>
                      ) : null}
                      {resultDetails.summary ? (
                        <span className="text-base leading-7 text-gray-500">{resultDetails.summary}</span>
                      ) : null}
                      <span className="text-base text-gray-500">
                        {result.categories
                          .map((item) => item.category.label)
                          .filter((label, indexValue, all) => all.indexOf(label) === indexValue)
                          .join(" · ")}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
