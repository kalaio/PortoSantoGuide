import CategoryEditorClient from "@/components/admin/CategoryEditorClient";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";
import { getAdminSchemas } from "@/lib/admin-schemas";
import { getAdminSections } from "@/lib/admin-sections";

export default async function NewCategoryPage() {
  const user = await requireServerUserWithRole(["ADMINISTRATOR"]);
  const [sections, schemas] = await Promise.all([getAdminSections(user), getAdminSchemas(user)]);

  return <CategoryEditorClient mode="create" initialSections={sections} initialSchemas={schemas} />;
}
