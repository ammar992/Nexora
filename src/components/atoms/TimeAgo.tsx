import { timeAgo, formatDateTime } from "@/resources/utils/format";

/** Relative time; the text legitimately differs between server render and hydration. */
export function TimeAgo({ value, className }: { value: string | Date; className?: string }) {
  return (
    <time dateTime={new Date(value).toISOString()} title={formatDateTime(value)} className={className} suppressHydrationWarning>
      {timeAgo(value)}
    </time>
  );
}
