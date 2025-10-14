"use client";
import React from "react";
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
} from "date-fns";
import { toDate } from "./utils";

export interface CalendarSummaryProps {
    filtered: any[];
    selectedDate: Date;
}

export default function CalendarSummary({ filtered, selectedDate }: CalendarSummaryProps) {
    const today = selectedDate;

    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const todayEvents = filtered.filter(
        (e) => format(toDate(e.eventDate), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    );

    const weekEvents = filtered.filter((e) => {
        const dt = toDate(e.eventDate);
        return dt >= weekStart && dt <= weekEnd;
    });

    const monthEvents = filtered.filter((e) => {
        const dt = toDate(e.eventDate);
        return dt >= monthStart && dt <= monthEnd;
    });

    const renderList = (events: any[], showDateInBrackets = false) =>
        events.length === 0 ? (
            <li className="text-gray-500">No tasks</li>
        ) : (
            events.map((e) => (
                <li key={e.id} className="text-sm text-gray-700 leading-relaxed">
                    {e.agreement} — {e.title}
                    {showDateInBrackets && (
                        <span className="text-gray-500"> ({format(toDate(e.eventDate), "MMM d, yyyy")})</span>
                    )}
                </li>
            ))
        );

    return (
        <div className="bg-white border rounded-2xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {format(today, "MMMM yyyy")}
            </h3>

            {/* Selected Day */}
            <div className="mb-5">
                <p className="font-semibold text-gray-700 mb-1">Selected Day:</p>
                <ul className="pl-4 list-disc">{renderList(todayEvents, false)}</ul>
            </div>

            {/* This Week */}
            <div className="mb-5">
                <p className="font-semibold text-gray-700 mb-1">
                    This Week{" "}
                    <span className="text-gray-500 font-normal">
                        ({format(weekStart, "MMM d")} – {format(weekEnd, "MMM d")})
                    </span>
                </p>
                <ul className="pl-4 list-disc">{renderList(weekEvents, true)}</ul>
            </div>

            {/* This Month */}
            <div>
                <p className="font-semibold text-gray-700 mb-1">
                    This Month{" "}
                    <span className="text-gray-500 font-normal">
                        ({format(monthStart, "MMM d")} – {format(monthEnd, "MMM d")})
                    </span>
                </p>
                <ul className="pl-4 list-disc">{renderList(monthEvents, true)}</ul>
            </div>
        </div>
    );
}
