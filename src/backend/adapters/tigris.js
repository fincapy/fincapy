const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

class TigrisAdapter {
  constructor({ client }) {
    this.client = client;
  }

  async put({ bucket, key, body }) {
    const objectParams = {
      Bucket: bucket,
      Key: key, // File name in the bucket
      Body: body, // File content
    };
    await this.client.send(new PutObjectCommand(objectParams));
  }

  async get({ bucket, key }) {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await this.client.send(command);

      // Convert stream to buffer
      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        });

      return await streamToBuffer(response.Body);
    } catch (err) {
      if (err.name === 'NoSuchKey') {
        console.error(`Object "${key}" not found in bucket "${bucketName}".`);
      } else {
        console.error('An error occurred while retrieving the object:', err);
      }
      return null; // Return null to indicate missing object
    }
  }
}

const s3client = new S3Client({
  endpoint: 'http://minio:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
});

export { TigrisAdapter, s3client };
