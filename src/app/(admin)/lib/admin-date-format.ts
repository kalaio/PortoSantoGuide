const ADMIN_DATE_TIME_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Lisbon",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

export function formatAdminDateTime(value: Date) {
  const parts = ADMIN_DATE_TIME_PARTS.formatToParts(value);
  const byType = new Map(parts.map((part) => [part.type, part.value]));

  return `${byType.get("day") ?? ""} ${byType.get("month") ?? ""} ${byType.get("year") ?? ""}, ${byType.get("hour") ?? ""}:${byType.get("minute") ?? ""}`;
}
