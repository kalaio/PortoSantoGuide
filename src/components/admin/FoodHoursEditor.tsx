"use client";

import { type Time, parseTime } from "@internationalized/date";
import { TimeInput } from "@heroui/date-input";
import {
  createEmptyFoodOpeningHoursWeekDraft,
  FOOD_OPENING_HOURS_DAY_KEYS,
  FOOD_OPENING_HOURS_DAY_LABELS,
  getFoodOpeningHoursIntervalValidationMessage,
  type FoodOpeningHoursDayKey,
  type FoodOpeningHoursIntervalDraft,
  type FoodOpeningHoursWeekDraft
} from "@/lib/listing-details-form";
import { Button } from "@/components/ui";
import {
  ADMIN_FIELD_ERROR_CLASS,
  ADMIN_HOURS_DAY_CLASS,
  ADMIN_HOURS_DAY_HEADER_CLASS,
  ADMIN_HOURS_EDITOR_CLASS,
  ADMIN_HOURS_EDITOR_INVALID_CLASS,
  ADMIN_HOURS_INTERVAL_ROW_CLASS,
  ADMIN_HOURS_INTERVAL_SEPARATOR_CLASS,
  ADMIN_HOURS_INTERVALS_CLASS,
  ADMIN_HOURS_INTERVAL_BUTTON_CLASS,
  ADMIN_TIME_INPUT_BASE_CLASS,
  ADMIN_TIME_INPUT_INNER_WRAPPER_CLASS,
  ADMIN_TIME_INPUT_SEGMENT_CLASS,
  ADMIN_TIME_INPUT_WRAPPER_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";

const DEFAULT_INTERVAL: FoodOpeningHoursIntervalDraft = {
  open: "11:00",
  close: "15:00"
};

function formatTimeValue(value: Time) {
  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
}

function toTimeValue(value: string) {
  return parseTime(value);
}

function cloneWeek(value: FoodOpeningHoursWeekDraft): FoodOpeningHoursWeekDraft {
  const clone = createEmptyFoodOpeningHoursWeekDraft();

  FOOD_OPENING_HOURS_DAY_KEYS.forEach((dayKey) => {
    clone[dayKey] = value[dayKey].map((interval) => ({ ...interval }));
  });

  return clone;
}

type FoodHoursEditorProps = {
  value: FoodOpeningHoursWeekDraft;
  onChange: (next: FoodOpeningHoursWeekDraft) => void;
  errorMessage?: string;
};

export default function FoodHoursEditor({ value, onChange, errorMessage }: FoodHoursEditorProps) {
  function handleAddInterval(dayKey: FoodOpeningHoursDayKey) {
    const next = cloneWeek(value);
    next[dayKey].push({ ...DEFAULT_INTERVAL });
    onChange(next);
  }

  function handleRemoveInterval(dayKey: FoodOpeningHoursDayKey, intervalIndex: number) {
    const next = cloneWeek(value);
    next[dayKey] = next[dayKey].filter((_, index) => index !== intervalIndex);
    onChange(next);
  }

  function handleIntervalFieldChange(
    dayKey: FoodOpeningHoursDayKey,
    intervalIndex: number,
    field: "open" | "close",
    fieldValue: string
  ) {
    const next = cloneWeek(value);
    const currentInterval = next[dayKey][intervalIndex];

    if (!currentInterval) {
      return;
    }

    next[dayKey][intervalIndex] = {
      ...currentInterval,
      [field]: fieldValue
    };

    onChange(next);
  }

  return (
    <div className={joinAdminClassNames(ADMIN_HOURS_EDITOR_CLASS, errorMessage && ADMIN_HOURS_EDITOR_INVALID_CLASS)}>
      {errorMessage ? <p className={ADMIN_FIELD_ERROR_CLASS}>{errorMessage}</p> : null}
      {FOOD_OPENING_HOURS_DAY_KEYS.map((dayKey) => {
        const intervals = value[dayKey];

        return (
          <div key={dayKey} className={ADMIN_HOURS_DAY_CLASS}>
            <div className={ADMIN_HOURS_DAY_HEADER_CLASS}>
              <strong>{FOOD_OPENING_HOURS_DAY_LABELS[dayKey]}</strong>
              <Button type="button" variant="secondary" size="sm" onClick={() => handleAddInterval(dayKey)}>
                Add slot
              </Button>
            </div>

            {intervals.length === 0 ? (
              <p className="muted">Closed</p>
            ) : (
              <div className={ADMIN_HOURS_INTERVALS_CLASS}>
                {intervals.map((interval, intervalIndex) => {
                  const validationMessage = getFoodOpeningHoursIntervalValidationMessage(interval.open, interval.close);
                  const hasInvalidRange = validationMessage !== null;

                  return (
                    <div key={`${dayKey}-${intervalIndex}`} className={ADMIN_HOURS_INTERVAL_ROW_CLASS}>
                    <TimeInput
                      aria-label={`${FOOD_OPENING_HOURS_DAY_LABELS[dayKey]} opens at`}
                      className={ADMIN_TIME_INPUT_BASE_CLASS}
                      classNames={{
                        base: ADMIN_TIME_INPUT_BASE_CLASS,
                        inputWrapper: ADMIN_TIME_INPUT_WRAPPER_CLASS,
                        innerWrapper: ADMIN_TIME_INPUT_INNER_WRAPPER_CLASS,
                        segment: ADMIN_TIME_INPUT_SEGMENT_CLASS
                      }}
                      errorMessage={validationMessage ?? undefined}
                      granularity="minute"
                      hourCycle={24}
                      isInvalid={hasInvalidRange}
                      size="lg"
                      value={toTimeValue(interval.open)}
                      variant="bordered"
                      radius="lg"
                      onChange={(value: Time | null) => {
                        if (!value) {
                          return;
                        }

                        handleIntervalFieldChange(dayKey, intervalIndex, "open", formatTimeValue(value));
                      }}
                    />
                    <span className={ADMIN_HOURS_INTERVAL_SEPARATOR_CLASS}>to</span>
                    <TimeInput
                      aria-label={`${FOOD_OPENING_HOURS_DAY_LABELS[dayKey]} closes at`}
                      className={ADMIN_TIME_INPUT_BASE_CLASS}
                      classNames={{
                        base: ADMIN_TIME_INPUT_BASE_CLASS,
                        inputWrapper: ADMIN_TIME_INPUT_WRAPPER_CLASS,
                        innerWrapper: ADMIN_TIME_INPUT_INNER_WRAPPER_CLASS,
                        segment: ADMIN_TIME_INPUT_SEGMENT_CLASS
                      }}
                       granularity="minute"
                       hourCycle={24}
                       errorMessage={validationMessage ?? undefined}
                       isInvalid={hasInvalidRange}
                       size="lg"
                       value={toTimeValue(interval.close)}
                       variant="bordered"
                       radius="lg"
                      onChange={(value: Time | null) => {
                        if (!value) {
                          return;
                        }

                        handleIntervalFieldChange(dayKey, intervalIndex, "close", formatTimeValue(value));
                      }}
                    />
                    <Button
                      className={ADMIN_HOURS_INTERVAL_BUTTON_CLASS}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRemoveInterval(dayKey, intervalIndex)}
                    >
                      Remove
                    </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
