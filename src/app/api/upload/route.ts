import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agreements, renewalEvents } from "@/lib/db/schema";
import { llmExtractFields } from "@/lib/llmExtract";
import { computeRenewalEvents } from "@/lib/dateUtils";
import { auth } from "@clerk/nextjs/server";
import { extractTextWithRetries } from "@/lib/pdfExtract";

export async function POST(req: Request) {
    try {
        console.log("[1] /api/upload hit");

        const { file_key, file_name } = await req.json();
        if (!file_key || !file_name) {
            return NextResponse.json(
                { success: false, message: "file_key and file_name are required" },
                { status: 400 }
            );
        }

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
        const region = process.env.NEXT_PUBLIC_S3_AWS_REGION;
        if (!bucket || !region) {
            return NextResponse.json({ success: false, message: "Missing S3 configuration" }, { status: 500 });
        }

        // --- Download file from S3 ---
        const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${file_key}`;
        console.log("[2] Fetching:", fileUrl);

        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`Failed to fetch S3 file: ${res.statusText}`);

        const buffer = Buffer.from(await res.arrayBuffer());
        console.log("[3] Downloaded:", buffer.length, "bytes");

        // --- Extract text with retries ---
        const text = await extractTextWithRetries(buffer, file_name);

        if (!text || text.trim().length < 50) {
            console.error("Extraction returned empty or too short text");
            return NextResponse.json({
                success: false,
                message: "Sorry, this PDF may be corrupted or unreadable. Please try again.",
            });
        }

        console.log("[4] Final extracted text length:", text.length);

        // --- Extract fields via LLM ---
        const fields = await llmExtractFields(text);
        console.log("[5] LLM extracted fields:", JSON.stringify(fields, null, 2));

        // --- Save agreement record ---
        const [agreement] = await db
            .insert(agreements)
            .values({
                userId,
                vendorName: fields.vendor_name || "Unknown Vendor",
                title: fields.title || file_name,
                effectiveDate: fields.effective_date
                    ? new Date(fields.effective_date)
                    : null,
                initialTermMonths: fields.initial_term_months ?? null,
                autoRenews: fields.auto_renews ?? false,
                renewalTermMonths: fields.renewal_term_months ?? null,
                noticePeriodDays: fields.notice_period_days ?? null,
                rawText: text,
                sourceFile: file_key,
                products: fields.products,
            })
            .returning({ id: agreements.id });

        console.log("[6] Agreement ID:", agreement.id);

        // --- Compute and store renewal events ---
        const computed = computeRenewalEvents({
            id: agreement.id,
            effectiveDate: fields.effective_date,
            initialTermMonths: fields.initial_term_months,
            renewalTermMonths: fields.renewal_term_months,
            autoRenews: fields.auto_renews,
            noticePeriodDays: fields.notice_period_days,
        });

        console.log("[7] Computed renewal events:", computed.length);

        if (computed.length) {
            const enriched = computed.map((e) => ({
                ...e,
                agreementId: agreement.id,
                userId,
                isDone: false,
                assignedTo: null,
                sharedBy: null,
                shareToken: null,
                vendorName: fields.vendor_name || "Unknown Vendor",
            }));

            await db.insert(renewalEvents).values(enriched);
            console.log("[8] ✅ Events inserted successfully");
        } else {
            console.log("[8] ⚠️ No renewal events computed - check extraction results");
        }

        return NextResponse.json({ success: true, agreementId: agreement.id });
    } catch (err: any) {
        console.error("/api/upload error:", err);
        return NextResponse.json(
            {
                success: false,
                message: "Sorry, something went wrong while processing this file. Please try again.",
                error: err.message || "Upload failed",
            },
            { status: 500 }
        );
    }
}
