import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { cx } from "@/utils/cx";

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
    <div className={cx("grid gap-2", fullWidth && "col-span-full", className)}>
      <div className="grid gap-1">
        <Label id={labelId} isRequired={isRequired} className="text-sm font-medium text-secondary">
          {label}
        </Label>
        {hint ? (
          <HintText id={hintId} className="text-sm text-tertiary">
            {hint}
          </HintText>
        ) : null}
      </div>
      {content}
    </div>
  );
}
