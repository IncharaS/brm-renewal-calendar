export function computeRenewalEvents(a: any) {
    const events: any[] = [];
    if (!a.effectiveDate) return events;

    const MS_PER_DAY = 86400000;

    // --- Pacific time helpers ---
    const getPacificOffset = (date: Date) => {
        // auto-adjust for daylight savings
        const pacific = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Los_Angeles",
            timeZoneName: "short",
        })
            .formatToParts(date)
            .find((p) => p.type === "timeZoneName")?.value;

        // "PDT" = UTC-7, "PST" = UTC-8
        return pacific === "PDT" ? -7 * 60 : -8 * 60;
    };

    const toPacificDate = (d: Date) => {
        const offset = getPacificOffset(d);
        const utc = d.getTime();
        return new Date(utc + offset * 60000);
    };

    const addMonthsPacific = (d: Date, months: number) => {
        const dt = new Date(d);
        dt.setMonth(dt.getMonth() + months);
        return toPacificDate(dt);
    };

    // --- Core logic ---
    const start = new Date(a.effectiveDate);
    const initialMonths = a.initialTermMonths ?? 12;
    const currentEnd = addMonthsPacific(start, initialMonths);

    const addEvent = (title: string, date: Date, kind: string) => ({
        agreementId: a.id,
        title,
        eventDate: toPacificDate(date),
        kind,
        autoRenews: a.autoRenews ?? false,
    });

    // ---- MANUAL CONTRACTS ----
    if (!a.autoRenews) {
        events.push(addEvent("Contract term ends", currentEnd, "term_end"));
        return events;
    }

    // ---- AUTO-RENEWING CONTRACTS ----
    if (a.noticePeriodDays) {
        const noticeDate = new Date(
            currentEnd.getTime() - a.noticePeriodDays * MS_PER_DAY
        );
        events.push(
            addEvent(
                `Notice deadline (${a.noticePeriodDays} days before renewal)`,
                noticeDate,
                "notice"
            )
        );
    }

    // Optional informational marker for UI
    events.push(addEvent("Auto-renewal activates", currentEnd, "info"));

    return events;
}
