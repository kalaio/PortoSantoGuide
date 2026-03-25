import { notFound } from "next/navigation";
import CategoryEditorClient from "@/app/(admin)/components/CategoryEditorClient";
import { getAdminCategoryOptions } from "@/app/(admin)/lib/admin-categories";
import { requireServerUserWithRole } from "@/app/(admin)/lib/admin-auth-server";
import { getAdminSchemas } from "@/app/(admin)/lib/admin-schemas";
import { getAdminSections } from "@/app/(admin)/lib/admin-sections";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const user = await requireServerUserWithRole(["ADMINISTRATOR"]);

  const { id } = await params;
  const [categories, sections, schemas] = await Promise.all([
    getAdminCategoryOptions(user),
    getAdminSections(user),
    getAdminSchemas(user)
  ]);
  const category = categories.find((item) => item.id === id) ?? null;

  if (!category) {
    notFound();
  }

  return (
    <CategoryEditorClient
      mode="edit"
      initialCategory={category}
      initialSections={sections}
      initialSchemas={schemas}
    />
  );
}
