"use client";
import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";

export interface MiniCalendarProps {
    selectedDate: Date;
    onChange: (date: Date) => void;
    onActiveMonthChange?: (date: Date) => void;
}

export default function MiniCalendar({
    selectedDate,
    onChange,
    onActiveMonthChange,
}: MiniCalendarProps) {
    return (
        <div className="bg-white border rounded-2xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                Monthly View
            </h3>

            <Calendar
                className="rounded-lg shadow-sm border border-gray-200 w-full"
                onChange={(date) => onChange(date as Date)}
                onActiveStartDateChange={({ activeStartDate }) =>
                    onActiveMonthChange?.(activeStartDate || new Date())
                } // triggers when month changes
                value={selectedDate}
                tileClassName={({ date }) =>
                    format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                        ? "bg-blue-500 text-white rounded-full"
                        : ""
                }
            />
        </div>
    );
}
