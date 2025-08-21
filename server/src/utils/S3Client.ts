import { S3Client } from "@aws-sdk/client-s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client with Supabase S3 configuration


export const s3Client = new S3Client({
    region: process.env.SUPABASE_S3_REGION,
    endpoint: process.env.SUPABASE_S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY ?? "",
    },
    forcePathStyle: true, // Required for Supabase S3 compatibility
});

// Function to upload a file to Supabase S3
export async function uploadFileToS3(bucketName: string, fileName: string, fileContent: Buffer | Uint8Array | Blob, contentType?: string) {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent,
        ContentType: contentType || 'application/octet-stream'
    });

    try {
        const response = await s3Client.send(command);
        console.log("File uploaded successfully:", response);
        return response;
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw error;
    }
}


//get file from S3
export async function getFileFromS3(bucketName: string, fileName: string) {
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
    });

    try {
        const response = await s3Client.send(command);
        console.log("File retrieved successfully:", response);
        return response;
    } catch (error) {
        console.error("Error retrieving file from S3:", error);
        throw error;
    }
}

//delete file from S3
export async function deleteFileFromS3(bucketName: string, fileName: string) {
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
    });

    try {
        const response = await s3Client.send(command);
        console.log("File deleted successfully:", response);
        return response;
    } catch (error) {
        console.error("Error deleting file from S3:", error);
        throw error;
    }
}

