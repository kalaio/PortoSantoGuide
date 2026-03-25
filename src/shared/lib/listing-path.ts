type ListingPathInput = {
  slug: string;
  primaryCategory: {
    slug: string;
  };
};

export function getListingPath(input: ListingPathInput) {
  return `/${encodeURIComponent(input.primaryCategory.slug)}/${encodeURIComponent(input.slug)}`;
}
