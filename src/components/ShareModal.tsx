"use client";

import React, { useState } from "react";
import axios from "axios";
import { X, Share2, CheckCircle, Mail, Copy } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function ShareModal({
    eventId,
    title,
    pdfUrl,
    onClose,
    vendorName
}: {
    eventId: number | string;
    title: string;
    pdfUrl?: string | null;
    onClose: () => void;
    vendorName?: string;
}) {
    const { user } = useUser();
    const fromEmail = user?.primaryEmailAddress?.emailAddress || "noreply@renewalcalendar.com";
    const fromName = user?.fullName || "Renewal Calendar User";

    const [recipientEmail, setRecipientEmail] = useState("");
    const [link, setLink] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    // Step 1: Generate share link
    const handleGenerate = async () => {
        if (!recipientEmail) return alert("Please enter a recipient email");
        setLoading(true);
        try {
            const res = await axios.post("/api/events/share/generate", {
                id: eventId,
                assignedTo: recipientEmail,
                sharedBy: fromEmail,
            });
            setLink(res.data.link);
        } catch (err) {
            console.error(err);
            alert("Failed to generate link");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Send email (with optional PDF link)
    const handleSendEmail = async () => {
        if (!link) return alert("Generate the share link first!");
        setLoading(true);
        try {
            await axios.post("/api/events/share/email", {
                to: recipientEmail,
                from: fromEmail,
                fromName,
                shareLink: link,
                eventTitle: title,
                pdfUrl: pdfUrl,
                vendorName: vendorName,
            });
            setSent(true);
        } catch (err) {
            console.error(err);
            alert("Failed to send email");
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Copy link to clipboard
    const handleCopy = () => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        alert("Link copied to clipboard!");
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-blue-500" />
                    Share Event
                </h2>
                <p className="text-sm text-gray-600 mb-4">{title}</p>

                {!link ? (
                    <>
                        <input
                            type="email"
                            placeholder="Enter recipient's email"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-400"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? "Generating..." : "Generate Link"}
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="text-green-500 w-10 h-10 mb-2" />
                        <p className="text-sm text-gray-700 mb-3">Share link created!</p>

                        <input
                            type="text"
                            readOnly
                            value={link}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                        />

                        <div className="flex gap-2 w-full">
                            <button
                                onClick={handleSendEmail}
                                disabled={loading || sent}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white font-medium ${sent
                                    ? "bg-green-500"
                                    : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
                                    }`}
                            >
                                <Mail size={16} />
                                {sent ? "Sent!" : loading ? "Sending..." : "Send Email"}
                            </button>

                            <button
                                onClick={handleCopy}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-medium"
                            >
                                <Copy size={16} /> Copy Link
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
