import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

@Injectable()
export class MediaService {
    private s3Client: S3Client;
    private bucketName: string;
    private region: string;

    constructor(private readonly configService: ConfigService) {
        this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || '';
        this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';

        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

        // Initialize S3 Client
        // Note: In AWS App Runner, if accessKeyId/secretAccessKey are not provided,
        // it will automatically attempt to use the IAM Role assigned to the service.
        this.s3Client = new S3Client({
            region: this.region,
            credentials: accessKeyId && secretAccessKey ? {
                accessKeyId,
                secretAccessKey,
            } : undefined,
        });

        if (!this.bucketName) {
            console.warn('AWS_S3_BUCKET not set in environment. Image uploads will fail.');
        }
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<{
        large: string;
        medium: string;
        thumbnail: string
    }> {
        if (!this.bucketName) {
            throw new BadRequestException('AWS S3 bucket is not configured.');
        }

        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const fileId = randomUUID();
        const paths = {
            large: `${folder}/${fileId}-large.webp`,
            medium: `${folder}/${fileId}-medium.webp`,
            thumbnail: `${folder}/${fileId}-thumb.webp`,
        };

        try {
            // 1. Large (Main/Zoom): 1200px - Preserves aspect ratio
            const largeBuffer = await sharp(file.buffer)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            // 2. Medium (Product Detail): 800px - Preserves aspect ratio
            const mediumBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            // 3. Small (Grid/Carousel): 400x400 - Square Crop for uniform GridView
            const thumbBuffer = await sharp(file.buffer)
                .resize(400, 400, { fit: 'cover' })
                .webp({ quality: 75 })
                .toBuffer();

            // Upload all versions in parallel
            const uploadPromises = [
                this.uploadToS3(paths.large, largeBuffer),
                this.uploadToS3(paths.medium, mediumBuffer),
                this.uploadToS3(paths.thumbnail, thumbBuffer),
            ];

            await Promise.all(uploadPromises);

            const baseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
            return {
                large: `${baseUrl}/${paths.large}`,
                medium: `${baseUrl}/${paths.medium}`,
                thumbnail: `${baseUrl}/${paths.thumbnail}`,
            };
        } catch (error: any) {
            throw new BadRequestException(`Multi-tier S3 Upload failed: ${error.message}`);
        }
    }

    private async uploadToS3(key: string, body: Buffer): Promise<void> {
        const upload = new Upload({
            client: this.s3Client,
            params: {
                Bucket: this.bucketName,
                Key: key,
                Body: body,
                ContentType: 'image/webp',
                ACL: 'public-read',
            },
        });
        await upload.done();
    }

    async deleteFile(fileUrl: string): Promise<void> {
        if (!this.bucketName) return;

        try {
            // Extract the key from the URL
            // Expected format: https://bucket-name.s3.region.amazonaws.com/key
            const baseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/`;
            if (fileUrl.startsWith(baseUrl)) {
                const key = fileUrl.replace(baseUrl, '');

                await this.s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: this.bucketName,
                        Key: key,
                    })
                );
            }
        } catch (error: any) {
            console.error('Failed to delete file from S3:', error);
        }
    }
}
