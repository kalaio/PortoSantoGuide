import NewListingClient from "@/components/admin/NewListingClient";
import { getActiveAdminCategoryOptions } from "@/lib/admin-categories";
import { requireServerAdminUser } from "@/lib/admin-auth-server";

export default async function NewListingPage() {
  const user = await requireServerAdminUser();
  const initialCategories = await getActiveAdminCategoryOptions(user);

  return <NewListingClient initialCategories={initialCategories} />;
}
