import NepaliDate from "nepali-date-converter";

function normalizeNepaliDate(value?: string) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/-/g, "/");
}

export function getNepaliPublishedDate(adDate?: string, nepaliDate?: string) {
  const explicitNepaliDate = normalizeNepaliDate(nepaliDate);
  if (explicitNepaliDate) {
    return explicitNepaliDate;
  }

  if (!adDate) {
    return "";
  }

  const parsedDate = new Date(adDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return adDate;
  }

  return NepaliDate.fromAD(parsedDate).format("YYYY/MM/DD", "np");
}

export function getPublishedDateLabel(adDate?: string, nepaliDate?: string, locale: string = "en") {
  if (locale === "ne") {
    return getNepaliPublishedDate(adDate, nepaliDate);
  }

  if (!adDate) {
    return "";
  }

  const parsedDate = new Date(adDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return adDate;
  }

  return parsedDate.toLocaleDateString("en-NP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}