import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import {
  ADMIN_FIELD_CLASS,
  ADMIN_FIELD_FULL_CLASS,
  ADMIN_FIELD_HINT_CLASS,
  ADMIN_FIELD_LABEL_CLASS,
  ADMIN_FIELD_LABEL_ROW_CLASS,
  ADMIN_FIELD_REQUIRED_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";

function joinIds(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ") || undefined;
}

type FieldProps = {
  label: string;
  hint?: string;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

export default function Field({ label, hint, required, fullWidth = false, className, children }: FieldProps) {
  const fieldId = useId();
  const labelId = `${fieldId}-label`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const classNames = joinAdminClassNames("uiField", ADMIN_FIELD_CLASS, fullWidth && ADMIN_FIELD_FULL_CLASS, className ?? "");
  const childProps = isValidElement(children)
    ? (children.props as {
        "aria-labelledby"?: string;
        "aria-describedby"?: string;
        required?: boolean;
        isRequired?: boolean;
      })
    : undefined;
  const isRequired = required ?? childProps?.required ?? childProps?.isRequired ?? false;

  const content = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-labelledby": joinIds(childProps?.["aria-labelledby"], labelId),
        "aria-describedby": joinIds(childProps?.["aria-describedby"], hintId)
      })
    : children;

  return (
    <div className={classNames}>
      <span className={joinAdminClassNames("uiLabelRow", ADMIN_FIELD_LABEL_ROW_CLASS)}>
        <span id={labelId} className={joinAdminClassNames("uiLabel", ADMIN_FIELD_LABEL_CLASS)}>
          {label}
          {isRequired ? (
            <span className={joinAdminClassNames("uiRequiredMarker", ADMIN_FIELD_REQUIRED_CLASS)} aria-hidden="true">
              {" "}*
            </span>
          ) : null}
        </span>
        {hint ? (
          <span id={hintId} className={joinAdminClassNames("uiHint", ADMIN_FIELD_HINT_CLASS)}>
            {hint}
          </span>
        ) : null}
      </span>
      {content}
    </div>
  );
}
