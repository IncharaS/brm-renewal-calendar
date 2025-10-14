"use client";

import React, { useState, useEffect } from "react";
import { Share2, FileText, X, CheckCircle2, Trash2 } from "lucide-react";
import ShareModal from "../ShareModal";
import PDFViewer from "../PDFViewer";
import { format } from "date-fns";

export default function EventCard({ event, onChange }: any) {
    const [showShare, setShowShare] = useState(false);
    const [showPDF, setShowPDF] = useState(false);
    const [status, setStatus] = useState<"renewed" | "canceled" | "expired" | null>(
        null
    );

    const pdfUrl = event.fileKey
        ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_S3_AWS_REGION}.amazonaws.com/${event.fileKey}`
        : null;

    // Detect expired events
    useEffect(() => {
        const eventDate = new Date(event.eventDate);
        const today = new Date();
        if (eventDate < today && !event.isDone) {
            setStatus("expired");
        }
    }, [event.eventDate, event.isDone]);

    // Handle renew / cancel
    const handleAction = async (type: "renew" | "cancel_auto") => {
        try {
            await fetch("/api/events", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: event.id, action: type }),
            });

            setStatus(type === "renew" ? "renewed" : "canceled");
            onChange?.(); // refresh
        } catch (err) {
            console.error("Action failed:", err);
            alert("Failed to perform action.");
        }
    };

    // Delete event
    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        try {
            await fetch(`/api/events/${event.id}`, { method: "DELETE" });
            onChange?.();
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete event.");
        }
    };

    // Mark Done
    const handleMarkDone = async () => {
        try {
            await fetch(`/api/events`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: event.id, isDone: true }),
            });
            onChange?.();
        } catch (err) {
            console.error("Failed to mark done:", err);
            alert("Failed to mark done.");
        }
    };

    if (event.isDone) return null;

    return (
        <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50 hover:bg-white transition flex flex-col gap-3">
            {/* === Event Header === */}
            <div>
                <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800">{event.title}</p>

                    {status && (
                        <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${status === "renewed"
                                ? "bg-green-100 text-green-700"
                                : status === "canceled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                        >
                            {status === "renewed"
                                ? "Renewed"
                                : status === "canceled"
                                    ? "Canceled"
                                    : "Expired"}
                        </span>
                    )}
                </div>

                {/* Info-only events */}
                {event.kind === "info" && (
                    <p className="text-xs text-gray-400 italic">Auto-renewal scheduled</p>
                )}

                <p className="text-sm text-gray-600">{event.vendor}</p>
                <p className="text-sm text-gray-500">
                    {format(new Date(event.eventDate), "PPP")}
                </p>

                <p className="text-xs mt-1 text-gray-500 italic">
                    {event.autoRenews ? "Auto-renews annually" : "Manual renewal required"}
                </p>

                {event.products?.length > 0 && (
                    <p className="text-sm text-gray-500">
                        Products: {event.products.slice(0, 2).join(", ")}
                        {event.products.length > 2 &&
                            ` +${event.products.length - 2} more`}
                    </p>
                )}
            </div>

            {/* === Action Buttons === */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* View PDF */}
                {pdfUrl && (
                    <button
                        onClick={() => setShowPDF(true)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600"
                    >
                        <FileText size={14} /> View PDF
                    </button>
                )}

                {/* Share */}
                <button
                    onClick={() => setShowShare(true)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600"
                >
                    <Share2 size={14} /> Share
                </button>

                {/* === CASE 1: EXPIRED === */}
                {status === "expired" && (
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-700 text-white hover:bg-gray-800 text-sm"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                )}

                {/* === CASE 2: RENEWED / CANCELED === */}
                {(status === "renewed" || status === "canceled") && (
                    <button
                        onClick={handleMarkDone}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 text-sm"
                    >
                        <CheckCircle2 size={14} /> Mark Done
                    </button>
                )}

                {/* === CASE 3: ACTIVE EVENTS === */}
                {!status && event.kind !== "info" && (
                    <>
                        {/* Cancel Auto-Renew only for notice events */}
                        {event.kind === "notice" ? (
                            <button
                                onClick={() => handleAction("cancel_auto")}
                                className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm"
                            >
                                Cancel Auto-Renew
                            </button>
                        ) : !event.autoRenews ? (
                            <button
                                onClick={() => handleAction("renew")}
                                className="px-3 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 text-sm"
                            >
                                Renew
                            </button>
                        ) : null}

                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-700 text-white hover:bg-gray-800 text-sm"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </>
                )}
            </div>

            {/* === PDF Modal === */}
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

            {/* === Share Modal === */}
            {showShare && (
                <ShareModal
                    eventId={event.id}
                    title={event.title}
                    onClose={() => setShowShare(false)}
                    pdfUrl={pdfUrl}
                />
            )}
        </div>
    );
}
