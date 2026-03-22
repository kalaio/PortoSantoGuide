import { Input } from "@heroui/react";
import { forwardRef, type ChangeEvent, type ComponentPropsWithoutRef, type FocusEvent, type ReactNode } from "react";
import { ADMIN_INPUT_CLASS, ADMIN_INPUT_WRAPPER_CLASS, joinAdminClassNames } from "@/components/admin/admin-tailwind";

type TextInputProps = {
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
  className?: string;
  defaultValue?: string | number | readonly string[];
  disabled?: boolean;
  errorMessage?: ReactNode;
  id?: string;
  isInvalid?: boolean;
  max?: number | string;
  min?: number | string;
  minLength?: number;
  name?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  step?: number | string;
  type?: string;
  value?: string | number | readonly string[];
};

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, defaultValue, disabled, errorMessage, isInvalid, readOnly, required, value, ...props },
  ref
) {
  const classNames = joinAdminClassNames("uiInput", ADMIN_INPUT_CLASS, className ?? "");

  return (
    <Input
      ref={ref}
      className={classNames}
      classNames={{
        inputWrapper: ADMIN_INPUT_WRAPPER_CLASS
      }}
      variant="bordered"
      size="lg"
      radius="lg"
      isDisabled={disabled}
      isInvalid={isInvalid}
      isReadOnly={readOnly}
      isRequired={required}
      errorMessage={errorMessage}
      defaultValue={defaultValue === undefined ? undefined : String(defaultValue)}
      value={value === undefined ? undefined : String(value)}
      {...(props as ComponentPropsWithoutRef<typeof Input>)}
    />
  );
});

export default TextInput;
