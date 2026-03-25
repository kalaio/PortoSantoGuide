import { notFound } from "next/navigation";
import EditListingClient from "@/app/(admin)/components/EditListingClient";
import { getAdminCategoryOptions } from "@/app/(admin)/lib/admin-categories";
import { requireServerAdminUser } from "@/app/(admin)/lib/admin-auth-server";
import { getAdminListingById } from "@/app/(admin)/lib/admin-listings";

type EditListingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  const user = await requireServerAdminUser();
  const { id } = await params;
  const [initialCategories, listing] = await Promise.all([
    getAdminCategoryOptions(user),
    getAdminListingById(user, id)
  ]);

  if (!listing) {
    notFound();
  }

  return <EditListingClient initialCategories={initialCategories} listing={listing} />;
}
