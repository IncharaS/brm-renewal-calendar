import { parseISO, isValid as isValidDate } from "date-fns";

export function toDate(d: string | Date): Date {
    if (d instanceof Date) return d;
    const iso = parseISO(d);
    if (isValidDate(iso)) return iso;
    const asDate = new Date(d);
    return isValidDate(asDate) ? asDate : new Date(NaN);
}
