const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
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
    if (etag) {
      objectParams.IfMatch = etag.replace('"', '');
    }
    await this.client.send(new PutObjectCommand(objectParams));
  }

  async list({ bucket }) {
    let objectMetadata = [];
    let continuationToken = undefined;
    try {
      do {
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
        });
        const response = await this.client.send(command);
        if (response.Contents) {
          objectMetadata = objectMetadata.concat(response.Contents);
        }
        continuationToken = response.NextContinuationToken;
      } while (continuationToken);
      return objectMetadata;
    } catch (error) {
      console.error('Error listing objects:', error);
      throw error;
    }
  }

  async get({ bucket, key }) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      console.time('getObject');
      const response = await this.client.send(command);
      console.timeEnd('getObject');

      // Convert stream to buffer
      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        });

      console.time('streamToBuffer');
      const obj = await streamToBuffer(response.Body);
      console.timeEnd('streamToBuffer');
      const etag = response.ETag;
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

s3client.middlewareStack.add(
  (next, context) => async (args) => {
    args.request.headers['Cache-Control'] = 'no-cache';
    const result = await next(args);
    return result;
  },
  {
    step: 'build',
    name: 'addTigrisHeader',
    tags: ['HEADER', 'TIGRIS'],
  }
);

export { TigrisAdapter, s3client };
