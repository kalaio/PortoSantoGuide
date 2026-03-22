import UserEditorClient from "@/components/admin/UserEditorClient";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";

export default async function NewUserPage() {
  const user = await requireServerUserWithRole(["ADMINISTRATOR"]);

  return <UserEditorClient mode="create" currentUserId={user.userId} />;
}
