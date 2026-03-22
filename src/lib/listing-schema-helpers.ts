import type { ListingSchemaFieldSummary } from "@/types/listing";

type SchemaCarrier = {
  schema?: {
    fields?: ListingSchemaFieldSummary[];
  } | null;
  fields?: ListingSchemaFieldSummary[];
};

export function getCategorySchemaFields(category: SchemaCarrier | null | undefined): ListingSchemaFieldSummary[] {
  return category?.schema?.fields ?? category?.fields ?? [];
}
