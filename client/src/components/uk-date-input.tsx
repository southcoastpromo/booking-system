/**
 * UK Date Utils + Components
 * - Ensures DD/MM/YYYY display while leveraging native date pickers
 * - Returns DD/MM/YYYY via onChange
 */
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { UK_DATE_CONFIG, ukDateToISO, isoDateToUK, isValidUKDate, formatUKDate } from "@shared/utils/date";

/* ----------------------------- Date utilities now in utils.ts ----------------------------- */

/* --------------------------- Input component -------------------------- */

interface UKDateInputProps {
  /** DD/MM/YYYY */
  value?: string;
  /** Called with DD/MM/YYYY (or empty string when cleared/invalid) */
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string; // applied to the visible text field for form posts in UK format
  required?: boolean;
  disabled?: boolean;
  /** Optional min/max for the native date picker (YYYY-MM-DD) */
  min?: string;
  max?: string;
  /** Allow manual typing into the visible field (default false: picker-only) */
  allowTyping?: boolean;
}

export function UKDateInput({
  value = "",
  onChange,
  placeholder = "DD/MM/YYYY",
  className = "",
  id,
  name,
  required = false,
  disabled = false,
  min,
  max,
  allowTyping = false,
}: UKDateInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(value);

  // Keep internal display in sync with external value
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const isoValue = useMemo(() => ukDateToISO(displayValue), [displayValue]);

  const emitChange = useCallback(
    (ddmmyyyy: string) => {
      if (onChange) onChange(ddmmyyyy);
    },
    [onChange]
  );

  // From native picker -> display
  const handlePickerChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const iso = e.target.value;
      const next = iso ? isoDateToUK(iso) : "";
      setDisplayValue(next);
      emitChange(next);
    },
    [emitChange]
  );

  // As-you-type formatter (numbers only -> DD/MM/YYYY)
  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/[^\d]/g, "");
      if (raw.length > 8) raw = raw.slice(0, 8);

      // Auto-insert slashes
      let formatted = raw;
      if (raw.length >= 3) formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
      if (raw.length >= 5)
        formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;

      setDisplayValue(formatted);

      // If complete (10 chars) and valid, emit; if cleared, emit empty
      if (formatted.length === 10) {
        emitChange(isValidUKDate(formatted) ? formatted : "");
      } else if (formatted.length === 0) {
        emitChange("");
      }
    },
    [emitChange]
  );

  const handleTextBlur = useCallback(() => {
    // On blur, if it looks complete but invalid, keep text but emit empty to upstream
    if (displayValue && displayValue.length === 10 && !isValidUKDate(displayValue)) {
      emitChange("");
    }
  }, [displayValue, emitChange]);

  return (
    <div className="relative">
      {/* Invisible native date input to trigger device/browser picker */}
      <input
        type="date"
        aria-label="Open date picker"
        value={isoValue}
        onChange={handlePickerChange}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        lang={UK_DATE_CONFIG.LOCALE}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        // Ensure it doesn't get announced as duplicate when tabbing
        tabIndex={0}
      />

      {/* Visible text input for UK-format display */}
      <input
        type="text"
        id={id}
        name={name}
        value={displayValue}
        onChange={allowTyping ? handleTextChange : undefined}
        onBlur={allowTyping ? handleTextBlur : undefined}
        placeholder={placeholder}
        className={`w-full h-full min-h-[48px] text-base sm:text-sm ${className}`}
        maxLength={10}
        inputMode="numeric"
        pattern="\\d{2}/\\d{2}/\\d{4}"
        title="Please enter date in DD/MM/YYYY format"
        disabled={disabled}
        // When typing is disabled, clicks should still open picker via the hidden input
        style={allowTyping ? undefined : { pointerEvents: "none" }}
        aria-describedby={id ? `${id}-hint` : undefined}
      />
    </div>
  );
}

/* -------------------------- Display component ------------------------- */

interface UKDateDisplayProps {
  date: string | Date;
  format?: "short" | "display" | "long";
  className?: string;
}

export function UKDateDisplay({
  date,
  format = "short",
  className = "",
}: UKDateDisplayProps) {
  const content = useMemo(() => {
    if (typeof date === 'string') {
      return date;
    } else {
      return formatUKDate(date);
    }
  }, [date, format]);
  return <span className={className}>{content}</span>;
}
