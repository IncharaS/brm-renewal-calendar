'use client';

import { uploadToS3 } from '@/lib/s3';
import { useMutation } from '@tanstack/react-query';
import { Inbox, Loader2, CalendarDays } from 'lucide-react';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const FileUpload = () => {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);

    // Send uploaded file info to /api/upload
    const { mutate, isPending } = useMutation({
        mutationFn: async ({
            file_key,
            file_name,
        }: {
            file_key: string;
            file_name: string;
        }) => {
            const response = await axios.post('/api/upload', { file_key, file_name });
            return response.data;
        },
    });

    const { getRootProps, getInputProps } = useDropzone({
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File too big (max 10MB)');
                return;
            }

            try {
                setUploading(true);
                const data = await uploadToS3(file);

                if (!data?.file_key || !data?.file_name) {
                    toast.error("Something went wrong while uploading to S3");
                    return;
                }

                mutate(data, {
                    onSuccess: () => {
                        toast.success('Agreement uploaded successfully!');
                        router.push('/calendar');
                    },
                    onError: (err) => {
                        console.error(err);
                        toast.error('Error processing agreement');
                    },
                });
            } catch (error) {
                console.error(error);
                toast.error('Upload failed');
            } finally {
                setUploading(false);
            }
        },
    });

    return (
        <div className="p-2 bg-white rounded-xl">
            <div
                {...getRootProps({
                    className:
                        'border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col',
                })}
            >
                <input {...getInputProps()} />

                {uploading || isPending ? (
                    <>
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                        <p className="mt-2 text-sm text-slate-400">
                            Processing contract details...
                        </p>
                    </>
                ) : (
                    <>
                        <Inbox className="w-10 h-10 text-blue-500" />
                        <>
                            <CalendarDays className="w-10 h-10 text-blue-500" />
                            <p className="mt-2 text-sm text-slate-400">
                                Drop your Purchase Agreement PDF here
                            </p>
                        </>

                    </>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
