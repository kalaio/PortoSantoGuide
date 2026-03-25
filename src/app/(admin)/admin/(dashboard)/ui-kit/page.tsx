import AdminUiKitPreview from "@/app/(admin)/components/AdminUiKitPreview";
import { ADMIN_HERO_CLASS, ADMIN_PAGE_CLASS, ADMIN_TITLE_CLASS } from "@/app/(admin)/components/admin-tailwind";
import { requireServerUserWithRole } from "@/app/(admin)/lib/admin-auth-server";

export default async function AdminUiKitPage() {
  await requireServerUserWithRole(["ADMINISTRATOR"]);

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <h1 className={ADMIN_TITLE_CLASS}>Admin UI Kit</h1>
        <p>Reference page for the HeroUI-based admin controls and states.</p>
      </section>
      <AdminUiKitPreview />
    </main>
  );
}
