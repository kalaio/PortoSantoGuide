"use client";

import { Card as HeroCard, CardBody, CardHeader } from "@heroui/react";
import type { HTMLAttributes, ReactNode } from "react";
import {
  ADMIN_CARD_BODY_CLASS,
  ADMIN_CARD_DESCRIPTION_CLASS,
  ADMIN_CARD_HEADER_CLASS,
  ADMIN_CARD_HEADING_CLASS,
  ADMIN_CARD_SURFACE_CLASS,
  ADMIN_CARD_TITLE_CLASS,
  ADMIN_CARD_WRAPPER_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";

type CardElement = "section" | "article" | "div";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: CardElement;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export default function Card({
  as = "section",
  title,
  description,
  actions,
  className,
  children,
  ...props
}: CardProps) {
  const Element = as;
  const classNames = joinAdminClassNames("uiCard", ADMIN_CARD_WRAPPER_CLASS, className ?? "");

  return (
    <Element className={classNames} {...props}>
      <HeroCard className={joinAdminClassNames("uiCardSurface", ADMIN_CARD_SURFACE_CLASS)} shadow="none">
        {title || description || actions ? (
          <CardHeader className={joinAdminClassNames("uiCardHeader", ADMIN_CARD_HEADER_CLASS)}>
            <div className={joinAdminClassNames("uiCardHeading", ADMIN_CARD_HEADING_CLASS)}>
              {title ? <div className={joinAdminClassNames("uiCardTitle", ADMIN_CARD_TITLE_CLASS)}>{title}</div> : null}
              {description ? <p className={joinAdminClassNames("uiCardDescription", ADMIN_CARD_DESCRIPTION_CLASS)}>{description}</p> : null}
            </div>
            {actions ? <div className="uiCardActions">{actions}</div> : null}
          </CardHeader>
        ) : null}
        <CardBody className={joinAdminClassNames("uiCardBody", ADMIN_CARD_BODY_CLASS)}>{children}</CardBody>
      </HeroCard>
    </Element>
  );
}
