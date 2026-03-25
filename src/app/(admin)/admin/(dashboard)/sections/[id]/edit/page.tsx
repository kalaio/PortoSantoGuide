import { notFound } from "next/navigation";
import SectionEditorClient from "@/app/(admin)/components/SectionEditorClient";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";
import { getAdminSections } from "@/lib/admin-sections";

type EditSectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSectionPage({ params }: EditSectionPageProps) {
  const user = await requireServerUserWithRole(["ADMINISTRATOR"]);
  const { id } = await params;
  const sections = await getAdminSections(user);
  const section = sections.find((item) => item.id === id) ?? null;

  if (!section) {
    notFound();
  }

  return <SectionEditorClient mode="edit" initialSection={section} />;
}
