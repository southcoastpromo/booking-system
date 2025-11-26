/**
 * REDIRECT: Use consolidated date utilities from shared/utils/date.ts
 * Client-specific utilities that don't exist in shared module are kept here.
 */
export {
  parseUKDate as parseDate,
  formatDateDisplay as formatDate,
  formatUKDate,
  ukDateToISO,
  isoDateToUK,
  isValidUKDate
} from '../../../shared/utils/date.js';

/**
 * Format time string(s) to 12-hour format with AM/PM
 * Client-specific utility not available in shared module
 */
export function formatTime(timeString: string): string {
  if (timeString.includes("-")) {
    const [startTime, endTime] = timeString.split("-");
    return `${formatSingleTime(startTime)} - ${formatSingleTime(endTime)}`;
  }
  return formatSingleTime(timeString);
}

function formatSingleTime(time: string): string {
  if (time.includes(":")) {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  }
  return time;
}
