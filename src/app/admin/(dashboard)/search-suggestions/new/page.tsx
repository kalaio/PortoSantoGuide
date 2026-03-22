import SearchSuggestionEditorClient from "@/components/admin/SearchSuggestionEditorClient";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";

export default async function NewSearchSuggestionPage() {
  await requireServerUserWithRole(["ADMINISTRATOR"]);

  return <SearchSuggestionEditorClient mode="create" />;
}
