import { Select, SelectItem } from "@heroui/react";
import {
  Children,
  Fragment,
  forwardRef,
  isValidElement,
  type ChangeEvent,
  type OptionHTMLAttributes,
  type ReactNode
} from "react";
import {
  ADMIN_NATIVE_HIDDEN_CLASS,
  ADMIN_SELECT_CLASS,
  ADMIN_SELECT_TRIGGER_CLASS,
  ADMIN_SELECT_VALUE_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";

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
    const text: string = label
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

function getSelectedItemLabel(items: Array<{ rendered?: ReactNode; textValue?: string }>) {
  return items
    .map((item) => {
      if (typeof item.rendered === "string") {
        return item.rendered;
      }

      return item.textValue ?? "";
    })
    .filter(Boolean)
    .join(", ");
}

function getSelectedOptionLabel(options: SelectOption[], selectedValue: string) {
  const selectedOption = options.find((option) => option.value === selectedValue);

  if (!selectedOption) {
    return undefined;
  }

  return getOptionLabel(selectedOption.label);
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

const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
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
  const classNames = joinAdminClassNames("uiSelect", ADMIN_SELECT_CLASS, className ?? "");
  const options = extractOptions(children);
  const selectedValue = String(value ?? defaultValue ?? "");
  const selectedKeys = selectedValue ? new Set([selectedValue]) : new Set<string>();
  const emptyOption = options.find((option) => option.value === "");
  const selectedOptionLabel = getSelectedOptionLabel(options, selectedValue);

  function emitChange(nextValue: string) {
    const syntheticEvent = {
      target: { value: nextValue, name, id },
      currentTarget: { value: nextValue, name, id }
    } as ChangeEvent<HTMLSelectElement>;

    onChange?.(syntheticEvent);
  }

  function handleSelectionChange(keys: unknown) {
    const nextValue = keys instanceof Set ? String(keys.values().next().value ?? "") : "";

    emitChange(nextValue);
  }

  return (
    <>
      <select
        ref={ref}
        className={joinAdminClassNames("uiNativeSelect", ADMIN_NATIVE_HIDDEN_CLASS)}
        id={id}
        name={name}
        value={selectedValue}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={() => undefined}
      >
        {children}
      </select>
      <Select
        aria-describedby={ariaDescribedBy}
        aria-labelledby={ariaLabelledBy}
        className={classNames}
        classNames={{
          trigger: joinAdminClassNames("uiSelectTrigger", ADMIN_SELECT_TRIGGER_CLASS),
          value: joinAdminClassNames("uiSelectValue", ADMIN_SELECT_VALUE_CLASS)
        }}
        selectedKeys={selectedKeys}
        variant="bordered"
        size="lg"
        radius="lg"
        isDisabled={disabled}
        isInvalid={isInvalid}
        isRequired={required}
        disallowEmptySelection={required}
        description={description}
        errorMessage={errorMessage}
        placeholder={getOptionLabel(emptyOption?.label)}
        renderValue={(items) => selectedOptionLabel || getSelectedItemLabel(items) || (getOptionLabel(emptyOption?.label) ?? "")}
        onBlur={onBlur}
        onSelectionChange={handleSelectionChange}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            isDisabled={option.disabled}
            textValue={getOptionLabel(option.label) ?? option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </Select>
    </>
  );
});

export default SelectInput;
