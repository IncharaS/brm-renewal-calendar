// src/lib/email.ts
import { Resend } from "resend";
export const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function sendReminderEmail({
    to,
    subject,
    message,
}: {
    to: string;
    subject: string;
    message: string;
}) {
    try {
        const result = await resend.emails.send({
            from: "Renewal Alerts <no-reply@aireply.shop>",
            to,
            subject,
            html: message,
        });
        console.log(" Email sent:", result);
        return result; // ensure the promise resolves before parent continues
    } catch (err) {
        console.error(" Failed to send email:", err);
        throw err; //  let API route handle it if needed
    }
}

