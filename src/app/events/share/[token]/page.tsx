"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CalendarDays, User, Clock, FileText, X } from "lucide-react";
import PDFViewer from "@/components/PDFViewer";

type SharedEvent = {
    id: number | string;
    title: string;
    eventDate: string;
    kind: "notice" | "term_end";
    agreement: string;
    assignedTo?: string | null;
    sharedBy?: string | null;
    isDone?: boolean;
    vendorName: string;
    autoRenews?: boolean | null;
    products?: string[];
    fileKey?: string | null;
};

export default function SharedEventPage() {
    const { token } = useParams<{ token: string }>();
    const [event, setEvent] = useState<SharedEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPDF, setShowPDF] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await fetch(`/api/events/share/${token}`);
                const data = await res.json();
                if (data.event) setEvent(data.event);
            } catch (err) {
                console.error("Error fetching shared event:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const handleAction = async (type: "renew" | "cancel_auto") => {
        if (!event) return;
        setProcessing(true);
        try {
            await fetch("/api/events", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: event.id, action: type }),
            });
            alert(type === "renew" ? "Renewed successfully!" : "Auto-renew canceled!");
        } catch (err) {
            console.error(err);
            alert("Failed to perform action.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-600">
                <Clock className="w-10 h-10 animate-spin text-blue-500" />
                <p>Loading shared event...</p>
            </div>
        );

    if (!event)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-600">
                <p>No event found for this link.</p>
            </div>
        );

    const pdfUrl = event.fileKey
        ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_S3_AWS_REGION}.amazonaws.com/${event.fileKey}`
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-r from-indigo-100 via-pink-100 to-yellow-100 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 space-y-4 relative">
                <div className="flex items-center gap-3 mb-2">
                    <CalendarDays className="w-8 h-8 text-blue-500" />
                    <h1 className="text-2xl font-semibold text-gray-800">Shared Event</h1>
                </div>

                <div>
                    <p className="text-lg font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">
                        Vendor: <span className="font-semibold">{event.vendorName}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        Event Date: {format(parseISO(event.eventDate), "PPP")}
                    </p>
                    <p className="text-sm text-gray-600">
                        Type: {event.kind === "term_end" ? "Renewal" : "Notice"}
                    </p>

                    {event.products?.length ? (
                        <p className="text-sm text-gray-600">
                            Products: {event.products.slice(0, 2).join(", ")}
                            {event.products.length > 2 && ` +${event.products.length - 2} more`}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No products listed.</p>
                    )}

                    {event.assignedTo && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                            <User className="w-4 h-4 text-gray-500" /> Assigned to{" "}
                            <span className="font-semibold">{event.assignedTo}</span>
                        </p>
                    )}
                </div>

                {/* PDF & Renewal Actions */}
                <div className="flex flex-col gap-3 pt-4">
                    {pdfUrl && (
                        <button
                            onClick={() => setShowPDF(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                        >
                            <FileText size={16} /> View PDF
                        </button>
                    )}

                    {event.autoRenews ? (
                        <button
                            onClick={() => handleAction("cancel_auto")}
                            disabled={processing}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                            Cancel Auto-Renew
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction("renew")}
                            disabled={processing}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                            Renew
                        </button>
                    )}
                </div>

                {/* PDF Modal */}
                {showPDF && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                        <div className="bg-white rounded-xl shadow-xl w-11/12 h-[90vh] flex flex-col relative">
                            <button
                                onClick={() => setShowPDF(false)}
                                className="absolute top-3 right-3 text-gray-700 hover:text-red-500"
                            >
                                <X size={22} />
                            </button>
                            <div className="flex-1 overflow-hidden">
                                <PDFViewer pdf_url={pdfUrl!} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
