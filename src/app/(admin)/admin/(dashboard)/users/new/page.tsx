import UserEditorClient from "@/app/(admin)/components/UserEditorClient";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";

export default async function NewUserPage() {
  const user = await requireServerUserWithRole(["ADMINISTRATOR"]);

  return <UserEditorClient mode="create" currentUserId={user.userId} />;
}
