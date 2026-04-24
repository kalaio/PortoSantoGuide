CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.immutable_unaccent(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT public.unaccent(value)
$$;

CREATE INDEX IF NOT EXISTS "ListingRevision_title_trgm_idx"
  ON "ListingRevision"
  USING GIN (public.immutable_unaccent(lower("title")) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ListingRevision_slug_trgm_idx"
  ON "ListingRevision"
  USING GIN (public.immutable_unaccent(lower("slug")) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ListingRevision_description_trgm_idx"
  ON "ListingRevision"
  USING GIN (public.immutable_unaccent(lower(COALESCE("description", ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ListingCategory_label_trgm_idx"
  ON "ListingCategory"
  USING GIN (public.immutable_unaccent(lower("label")) gin_trgm_ops);
