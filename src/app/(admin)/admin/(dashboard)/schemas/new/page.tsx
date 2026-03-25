import SchemaEditorClient from "@/app/(admin)/components/SchemaEditorClient";
import { requireServerUserWithRole } from "@/app/(admin)/lib/admin-auth-server";

export default async function NewSchemaPage() {
  await requireServerUserWithRole(["ADMINISTRATOR"]);

  return <SchemaEditorClient mode="create" />;
}
