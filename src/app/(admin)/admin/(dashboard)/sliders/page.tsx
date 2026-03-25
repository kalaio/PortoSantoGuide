import { Button } from "@/components/base/buttons/button";
import SlidersAdminClient from "@/app/(admin)/components/SlidersAdminClient";
import {
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_TITLE_CLASS
} from "@/app/(admin)/components/admin-tailwind";
import { requireServerUserWithRole } from "@/app/(admin)/lib/admin-auth-server";
import { prisma } from "@/lib/prisma";

export default async function AdminSlidersPage() {
  await requireServerUserWithRole(["ADMINISTRATOR"]);

  const sliders = await prisma.slider.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      createdAt: true
    }
  });

  const serializedSliders = sliders.map((slider) => ({
    ...slider,
    createdAt: slider.createdAt.toISOString()
  }));

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>Sliders</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <Button size="md" href="/admin/sliders/new">
              New Slider
            </Button>
          </div>
        </div>
        <p>Rename, activate, and manage sliders for different page sections.</p>
      </section>

      <SlidersAdminClient initialSliders={serializedSliders} />
    </main>
  );
}
