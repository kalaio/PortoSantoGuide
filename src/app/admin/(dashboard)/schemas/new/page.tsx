import SchemaEditorClient from "@/components/admin/SchemaEditorClient";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";

export default async function NewSchemaPage() {
  await requireServerUserWithRole(["ADMINISTRATOR"]);

  return <SchemaEditorClient mode="create" />;
}
