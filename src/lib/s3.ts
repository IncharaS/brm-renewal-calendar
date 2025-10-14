import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_ACCESS_SECRET_KEY!,
    },
});

export async function uploadToS3(file: File) {
    try {
        const fileKey =
            "uploads/" + Date.now().toString() + file.name.replace(/\s+/g, "-");

        const arrayBuffer = await file.arrayBuffer();

        const command = new PutObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: fileKey,
            Body: Buffer.from(arrayBuffer),
            ContentType: file.type || "application/octet-stream",
        });

        await s3Client.send(command);
        console.log(" Successfully uploaded to S3:", fileKey);

        return {
            file_key: fileKey,
            file_name: file.name,
        };
    } catch (error) {
        console.error(" S3 Upload Error:", error);
        throw error;
    }
}

export function getS3Url(fileKey: string) {
    return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.us-east-1.amazonaws.com/${fileKey}`;
}
