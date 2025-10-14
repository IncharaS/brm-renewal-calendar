"use client";
import React from "react";
import { Filter, RefreshCcw, List, BarChart3 } from "lucide-react";

export default function CalendarFilters({
    vendorFilter,
    setVendorFilter,
    vendors,
    typeFilter,
    setTypeFilter,
    viewMode,
    setViewMode,
}: any) {
    return (
        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
            {/* Vendor */}
            <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                    className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-400"
                >
                    {vendors.map((v: string) => (
                        <option key={v} value={v}>
                            {v}
                        </option>
                    ))}
                </select>
            </div>

            {/* Type */}
            <div className="flex items-center gap-2">
                <RefreshCcw className="w-5 h-5 text-gray-600" />
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-400"
                >
                    <option>All</option>
                    <option>Renewal</option>
                    <option>Notice</option>
                </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 ml-2">
                <button
                    onClick={() => setViewMode("List")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${viewMode === "List"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700"
                        }`}
                >
                    <List className="w-4 h-4" /> List
                </button>
                <button
                    onClick={() => setViewMode("Chart")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${viewMode === "Chart"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700"
                        }`}
                >
                    <BarChart3 className="w-4 h-4" /> Gantt
                </button>
            </div>
        </div>
    );
}
