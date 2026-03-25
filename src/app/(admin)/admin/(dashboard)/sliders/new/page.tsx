import CreateSliderClient from "@/components/admin/CreateSliderClient";
import { ADMIN_HEADER_ROW_CLASS, ADMIN_HERO_CLASS, ADMIN_PAGE_CLASS, ADMIN_TITLE_CLASS } from "@/components/admin/admin-tailwind";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";

export default async function AdminNewSliderPage() {
  await requireServerUserWithRole(["ADMINISTRATOR"]);

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>Create Slider</h1>
        </div>
        <p>Create a slider, then manage its media from the sliders workspace.</p>
      </section>

      <CreateSliderClient />
    </main>
  );
}
