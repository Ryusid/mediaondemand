const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const s3 = new S3Client({});
const sns = new SNSClient({});

const PROCESSED_BUCKET = process.env.PROCESSED_BUCKET;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
  console.log('Video transcoder triggered:', JSON.stringify(event));

  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const s3Event = body.Records?.[0];
    if (!s3Event) continue;

    const bucket = s3Event.s3.bucket.name;
    const key = decodeURIComponent(s3Event.s3.object.key.replace(/\+/g, ' '));
    const filename = path.basename(key, path.extname(key));

    console.log(`Processing video: ${bucket}/${key}`);

    const tmpInput = `/tmp/input${path.extname(key)}`;
    const tmpOutput = `/tmp/${filename}.mp4`;

    try {
      // Download from S3
      const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await s3.send(getCmd);
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      fs.writeFileSync(tmpInput, Buffer.concat(chunks));

      // Transcode with FFmpeg (basic H.264 encoding)
      console.log('Starting FFmpeg transcoding...');
      execSync(
        `ffmpeg -i ${tmpInput} -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 128k -movflags +faststart -y ${tmpOutput}`,
        { stdio: 'inherit', timeout: 840000 } // 14 min timeout
      );

      // Upload processed file to S3
      const processedKey = `videos/${filename}.mp4`;
      const putCmd = new PutObjectCommand({
        Bucket: PROCESSED_BUCKET,
        Key: processedKey,
        Body: fs.readFileSync(tmpOutput),
        ContentType: 'video/mp4',
      });
      await s3.send(putCmd);
      console.log(`Uploaded processed video: ${processedKey}`);

      // Notify via SNS
      await sns.send(new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Message: JSON.stringify({
          type: 'VIDEO_PROCESSED',
          originalKey: key,
          processedKey,
          bucket: PROCESSED_BUCKET,
          timestamp: new Date().toISOString(),
        }),
        Subject: 'Video Processing Complete',
      }));

      console.log('Processing complete, notification sent.');

    } catch (error) {
      console.error('Error processing video:', error);
      throw error;
    } finally {
      // Cleanup temp files
      [tmpInput, tmpOutput].forEach(f => {
        try { fs.unlinkSync(f); } catch (e) { /* ignore */ }
      });
    }
  }

  return { statusCode: 200, body: 'Video processing complete' };
};
