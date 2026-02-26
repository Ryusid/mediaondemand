const http = require('http');

exports.handler = async (event) => {
    console.log('Status updater triggered:', JSON.stringify(event));

    for (const record of event.Records) {
        try {
            const snsMessage = JSON.parse(record.Sns.Message);
            console.log('Processing SNS message:', snsMessage);

            const { originalKey, processedKey, duration, metadata } = snsMessage;

            // Map SNS message to Catalog API status update
            const updatePayload = JSON.stringify({
                s3_key: originalKey,
                status: 'ready',
                processed_s3_key: processedKey,
                duration: duration || metadata?.duration || 0,
                format: metadata?.format || 'unknown'
            });

            // Parse URL
            const apiUrl = new URL(`${process.env.API_URL}/api/catalog/status/update`);

            const options = {
                hostname: apiUrl.hostname,
                port: apiUrl.port || 80,
                path: apiUrl.pathname,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(updatePayload),
                    'x-internal-secret': process.env.INTERNAL_SECRET
                }
            };

            console.log(`Calling Catalog API at: ${options.hostname}:${options.port}${options.path}`);

            await new Promise((resolve, reject) => {
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        console.log('Catalog API response:', res.statusCode, data);
                        resolve();
                    });
                });

                req.on('error', (e) => {
                    console.error(`Problem with request: ${e.message}`);
                    reject(e);
                });

                req.write(updatePayload);
                req.end();
            });

        } catch (error) {
            console.error('Error processing SNS record:', error);
            // Don't throw to avoid infinite retries
        }
    }

    return { statusCode: 200, body: 'Callback processed' };
};
