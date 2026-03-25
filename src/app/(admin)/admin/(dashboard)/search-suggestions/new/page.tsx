import SearchSuggestionEditorClient from "@/app/(admin)/components/SearchSuggestionEditorClient";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";

export default async function NewSearchSuggestionPage() {
  await requireServerUserWithRole(["ADMINISTRATOR"]);

  return <SearchSuggestionEditorClient mode="create" />;
}
