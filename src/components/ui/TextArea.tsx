import type { FocusEvent, ReactNode } from "react";
import { HintText } from "@/components/base/input/hint-text";
import { TextAreaBase } from "@/components/base/textarea/textarea";
import { cx } from "@/utils/cx";

function getNextValue(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "target" in payload &&
    payload.target &&
    typeof payload.target === "object" &&
    "value" in payload.target
  ) {
    const target = payload.target as { value?: unknown };
    return typeof target.value === "string" ? target.value : String(target.value ?? "");
  }

  return String(payload ?? "");
}

type TextAreaProps = {
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
  className?: string;
  defaultValue?: string | number | readonly string[];
  disabled?: boolean;
  errorMessage?: ReactNode;
  id?: string;
  isInvalid?: boolean;
  minLength?: number;
  name?: string;
  onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  rows?: number;
  value?: string | number | readonly string[];
};

export default function TextArea({
  className,
  defaultValue,
  disabled,
  errorMessage,
  isInvalid,
  onChange,
  readOnly,
  required,
  value,
  ...props
}: TextAreaProps) {
  const textArea = (
    <TextAreaBase
      {...(props as Record<string, unknown>)}
      className={cx("w-full", isInvalid && "ring-error", className)}
      defaultValue={defaultValue === undefined ? undefined : String(defaultValue)}
      value={value === undefined ? undefined : String(value)}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      onChange={(payload) => onChange?.(getNextValue(payload))}
    />
  );

  if (!errorMessage) {
    return textArea;
  }

  return (
    <div className="grid gap-2">
      {textArea}
      <HintText isInvalid className="text-[0.84rem]">
        {errorMessage}
      </HintText>
    </div>
  );
}
