import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agreements, renewalEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { addMonths, format } from "date-fns";

export async function GET() {
    try {
        const userId = await requireUser();

        const rows = await db
            .select({
                id: renewalEvents.id,
                title: renewalEvents.title,
                eventDate: renewalEvents.eventDate,
                kind: renewalEvents.kind,
                isDone: renewalEvents.isDone,
                assignedTo: renewalEvents.assignedTo,
                shareToken: renewalEvents.shareToken,
                agreement: agreements.title,
                vendor: agreements.vendorName,
                fileKey: agreements.sourceFile,
                products: agreements.products,
                autoRenews: renewalEvents.autoRenews,
                status: renewalEvents.status,
            })
            .from(renewalEvents)
            .leftJoin(agreements, eq(renewalEvents.agreementId, agreements.id))
            .where(eq(agreements.userId, userId));

        return NextResponse.json(rows);
    } catch (e: any) {
        console.error("/api/events GET error:", e);
        return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, isDone, action } = body;
        if (!id) return NextResponse.json({ error: "Missing event ID" }, { status: 400 });

        // Mark Done
        if (typeof isDone === "boolean") {
            await db.update(renewalEvents).set({ isDone }).where(eq(renewalEvents.id, id));
            return NextResponse.json({ success: true, updated: "isDone" });
        }

        // Manual Renew
        if (action === "renew") {
            const original = await db.query.renewalEvents.findFirst({
                where: eq(renewalEvents.id, id),
            });
            if (!original) throw new Error("Event not found");

            const nextDate = addMonths(original.eventDate, 12);

            // 1️⃣ Mark current event as renewed
            await db
                .update(renewalEvents)
                .set({ status: "renewed" })
                .where(eq(renewalEvents.id, id));

            // 2️⃣ Insert next renewal event
            await db.insert(renewalEvents).values({
                agreementId: original.agreementId,
                title: `Renewal - ${format(nextDate, "PPP")}`,
                eventDate: nextDate,
                kind: original.kind,
                autoRenews: false,
                vendorName: original.vendorName,
                isDone: false,
            });

            return NextResponse.json({ success: true, renewed: true });
        }

        // Cancel Auto-Renew
        if (action === "cancel_auto") {
            await db
                .update(renewalEvents)
                .set({ autoRenews: false, status: "canceled" }) // <-- persist status
                .where(eq(renewalEvents.id, id));

            return NextResponse.json({ success: true, canceled: true });
        }

        return NextResponse.json({ error: "No valid operation" }, { status: 400 });
    } catch (e: any) {
        console.error("PATCH /api/events error:", e);
        return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
    }
}
