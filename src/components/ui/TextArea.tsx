import { Textarea } from "@heroui/react";
import { forwardRef, type ChangeEvent, type ComponentPropsWithoutRef, type FocusEvent, type ReactNode } from "react";
import {
  ADMIN_INPUT_CLASS,
  ADMIN_TEXTAREA_INPUT_WRAPPER_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";

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
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  rows?: number;
  value?: string | number | readonly string[];
};

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, defaultValue, disabled, errorMessage, isInvalid, readOnly, required, value, ...props },
  ref
) {
  const classNames = joinAdminClassNames("uiTextarea", ADMIN_INPUT_CLASS, className ?? "");

  return (
    <Textarea
      ref={ref}
      className={classNames}
      classNames={{
        inputWrapper: ADMIN_TEXTAREA_INPUT_WRAPPER_CLASS
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
      {...(props as ComponentPropsWithoutRef<typeof Textarea>)}
    />
  );
});

export default TextArea;
