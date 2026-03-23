import type { ComponentType, FocusEvent, HTMLAttributes, ReactNode } from "react";
import { HintText } from "@/components/base/input/hint-text";
import { InputBase } from "@/components/base/input/input";
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

type TextInputProps = {
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
  className?: string;
  defaultValue?: string | number | readonly string[];
  disabled?: boolean;
  errorMessage?: ReactNode;
  id?: string;
  icon?: ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
  isInvalid?: boolean;
  max?: number | string;
  min?: number | string;
  minLength?: number;
  name?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  size?: "sm" | "md";
  step?: number | string;
  type?: string;
  value?: string | number | readonly string[];
};

export default function TextInput({
  className,
  defaultValue,
  disabled,
  errorMessage,
  icon,
  isInvalid,
  onChange,
  readOnly,
  required,
  size = "md",
  value,
  ...props
}: TextInputProps) {
  const input = (
    <InputBase
      {...(props as Record<string, unknown>)}
      size={size}
      wrapperClassName={cx("w-full", className)}
      icon={icon}
      defaultValue={defaultValue === undefined ? undefined : String(defaultValue)}
      value={value === undefined ? undefined : String(value)}
      isDisabled={disabled}
      isInvalid={isInvalid}
      isReadOnly={readOnly}
      isRequired={required}
      onChange={(payload) => onChange?.(getNextValue(payload))}
    />
  );

  if (!errorMessage) {
    return input;
  }

  return (
    <div className="grid gap-2">
      {input}
      <HintText isInvalid className="text-[0.84rem]">
        {errorMessage}
      </HintText>
    </div>
  );
}
