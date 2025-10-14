"use client";

import React, { useState } from "react";
import {
    format,
    addMonths,
    differenceInMonths,
    startOfYear,
    endOfYear,
    getYear,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type TimelineItem = {
    id: string | number;
    title: string;
    start: Date;
    end: Date;
    kind?: "notice" | "term_end" | "info" | string;
    vendor?: string;
    products?: string[];
};

export default function TimelineView({ items }: { items: TimelineItem[] }) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

    if (!items?.length)
        return (
            <div className="text-center py-10 text-gray-500">
                <p>No timeline data available</p>
            </div>
        );

    //  Step 1: Split cross-year items (keep real start/end)
    const splitItems: (TimelineItem & {
        continuesPrev?: boolean;
        continuesNext?: boolean;
    })[] = [];

    for (const item of items) {
        const startYear = getYear(item.start);
        const endYear = getYear(item.end);

        if (startYear === endYear) {
            splitItems.push({ ...item });
        } else {
            for (let y = startYear; y <= endYear; y++) {
                const sliceStart =
                    y === startYear ? item.start : startOfYear(new Date(y, 0, 1));
                const sliceEnd =
                    y === endYear ? item.end : endOfYear(new Date(y, 11, 31));
                splitItems.push({
                    ...item,
                    start: sliceStart,
                    end: sliceEnd,
                    continuesPrev: y !== startYear,
                    continuesNext: y !== endYear,
                });
            }
        }
    }

    // Step 2: Group by year
    const grouped: Record<number, typeof splitItems> = {};
    splitItems.forEach((i) => {
        const y = getYear(i.start);
        grouped[y] = grouped[y] ? [...grouped[y], i] : [i];
    });

    const toggleYear = (y: number) =>
        setExpandedYears((prev) => ({ ...prev, [y]: !prev[y] }));

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2 mb-5">
                <span>📆</span> Renewal Timeline
            </h2>

            {/* Legend */}
            <div className="flex gap-6 mb-8 text-sm">
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    Renewal
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400" />
                    Notice
                </div>
            </div>

            {/* Year Sections */}
            {Object.keys(grouped)
                .sort()
                .map((yr) => {
                    const year = parseInt(yr);
                    const yearItems = grouped[year];

                    const minDate = startOfYear(new Date(year, 0, 1));
                    const maxDate = endOfYear(new Date(year, 11, 31));
                    const totalDays =
                        (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                    const months = differenceInMonths(maxDate, minDate) + 1;
                    const monthLabels = Array.from({ length: months }, (_, i) =>
                        addMonths(minDate, i)
                    );

                    return (
                        <div
                            key={year}
                            className="rounded-xl border border-gray-200 mb-8 overflow-hidden shadow-sm"
                        >
                            <button
                                onClick={() => toggleYear(year)}
                                className="w-full flex justify-between items-center px-6 py-3 bg-gray-50 hover:bg-gray-100 transition"
                            >
                                <span className="text-lg font-semibold text-gray-800">
                                    {year}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {expandedYears[year] ? "▲ Collapse" : "▼ Expand"}
                                </span>
                            </button>

                            <AnimatePresence>
                                {expandedYears[year] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden bg-white p-6"
                                    >
                                        {/* Month header */}
                                        <div className="flex justify-between text-xs font-semibold text-gray-600 border-b border-gray-200 pb-2 mb-4">
                                            {monthLabels.map((m, i) => (
                                                <div key={i} className="flex-1 text-center">
                                                    {format(m, "MMM")}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Bars */}
                                        <div className="relative flex flex-col gap-5">
                                            {yearItems
                                                .filter((item) => item.kind !== "info") // ✅ ignore info items
                                                .map((item) => {
                                                    const startDays =
                                                        (item.start.getTime() - minDate.getTime()) /
                                                        (1000 * 60 * 60 * 24);
                                                    const endDays =
                                                        (item.end.getTime() - minDate.getTime()) /
                                                        (1000 * 60 * 60 * 24);
                                                    const left = Math.max((startDays / totalDays) * 100, 0);
                                                    const width = Math.min(
                                                        ((endDays - startDays) / totalDays) * 100,
                                                        100 - left
                                                    );

                                                    const color =
                                                        item.kind === "notice"
                                                            ? "bg-gradient-to-r from-yellow-400 to-orange-400"
                                                            : "bg-gradient-to-r from-blue-500 to-indigo-500";

                                                    const borderRadiusStyle = {
                                                        borderTopLeftRadius: item.continuesPrev ? 0 : "9999px",
                                                        borderBottomLeftRadius: item.continuesPrev ? 0 : "9999px",
                                                        borderTopRightRadius: item.continuesNext ? 0 : "9999px",
                                                        borderBottomRightRadius: item.continuesNext ? 0 : "9999px",
                                                    };

                                                    return (
                                                        <motion.div
                                                            key={`${item.id}-${year}`}
                                                            whileHover={{ scale: 1.04 }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 200,
                                                                damping: 15,
                                                            }}
                                                            className={`relative h-10 ${color} text-black text-xs font-semibold flex items-center justify-center shadow-md cursor-pointer`}
                                                            style={{
                                                                left: `${left}%`,
                                                                width: `${width}%`,
                                                                ...borderRadiusStyle,
                                                            }}
                                                            onMouseEnter={() => setHovered(item.id.toString())}
                                                            onMouseLeave={() => setHovered(null)}
                                                        >


                                                            <div className="text-center leading-tight px-2">
                                                                <p className="text-[11px] font-semibold">
                                                                    {item.title}
                                                                </p>
                                                                {item.vendor && (
                                                                    <p className="text-[10px] font-medium opacity-90">
                                                                        {item.vendor}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Tooltip */}
                                                            <AnimatePresence>
                                                                {hovered === item.id.toString() && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: 10 }}
                                                                        className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-md shadow-md whitespace-nowrap z-10"
                                                                    >
                                                                        <p className="font-semibold">{item.title}</p>
                                                                        {item.vendor && (
                                                                            <p className="text-gray-300">
                                                                                Vendor: {item.vendor}
                                                                            </p>
                                                                        )}
                                                                        <p>
                                                                            {format(item.start, "MMM d, yyyy")} →{" "}
                                                                            {format(item.end, "MMM d, yyyy")}
                                                                        </p>
                                                                        <p className="text-[11px] font-medium">
                                                                            {item.vendor}
                                                                            {item.products?.length ? ` — ${item.products.slice(0, 1).join(", ")}${item.products.length > 1 ? "…" : ""}` : ""}
                                                                        </p>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </motion.div>
                                                    );
                                                })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
        </div>
    );
}