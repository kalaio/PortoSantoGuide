import type { ReactNode } from "react";
import { Checkbox } from "@/components/base/checkbox/checkbox";

type CheckboxFieldProps = {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export default function CheckboxField({
  label,
  checked,
  onChange,
  disabled = false,
  className
}: CheckboxFieldProps) {
  return (
    <Checkbox
      className={className}
      label={label}
      isSelected={checked}
      isDisabled={disabled}
      onChange={onChange}
      size="md"
    />
  );
}
