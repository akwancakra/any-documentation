function toDate(input: string | Date): Date {
  return input instanceof Date ? input : new Date(input);
}

/** Kartu dokumen home: contoh "Apr 4, 2026" */
export function formatDateShort(input: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(toDate(input));
}

/** Footer halaman docs: id-ID + timezone server (env TZ / TIMEZONE) */
export function formatDocLastModified(input: string | Date): string {
  const timeZone = process.env.TZ || process.env.TIMEZONE || "Asia/Jakarta";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(toDate(input));
}

/** Recent activity dashboard — setara toLocaleString("en-US") */
export function formatActivityLogTime(input: string | Date): string {
  return toDate(input).toLocaleString("en-US");
}

/** Login logs — tanggal/waktu numerik konsisten */
export function formatLoginLogTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
