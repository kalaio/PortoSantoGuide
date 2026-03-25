import {
  ADMIN_CARD_DESCRIPTION_CLASS,
  ADMIN_CARD_HEADER_CLASS,
  ADMIN_CARD_SURFACE_CLASS,
  ADMIN_CARD_TITLE_CLASS,
  ADMIN_CARD_WRAPPER_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_MENU_CARD_DESCRIPTION_CLASS,
  ADMIN_MENU_GRID_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_SCOPE_BADGE_CLASS,
  ADMIN_TITLE_CLASS
} from "@/app/(admin)/components/admin-tailwind";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";
import { LISTING_FIELDS } from "@/lib/listing-fields";

export default async function AdminFieldsPage() {
  await requireServerUserWithRole(["ADMINISTRATOR"]);

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <h1 className={ADMIN_TITLE_CLASS}>Fields</h1>
        <p>Code-defined field catalogue used by schemas.</p>
      </section>

      <section className={ADMIN_MENU_GRID_CLASS}>
        {LISTING_FIELDS.map((field) => (
          <article key={field.key} className={ADMIN_CARD_WRAPPER_CLASS}>
            <div className={ADMIN_CARD_SURFACE_CLASS}>
              <div className={`${ADMIN_CARD_HEADER_CLASS} grid gap-2.5 px-5 pb-[18px] pt-5`}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className={`${ADMIN_CARD_TITLE_CLASS} leading-[1.2]`}>{field.label}</div>
                  <span className={ADMIN_SCOPE_BADGE_CLASS}>{field.component}</span>
                </div>
                <p className={`${ADMIN_CARD_DESCRIPTION_CLASS} ${ADMIN_MENU_CARD_DESCRIPTION_CLASS}`}>{field.description}</p>
                <p className="muted">Key: {field.key}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
