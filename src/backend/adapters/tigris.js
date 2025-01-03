const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

class TigrisAdapter {
  constructor({ client }) {
    this.client = client;
  }

  async put({ bucket, key, body, etag }) {
    const objectParams = {
      Bucket: bucket,
      Key: key,
      Body: body,
    };
    console.log('put etag', etag);
    if (etag) {
      objectParams.IfMatch = etag;
    }
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

      const obj = await streamToBuffer(response.Body);
      const etag = response.ETag;
      console.log('get etag', etag);
      return [obj, etag];
    } catch (err) {
      if (err.name === 'NoSuchKey') {
      } else {
        throw err;
      }
      return null;
    }
  }
}

const s3client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export { TigrisAdapter, s3client };
