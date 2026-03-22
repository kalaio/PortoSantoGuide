import { Checkbox } from "@heroui/react";
import type { ReactNode } from "react";
import {
  ADMIN_CHECKBOX_FIELD_CLASS,
  ADMIN_CHECKBOX_LABEL_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";

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
  const baseClassName = joinAdminClassNames("uiCheckboxField", ADMIN_CHECKBOX_FIELD_CLASS, className ?? "");

  return (
    <Checkbox
      classNames={{
        base: baseClassName,
        label: joinAdminClassNames("uiCheckboxFieldLabel", ADMIN_CHECKBOX_LABEL_CLASS)
      }}
      isSelected={checked}
      isDisabled={disabled}
      onValueChange={onChange}
    >
      {label}
    </Checkbox>
  );
}
