import Link from "next/link";
import {
  ADMIN_ACTIONS_CLASS,
  ADMIN_CARD_BODY_CLASS,
  ADMIN_CARD_DESCRIPTION_CLASS,
  ADMIN_CARD_HEADER_CLASS,
  ADMIN_CARD_HEADING_CLASS,
  ADMIN_CARD_SURFACE_CLASS,
  ADMIN_CARD_TITLE_CLASS,
  ADMIN_CARD_WRAPPER_CLASS,
  ADMIN_LOGIN_CARD_CLASS,
  ADMIN_LOGIN_PAGE_CLASS,
  ADMIN_PAGE_CLASS
} from "@/components/admin/admin-tailwind";
import { buttonClassName } from "@/components/ui/button-styles";

export default function AdminForbiddenPage() {
  return (
    <main className={`${ADMIN_PAGE_CLASS} ${ADMIN_LOGIN_PAGE_CLASS}`}>
      <section className={`${ADMIN_CARD_WRAPPER_CLASS} ${ADMIN_LOGIN_CARD_CLASS}`}>
        <div className={ADMIN_CARD_SURFACE_CLASS}>
          <div className={ADMIN_CARD_HEADER_CLASS}>
            <div className={ADMIN_CARD_HEADING_CLASS}>
              <div className={ADMIN_CARD_TITLE_CLASS}>Access denied</div>
              <p className={ADMIN_CARD_DESCRIPTION_CLASS}>Your account role does not have permission to access admin tools.</p>
            </div>
          </div>
          <div className={ADMIN_CARD_BODY_CLASS}>
            <div className={ADMIN_ACTIONS_CLASS}>
              <Link className={buttonClassName({ variant: "secondary" })} href="/">
                Go to home
              </Link>
              <Link className={buttonClassName({})} href="/admin/login">
                Switch account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
