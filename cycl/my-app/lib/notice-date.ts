import { getNepaliPublishedDate, getPublishedDateLabel } from "@/lib/news-date";

export function getNoticeDeadlineLabel(deadline?: string, deadlineNepali?: string, locale: string = "en") {
  return getPublishedDateLabel(deadline, deadlineNepali, locale);
}

export function getNoticeDeadlineNepali(deadline?: string, deadlineNepali?: string) {
  return getNepaliPublishedDate(deadline, deadlineNepali);
}