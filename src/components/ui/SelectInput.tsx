import {
  Children,
  Fragment,
  forwardRef,
  isValidElement,
  type ChangeEvent,
  type OptionHTMLAttributes,
  type ReactNode
} from "react";
import { Select } from "@/components/base/select/select";
import {
  ADMIN_SELECT_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";
import { HintText } from "@/components/base/input/hint-text";
import { cx } from "@/utils/cx";

type SelectInputProps = {
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
  children?: ReactNode;
  className?: string;
  defaultValue?: string | number;
  description?: ReactNode;
  disabled?: boolean;
  errorMessage?: ReactNode;
  id?: string;
  isInvalid?: boolean;
  name?: string;
  onBlur?: () => void;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  value?: string | number;
};

type SelectOption = {
  label: ReactNode;
  value: string;
  disabled?: boolean;
};

function getOptionLabel(label: ReactNode): string | undefined {
  if (typeof label === "string" || typeof label === "number") {
    return String(label);
  }

  if (Array.isArray(label)) {
    const text = label
      .map((item) => getOptionLabel(item))
      .filter(Boolean)
      .join("");

    return text || undefined;
  }

  if (isValidElement(label)) {
    return getOptionLabel((label.props as { children?: ReactNode }).children);
  }

  return undefined;
}

function extractOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    if (child.type === Fragment) {
      options.push(...extractOptions((child.props as { children?: ReactNode }).children));
      return;
    }

    if (child.type !== "option") {
      return;
    }

    const props = child.props as OptionHTMLAttributes<HTMLOptionElement> & { children?: ReactNode };
    options.push({
      label: props.children ?? "",
      value: String(props.value ?? ""),
      disabled: props.disabled
    });
  });

  return options;
}

const SelectInput = forwardRef<HTMLDivElement, SelectInputProps>(function SelectInput(
  {
    "aria-describedby": ariaDescribedBy,
    "aria-labelledby": ariaLabelledBy,
    children,
    className,
    defaultValue,
    description,
    disabled,
    errorMessage,
    id,
    isInvalid,
    name,
    onBlur,
    onChange,
    required,
    value
  },
  ref
) {
  const classNames = joinAdminClassNames(ADMIN_SELECT_CLASS, className ?? "");
  const options = extractOptions(children);
  const selectedValue = String(value ?? defaultValue ?? "");
  const emptyOption = options.find((option) => option.value === "");

  return (
    <div className={classNames}>
      <Select
        ref={ref}
        id={id}
        name={name}
        size="md"
        items={options.map((option) => ({
          id: option.value,
          label: getOptionLabel(option.label) ?? option.value,
          isDisabled: option.disabled
        }))}
        selectedKey={selectedValue || null}
        defaultSelectedKey={defaultValue === undefined ? undefined : String(defaultValue)}
        placeholder={getOptionLabel(emptyOption?.label) ?? "Select"}
        isDisabled={disabled}
        isInvalid={isInvalid}
        isRequired={required}
        onBlur={onBlur}
        onSelectionChange={(key) => {
          const nextValue = key === null ? "" : String(key);
          const syntheticEvent = {
            target: { value: nextValue, name, id },
            currentTarget: { value: nextValue, name, id }
          } as ChangeEvent<HTMLSelectElement>;

          onChange?.(syntheticEvent);
        }}
        className={cx("w-full")}
        aria-describedby={ariaDescribedBy}
        aria-labelledby={ariaLabelledBy}
      >
        {(item) => <Select.Item id={item.id} label={item.label} isDisabled={item.isDisabled} />}
      </Select>
      {description ? <HintText className="mt-2 text-[0.8rem]">{description}</HintText> : null}
      {errorMessage ? (
        <HintText isInvalid className="mt-2 text-[0.84rem]">
          {errorMessage}
        </HintText>
      ) : null}
    </div>
  );
});

export default SelectInput;
