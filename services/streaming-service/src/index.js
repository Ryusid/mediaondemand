const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'streaming-service';
const S3_PROCESSED_BUCKET = process.env.S3_PROCESSED_BUCKET;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

const s3 = new S3Client({ region: process.env.AWS_REGION || 'eu-west-1' });

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: SERVICE_NAME });
});

// Get a streaming/download URL for a video
app.get('/api/stream/video/:key(*)', async (req, res) => {
    try {
        const key = req.params.key;

        // If CloudFront is configured, return CloudFront URL
        if (CLOUDFRONT_DOMAIN) {
            const cfUrl = `https://${CLOUDFRONT_DOMAIN}/${key}`;
            return res.json({ url: cfUrl, type: 'cloudfront', expiresIn: null });
        }

        // Fallback: S3 presigned URL
        const command = new GetObjectCommand({
            Bucket: S3_PROCESSED_BUCKET,
            Key: key,
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.json({ url, type: 's3-presigned', expiresIn: 3600 });
    } catch (error) {
        console.error('Error generating stream URL:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a download URL for an ebook
app.get('/api/stream/ebook/:key(*)', async (req, res) => {
    try {
        const key = req.params.key;

        if (CLOUDFRONT_DOMAIN) {
            const cfUrl = `https://${CLOUDFRONT_DOMAIN}/${key}`;
            return res.json({ url: cfUrl, type: 'cloudfront' });
        }

        const command = new GetObjectCommand({
            Bucket: S3_PROCESSED_BUCKET,
            Key: key,
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.json({ url, type: 's3-presigned', expiresIn: 3600 });
    } catch (error) {
        console.error('Error generating download URL:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Running on port ${PORT}`);
});
