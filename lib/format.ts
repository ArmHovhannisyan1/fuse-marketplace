export const tokens = (amount: number) =>
  new Intl.NumberFormat("en").format(amount);
export function formatDate(timestamp: number) {
  return (
    new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(timestamp) + " UTC"
  );
}
export function timeLeft(now: number, deadline: number): string {
  const diff = deadline - now;
  if (diff <= 0) return "Deadline passed";
  const hours = Math.ceil(diff / 3_600_000);
  return hours >= 24
    ? `${Math.floor(hours / 24)}d ${hours % 24}h remaining`
    : `${hours}h remaining`;
}
