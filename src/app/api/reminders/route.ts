import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { renewalEvents, agreements } from "@/lib/db/schema";
import { sendReminderEmail } from "@/lib/email";
import { eq, and, gt } from "drizzle-orm";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { auth, currentUser } from "@clerk/nextjs/server";

function authorize(req: Request) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
// Helper: get current logged-in user + email
async function getCurrentUserEmail(): Promise<{ userId: string; email: string } | null> {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await currentUser();
    const email =
        user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
    if (!email) return null;

    return { userId, email };
}

export async function GET(req: Request) {
    const authError = authorize(req);
    if (authError) return authError;
    // console.log(req);
    try {
        const current = await getCurrentUserEmail();
        if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { userId, email } = current;

        const today = startOfDay(new Date());
        console.log(today, 'today');
        // Fetch *upcoming* events for this user
        const events = await db
            .select({
                id: renewalEvents.id,
                title: renewalEvents.title,
                eventDate: renewalEvents.eventDate,
                vendor: agreements.vendorName,
                isDone: renewalEvents.isDone,
                isResolved: renewalEvents.isResolved,
                lastReminderSent: renewalEvents.lastReminderSent,
                products: agreements.products,
            })
            .from(renewalEvents)
            .innerJoin(agreements, eq(agreements.id, renewalEvents.agreementId))
            .where(and(gt(renewalEvents.eventDate, today), eq(agreements.userId, userId)));
        console.log(events, 'events');
        const daysToNotify = [60, 30, 15, 1];
        let sent = 0;

        for (const e of events) {
            if (e.isDone || e.isResolved) continue;

            const daysLeft = differenceInCalendarDays(new Date(e.eventDate), today);
            if (daysLeft <= 0) continue;
            if (!daysToNotify.includes(daysLeft)) continue;

            // Skip if already reminded today
            if (e.lastReminderSent && differenceInCalendarDays(today, new Date(e.lastReminderSent)) === 0)
                continue;

            await sendReminderEmail({
                to: email,
                subject: `⏰ Renewal in ${daysLeft} days: ${e.vendor}`,
                message: `
          <p>Hello,</p>
          <p><strong>${e.title}</strong> for <strong>${e.vendor}</strong> is due on 
          <b>${new Date(e.eventDate).toLocaleDateString()}</b>.</p>
          <p>You are receiving this because the renewal date is ${daysLeft} days away.</p>
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/events/${e.id}" target="_blank"
              style="background:#2563eb;color:white;padding:8px 14px;border-radius:6px;
              text-decoration:none;">View Event</a></p>
        `,
            });

            // Update reminder timestamp so we don’t resend same-day
            await db
                .update(renewalEvents)
                .set({ lastReminderSent: today })
                .where(eq(renewalEvents.id, e.id));

            sent++;

            await new Promise((r) => setTimeout(r, 400)); // avoid rate limits
        }

        return NextResponse.json({ success: true, count: sent });
    } catch (err: any) {
        console.error("Reminder route failed:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
