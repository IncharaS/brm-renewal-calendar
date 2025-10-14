import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agreements, renewalEvents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { computeRenewalEvents } from "@/lib/dateUtils";
import { addMonths } from "date-fns";

export const dynamic = "force-dynamic";

// Utility: Pacific now
function pacificNow(): Date {
    const now = new Date();
    const pacific = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
    }).formatToParts(now);

    const [month, day, year] = [
        pacific.find((p) => p.type === "month")?.value,
        pacific.find((p) => p.type === "day")?.value,
        pacific.find((p) => p.type === "year")?.value,
    ];
    return new Date(`${month} ${day}, ${year} 00:00:00`);
}

/**
 * Cron endpoint to extend auto-renew contracts yearly.
 * - Runs once daily (via Vercel cron)
 * - Checks all agreements where autoRenews=true
 * - If last "info" event passed, creates next cycle events
 */
export async function GET() {
    try {
        const today = pacificNow();

        console.log("Auto-Renew Cron running at:", today.toISOString());

        //  Fetch all active auto-renew agreements
        const autoAgreements = await db
            .select()
            .from(agreements)
            .where(eq(agreements.autoRenews, true));

        let generated = 0;

        for (const ag of autoAgreements) {
            //  Find latest renewal event for this agreement
            const latest = await db.query.renewalEvents.findFirst({
                where: eq(renewalEvents.agreementId, ag.id),
                orderBy: desc(renewalEvents.eventDate),
            });

            // Skip if no event or already handled
            if (!latest) continue;

            const latestDate = new Date(latest.eventDate);
            if (latestDate > today) continue; // not yet reached
            if (latest.isDone) continue; // already closed

            //  Roll forward only if still auto-renewing
            const baseDate = ag.effectiveDate ? new Date(ag.effectiveDate) : new Date(); // fallback to today
            const monthsToAdd = ag.renewalTermMonths ?? 12;
            const nextStart = addMonths(baseDate, monthsToAdd);



            // Compute new cycle
            const nextEvents = computeRenewalEvents({
                ...ag,
                effectiveDate: nextStart,
            });

            if (nextEvents.length) {
                await db.insert(renewalEvents).values(nextEvents);
                generated++;
                console.log(
                    `🔁 Auto-renewed: ${ag.vendorName} → ${nextEvents.length} new events`
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: `Auto-renew check completed.`,
            generated,
        });
    } catch (err: any) {
        console.error("❌ Auto-Renew Cron Error:", err);
        return NextResponse.json(
            { error: err.message || "Auto-renew check failed" },
            { status: 500 }
        );
    }
}
