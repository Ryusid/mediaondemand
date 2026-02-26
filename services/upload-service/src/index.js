const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'upload-service';
const S3_RAW_BUCKET = process.env.S3_RAW_BUCKET;

const s3 = new S3Client({ region: process.env.AWS_REGION || 'eu-west-1' });

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: SERVICE_NAME });
});

// Generate presigned URL for uploading a video
app.post('/api/upload/video', async (req, res) => {
    try {
        const { filename, contentType } = req.body;
        if (!filename) return res.status(400).json({ error: 'filename is required' });

        const key = `videos/${Date.now()}-${filename}`;
        const command = new PutObjectCommand({
            Bucket: S3_RAW_BUCKET,
            Key: key,
            ContentType: contentType || 'video/mp4',
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.json({ uploadUrl, key, bucket: S3_RAW_BUCKET, expiresIn: 3600 });
    } catch (error) {
        console.error('Error generating upload URL:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate presigned URL for uploading an ebook
app.post('/api/upload/ebook', async (req, res) => {
    try {
        const { filename, contentType } = req.body;
        if (!filename) return res.status(400).json({ error: 'filename is required' });

        const key = `ebooks/${Date.now()}-${filename}`;
        const command = new PutObjectCommand({
            Bucket: S3_RAW_BUCKET,
            Key: key,
            ContentType: contentType || 'application/pdf',
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.json({ uploadUrl, key, bucket: S3_RAW_BUCKET, expiresIn: 3600 });
    } catch (error) {
        console.error('Error generating upload URL:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Running on port ${PORT}`);
});
