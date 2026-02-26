const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const fs = require('fs');
const path = require('path');

const s3 = new S3Client({});
const sns = new SNSClient({});

const PROCESSED_BUCKET = process.env.PROCESSED_BUCKET;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
    console.log('Ebook converter triggered:', JSON.stringify(event));

    for (const record of event.Records) {
        const body = JSON.parse(record.body);
        const s3Event = body.Records?.[0];
        if (!s3Event) continue;

        const bucket = s3Event.s3.bucket.name;
        const key = decodeURIComponent(s3Event.s3.object.key.replace(/\+/g, ' '));
        const filename = path.basename(key, path.extname(key));
        const ext = path.extname(key).toLowerCase();

        console.log(`Processing ebook: ${bucket}/${key}`);

        try {
            // Download from S3
            const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
            const response = await s3.send(getCmd);
            const chunks = [];
            for await (const chunk of response.Body) {
                chunks.push(chunk);
            }
            const fileBuffer = Buffer.concat(chunks);

            // Generate metadata JSON for the ebook
            const metadata = {
                originalFilename: path.basename(key),
                format: ext.replace('.', ''),
                size: fileBuffer.length,
                processedAt: new Date().toISOString(),
                title: filename.replace(/[-_]/g, ' '),
            };

            // Upload original to processed bucket (organized)
            const processedKey = `ebooks/${filename}${ext}`;
            await s3.send(new PutObjectCommand({
                Bucket: PROCESSED_BUCKET,
                Key: processedKey,
                Body: fileBuffer,
                ContentType: getContentType(ext),
            }));

            // Upload metadata
            const metadataKey = `ebooks/${filename}.json`;
            await s3.send(new PutObjectCommand({
                Bucket: PROCESSED_BUCKET,
                Key: metadataKey,
                Body: JSON.stringify(metadata, null, 2),
                ContentType: 'application/json',
            }));

            console.log(`Uploaded processed ebook: ${processedKey}`);

            // Notify via SNS
            await sns.send(new PublishCommand({
                TopicArn: SNS_TOPIC_ARN,
                Message: JSON.stringify({
                    type: 'EBOOK_PROCESSED',
                    originalKey: key,
                    processedKey,
                    metadataKey,
                    bucket: PROCESSED_BUCKET,
                    metadata,
                    timestamp: new Date().toISOString(),
                }),
                Subject: 'Ebook Processing Complete',
            }));

            console.log('Processing complete, notification sent.');

        } catch (error) {
            console.error('Error processing ebook:', error);
            throw error;
        }
    }

    return { statusCode: 200, body: 'Ebook processing complete' };
};

function getContentType(ext) {
    const types = {
        '.pdf': 'application/pdf',
        '.epub': 'application/epub+zip',
        '.mobi': 'application/x-mobipocket-ebook',
        '.txt': 'text/plain',
    };
    return types[ext] || 'application/octet-stream';
}
