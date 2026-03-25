import SectionEditorClient from "@/app/(admin)/components/SectionEditorClient";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";

export default async function NewSectionPage() {
  await requireServerUserWithRole(["ADMINISTRATOR"]);

  return <SectionEditorClient mode="create" />;
}
