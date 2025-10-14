"use client";

import React from "react";
import FileUpload from "@/components/FileUpload";

export default function UploadPage() {
    return (
        <div className="min-h-screen bg-gradient-to-r flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg text-center">
                <h1 className="text-3xl font-semibold mb-4 text-gray-800">Upload Agreement</h1>
                <p className="text-gray-600 mb-6">
                    Drop your purchase agreement PDF below to extract key renewal details.
                </p>
                <FileUpload />
            </div>
        </div>
    );
}
