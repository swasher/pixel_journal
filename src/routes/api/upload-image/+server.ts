
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '$env/static/private';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

export const POST: RequestHandler = async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
        throw error(400, 'No image file found');
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());

        const uploadStream = (bufferToUpload: Buffer): Promise<any> => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'pixel-journal-markdown',
                        use_filename: true
                    },
                    (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(result);
                    }
                );
                stream.end(bufferToUpload);
            });
        };

        const result = await uploadStream(buffer);

        if (!result || !result.secure_url) {
             throw error(500, 'Cloudinary upload failed');
        }

        return json({ url: result.secure_url });

    } catch (err) {
        console.error('Error uploading to Cloudinary:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        throw error(500, `Image upload failed: ${errorMessage}`);
    }
};
