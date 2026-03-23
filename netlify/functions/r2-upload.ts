import { Handler } from '@netlify/functions';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://5ccf085e7eefb5e7ac5645d5aebce37f.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = 'minka-creative';
const PUBLIC_URL = 'https://pub-904faae02f174edea92dc65656d7a3cb.r2.dev';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // DELETE souboru
  if (event.httpMethod === 'DELETE') {
    try {
      const { key } = JSON.parse(event.body || '{}');
      if (!key) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Chybí key' }) };

      await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } catch (err: any) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  // UPLOAD souboru
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { fileName, fileData, contentType } = body;

      if (!fileName || !fileData || !contentType) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Chybí fileName, fileData nebo contentType' }) };
      }

      // Dekóduj base64
      const buffer = Buffer.from(fileData, 'base64');

      // Unikátní key
      const key = `${Date.now()}_${fileName.replace(/\s+/g, '_').toLowerCase()}`;

      await R2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
      }));

      const publicUrl = `${PUBLIC_URL}/${key}`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, url: publicUrl, key }),
      };
    } catch (err: any) {
      console.error('R2 upload error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};
