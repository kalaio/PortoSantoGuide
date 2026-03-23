import { parseTime } from "@internationalized/date";
import type { TimeValue } from "react-aria-components";
import { DateInput, DateSegment, TimeField } from "react-aria-components";
import { cx } from "@/utils/cx";

type TimeInputProps = {
  "aria-describedby"?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  isInvalid?: boolean;
  name?: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  required?: boolean;
  value?: string;
};

function formatTimeValue(value: TimeValue | null) {
  if (!value) {
    return "";
  }

  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
}

function parseTimeValue(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return parseTime(value);
  } catch {
    return null;
  }
}

export default function TimeInput({
  className,
  disabled,
  isInvalid,
  onBlur,
  onChange,
  readOnly,
  required,
  value,
  ...props
}: TimeInputProps) {
  return (
    <TimeField
      {...props}
      granularity="minute"
      hourCycle={24}
      shouldForceLeadingZeros
      value={parseTimeValue(value)}
      isDisabled={disabled}
      isInvalid={isInvalid}
      isReadOnly={readOnly}
      isRequired={required}
      onBlur={onBlur}
      onChange={(nextValue) => onChange?.(formatTimeValue(nextValue))}
      className={cx("w-full", className)}
    >
      <DateInput
        className={({ isDisabled: fieldDisabled, isFocusWithin, isInvalid: fieldInvalid }) =>
          cx(
            "relative flex w-full items-center rounded-lg bg-primary px-3.5 py-2.5 shadow-xs ring-1 ring-primary transition-shadow duration-100 ease-linear ring-inset",
            isFocusWithin && !fieldDisabled && "ring-2 ring-brand",
            fieldDisabled && "cursor-not-allowed bg-disabled_subtle ring-disabled",
            fieldInvalid && "ring-error_subtle",
            fieldInvalid && isFocusWithin && "ring-2 ring-error"
          )
        }
      >
        {(segment) => (
          <DateSegment
            segment={segment}
            className={({ isDisabled: segmentDisabled, isPlaceholder, type }) =>
              cx(
                "rounded px-0.5 text-md tabular-nums text-primary caret-transparent outline-hidden",
                type === "literal" && "px-0 text-fg-quaternary",
                type !== "literal" && "focus:bg-brand-solid focus:font-medium focus:text-white",
                isPlaceholder && "text-placeholder uppercase",
                segmentDisabled && "text-disabled"
              )
            }
          />
        )}
      </DateInput>
    </TimeField>
  );
}
