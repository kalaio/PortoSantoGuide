import { Divider } from "@heroui/react";
import type { ReactNode } from "react";
import {
  ADMIN_FORM_SECTION_BODY_CLASS,
  ADMIN_FORM_SECTION_CLASS,
  ADMIN_FORM_SECTION_DESCRIPTION_CLASS,
  ADMIN_FORM_SECTION_DIVIDER_CLASS,
  ADMIN_FORM_SECTION_HEADER_CLASS,
  ADMIN_FORM_SECTION_TITLE_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";

type FormSectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function FormSection({
  title,
  description,
  actions,
  className,
  children
}: FormSectionProps) {
  const classNames = joinAdminClassNames("uiFormSection", ADMIN_FORM_SECTION_CLASS, className ?? "");

  return (
    <section className={classNames}>
      <header className={joinAdminClassNames("uiFormSectionHeader", ADMIN_FORM_SECTION_HEADER_CLASS)}>
        <div>
          <h2 className={joinAdminClassNames("uiFormSectionTitle", ADMIN_FORM_SECTION_TITLE_CLASS)}>{title}</h2>
          {description ? <p className={joinAdminClassNames("uiFormSectionDescription", ADMIN_FORM_SECTION_DESCRIPTION_CLASS)}>{description}</p> : null}
        </div>
        {actions ? <div className="uiFormSectionActions">{actions}</div> : null}
      </header>
      <Divider className={joinAdminClassNames("uiFormSectionDivider", ADMIN_FORM_SECTION_DIVIDER_CLASS)} />
      <div className={joinAdminClassNames("uiFormSectionBody", ADMIN_FORM_SECTION_BODY_CLASS)}>{children}</div>
    </section>
  );
}
