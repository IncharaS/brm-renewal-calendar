import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { renewalEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
    try {
        const { id, assignedTo, sharedBy } = await req.json();

        if (!id || !assignedTo) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const shareToken = randomUUID();

        await db
            .update(renewalEvents)
            .set({
                shareToken,
                assignedTo,
                sharedBy: sharedBy || "inchara@iu.edu",
            })
            .where(eq(renewalEvents.id, id));

        const link = `${process.env.NEXT_PUBLIC_BASE_URL}/events/share/${shareToken}`;

        return NextResponse.json({ link }, { status: 200 });
    } catch (err) {
        console.error("Error generating share link:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
