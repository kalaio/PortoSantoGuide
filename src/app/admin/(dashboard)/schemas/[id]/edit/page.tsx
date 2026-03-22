import { notFound } from "next/navigation";
import SchemaEditorClient from "@/components/admin/SchemaEditorClient";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";
import { getAdminSchemas } from "@/lib/admin-schemas";

type EditSchemaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSchemaPage({ params }: EditSchemaPageProps) {
  const user = await requireServerUserWithRole(["ADMINISTRATOR"]);
  const { id } = await params;
  const schemas = await getAdminSchemas(user);
  const schema = schemas.find((item) => item.id === id) ?? null;

  if (!schema) {
    notFound();
  }

  return <SchemaEditorClient mode="edit" initialSchema={schema} />;
}
