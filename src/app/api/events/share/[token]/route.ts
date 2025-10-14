import { db } from "@/lib/db";
import { agreements, renewalEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request, context: any) {

    try {
        const token = context?.params?.token;
        if (!token)
            return NextResponse.json({ error: "Missing token" }, { status: 400 });

        const [event] = await db
            .select({
                id: renewalEvents.id,
                title: renewalEvents.title,
                eventDate: renewalEvents.eventDate,
                kind: renewalEvents.kind,
                isDone: renewalEvents.isDone,
                assignedTo: renewalEvents.assignedTo,
                sharedBy: renewalEvents.sharedBy,
                vendorName: agreements.vendorName,
                fileKey: agreements.sourceFile,
                products: agreements.products,
                autoRenews: renewalEvents.autoRenews,
            })
            .from(renewalEvents)
            .leftJoin(agreements, eq(renewalEvents.agreementId, agreements.id))
            .where(eq(renewalEvents.shareToken, token))
            .limit(1);

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        return NextResponse.json({ event });
    } catch (err) {
        console.error("Error fetching shared event:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
