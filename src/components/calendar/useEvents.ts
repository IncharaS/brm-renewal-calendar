"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { toDate } from "./utils";

export type CalendarEvent = {
    id: number | string;
    title: string;
    eventDate: string;
    kind?: "notice" | "term_end" | "info" | string;
    agreement: string;
    fileKey?: string;
    isDone?: boolean;
    vendor: string;
};

export function useEvents() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const res = await axios.get("/api/events", { withCredentials: true });
            const data = Array.isArray(res.data) ? res.data : [];
            const normalized = data
                .filter((e) => !!e && !!e.eventDate)
                .map((e: CalendarEvent) => ({
                    ...e,
                    kind: e.kind === "notice" ? "notice" : "term_end",
                }))
                .sort((a, b) => toDate(a.eventDate).getTime() - toDate(b.eventDate).getTime());
            setEvents(normalized);
        } catch (err) {
            console.error("Error fetching events:", err);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchEvents();
    }, []);

    return { events, loading, fetchEvents };
}
