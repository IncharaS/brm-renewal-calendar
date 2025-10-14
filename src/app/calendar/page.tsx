"use client";
import React, { useMemo, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import MiniCalendar from "@/components/calendar/MiniCalendar";
import CalendarSummary from "@/components/calendar/CalendarSummary";
import TimelineView from "@/components/calendar/TimelineView";
import CalendarFilters from "@/components/calendar/CalendarFilters";
import CalendarListView from "@/components/calendar/CalendarListView";
import { useEvents } from "@/components/calendar/useEvents";
import { toDate } from "@/components/calendar/utils";

export default function CalendarPage() {
    const { events, loading, fetchEvents } = useEvents();
    const [vendorFilter, setVendorFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [viewMode, setViewMode] = useState<"List" | "Chart">("List");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const vendors = [
        "All",
        ...Array.from(new Set(events.map((e: any) => e.vendor || "Unknown"))).sort(),
    ];

    const filtered = useMemo(() => {
        return events.filter((e) => {
            const vendorOk = vendorFilter === "All" || e.vendor === vendorFilter;
            const typeOk =
                typeFilter === "All" ||
                (typeFilter === "Renewal" && e.kind === "term_end") ||
                (typeFilter === "Notice" && e.kind === "notice");
            return vendorOk && typeOk;
        });
    }, [events, vendorFilter, typeFilter]);

    const grouped = useMemo(() => {
        const g: Record<string, typeof events> = {};
        for (const e of filtered) {
            const year = String(toDate(e.eventDate).getFullYear());
            if (!g[year]) g[year] = [];
            g[year].push(e);
        }
        return g;
    }, [filtered]);

    if (loading)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Clock className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="mt-2 text-gray-600">Loading events...</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-r p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-10">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h1 className="text-4xl font-semibold text-gray-800 flex items-center gap-3">
                        <CalendarDays className="w-9 h-9 text-blue-500" />
                        Renewal Calendar
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 justify-end">
                        <CalendarFilters
                            vendorFilter={vendorFilter}
                            setVendorFilter={setVendorFilter}
                            vendors={vendors}
                            typeFilter={typeFilter}
                            setTypeFilter={setTypeFilter}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                        />

                        <button
                            onClick={() => (window.location.href = "/upload")}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm shadow-sm"
                        >
                            + Upload New PDF
                        </button>
                    </div>
                </div>

                {/* CALENDAR + SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MiniCalendar
                        selectedDate={selectedDate}
                        onChange={setSelectedDate}
                        onActiveMonthChange={(date) => setSelectedDate(date)}
                    />
                    <CalendarSummary filtered={filtered} selectedDate={selectedDate} />
                </div>

                {/* LIST OR GANTT VIEW */}
                <div>
                    {viewMode === "Chart" ? (
                        <TimelineView
                            items={filtered.map((e) => ({
                                id: e.id,
                                title: e.title,
                                vendor: e.agreement,
                                start: new Date(new Date(e.eventDate).getTime() - 90 * 86400000),
                                end: new Date(e.eventDate),
                                kind: e.kind,
                                isDone: e.isDone,
                            }))}
                        />
                    ) : (
                        <CalendarListView
                            grouped={grouped}
                            fetchEvents={fetchEvents}

                        />
                    )}
                </div>
            </div>
        </div>
    );
}
