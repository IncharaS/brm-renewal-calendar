import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agreements, renewalEvents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { randomUUID } from "crypto";
import { addMonths, format } from "date-fns";

// -------------------- PATCH --------------------
export async function PATCH(req: Request) {
    try {
        // ✅ must await
        const userId = await requireUser();

        const body = await req.json() as {
            id: number;
            isDone?: boolean;
            assignedTo?: string;
            share?: boolean;
            action?: "renew" | "cancel_auto" | "resolve";
        };

        const { id, isDone, assignedTo, share, action } = body;
        if (!id) {
            return NextResponse.json({ error: "Missing event id" }, { status: 400 });
        }

        // Ensure event belongs to this user
        const row = await db
            .select({ eId: renewalEvents.id })
            .from(renewalEvents)
            .leftJoin(agreements, eq(renewalEvents.agreementId, agreements.id))
            .where(and(eq(renewalEvents.id, id), eq(agreements.userId, userId)));

        if (!row.length) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // 1. Mark done / undone
        if (typeof isDone === "boolean") {
            await db
                .update(renewalEvents)
                .set({ isDone })
                .where(eq(renewalEvents.id, id));
            return NextResponse.json({ ok: true });
        }

        // 2. Assign to another user
        if (assignedTo) {
            await db
                .update(renewalEvents)
                .set({ assignedTo })
                .where(eq(renewalEvents.id, id));
            return NextResponse.json({ ok: true });
        }

        // 3. Generate share link
        if (share) {
            const token = randomUUID();
            await db
                .update(renewalEvents)
                .set({ shareToken: token })
                .where(eq(renewalEvents.id, id));
            return NextResponse.json({ token });
        }

        // 4. Handle actions (renew / cancel_auto / resolve)
        if (action === "renew") {
            const original = await db.query.renewalEvents.findFirst({
                where: eq(renewalEvents.id, id),
            });
            if (!original) throw new Error("Event not found");

            const nextDate = addMonths(
                new Date(original.eventDate),
                original.renewalTermMonths || 12
            );

            await db.insert(renewalEvents).values({
                agreementId: original.agreementId,
                title: `Renewal - ${format(nextDate, "PPP")}`,
                eventDate: nextDate,
                kind: original.kind,
                autoRenews: original.autoRenews,
                vendorName: original.vendorName,
                isDone: false,
            });

            await db
                .update(renewalEvents)
                .set({ isResolved: true })
                .where(eq(renewalEvents.id, id));

            return NextResponse.json({ ok: true, message: "Renewed successfully" });
        }

        if (action === "cancel_auto") {
            await db
                .update(renewalEvents)
                .set({ autoRenews: false })
                .where(eq(renewalEvents.id, id));
            return NextResponse.json({ ok: true, message: "Auto-renew cancelled" });
        }

        // if (action === "resolve") {
        //     await db
        //         .update(renewalEvents)
        //         .set({ isResolved: true })
        //         .where(eq(renewalEvents.id, id));
        //     return NextResponse.json({ ok: true, message: "Resolved" });
        // }

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("PATCH /api/events error:", e);
        return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
    }
}

// -------------------- DELETE --------------------
export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params; // 
    const userId = await requireUser();
    const eventId = Number(id);

    const rows = await db
        .select({ eId: renewalEvents.id })
        .from(renewalEvents)
        .leftJoin(agreements, eq(agreements.id, renewalEvents.agreementId))
        .where(and(eq(renewalEvents.id, eventId), eq(agreements.userId, userId)));

    if (!rows.length) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await db.delete(renewalEvents).where(eq(renewalEvents.id, eventId));
    return NextResponse.json({ success: true });
}
