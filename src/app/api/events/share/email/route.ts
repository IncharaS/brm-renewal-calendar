import { NextResponse } from "next/server";
import { sendReminderEmail } from "@/lib/email";

export async function POST(req: Request) {
    console.log("[EMAIL DEBUG] Incoming payload:", await req.clone().json());

    try {
        const { to, from, fromName, shareLink, eventTitle, pdfUrl, products, vendorName } = await req.json();
        if (!to || !shareLink || !eventTitle)
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        const productList = products?.length
            ? `<p><strong>Products:</strong> ${products.slice(0, 3).join(", ")}${products.length > 3 ? "…" : ""}</p>`
            : "";

        const htmlMessage = `
        <p>Hello,</p>
        <p>${fromName || "A Renewal Calendar user"} (${from || "noreply@yourapp.com"}) shared an event with you:</p>
        <h3 style="color:#2563eb;">${eventTitle}</h3>
        <p><strong>Vendor:</strong> ${vendorName}</p>
        ${productList}
        <p>You can view the event here:</p>
        <a href="${shareLink}" target="_blank" style="background:#2563eb;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">Open Shared Event</a>
        ${pdfUrl ? `<p style="margin-top:14px;">📄 <a href="${pdfUrl}" target="_blank">View Attached PDF</a></p>` : ""}
        <p>Best,<br/>Renewal Calendar</p>
        `;
        await sendReminderEmail({
            to,
            subject: `📩 Shared Event: ${eventTitle}`,
            message: htmlMessage,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error sending share email:", err);
        return NextResponse.json({ error: "Email send failed" }, { status: 500 });
    }
}
