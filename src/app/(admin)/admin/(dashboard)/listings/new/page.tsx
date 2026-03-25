import NewListingClient from "@/app/(admin)/components/NewListingClient";
import { getActiveAdminCategoryOptions } from "@/app/(admin)/lib/admin-categories";
import { requireServerAdminUser } from "@/app/(admin)/lib/admin-auth-server";

export default async function NewListingPage() {
  const user = await requireServerAdminUser();
  const initialCategories = await getActiveAdminCategoryOptions(user);

  return <NewListingClient initialCategories={initialCategories} />;
}
