"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import EventCard from "@/components/calendar/EventCard";
import { CalendarEvent } from "./useEvents";

export default function CalendarListView({
    grouped,
    fetchEvents,

}: {
    grouped: Record<string, CalendarEvent[]>;
    fetchEvents: () => void;

}) {
    const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

    const toggleYear = (year: string) =>
        setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));

    return (
        <div>
            {Object.entries(grouped).map(([year, list]) => (
                <div key={year} className="mb-6 border-b pb-2">
                    <button
                        onClick={() => toggleYear(year)}
                        className="flex items-center justify-between w-full text-left text-xl font-semibold text-gray-800 hover:text-blue-600 transition"
                    >
                        <div className="flex items-center gap-2">
                            {expandedYears[year] ? (
                                <ChevronDown className="w-5 h-5" />
                            ) : (
                                <ChevronRight className="w-5 h-5" />
                            )}
                            {year}
                        </div>
                        <span className="text-sm text-gray-500">{list.length} events</span>
                    </button>

                    {expandedYears[year] && (
                        <div className="mt-3 pl-6 space-y-3">
                            {list
                                .filter((e) => !e.isDone)
                                .map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onChange={fetchEvents}

                                    />

                                ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
