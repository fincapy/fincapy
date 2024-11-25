import { PubSub } from '@google-cloud/pubsub';

const projectId = process.env.PUBSUB_PROJECT_ID;
const pubSubClient = new PubSub({ projectId });

class PubSubAdapter {
  constructor(client) {
    this.client = client;
  }

  async publish({ topicName, data }) {
    const topic = this.client.topic(topicName);
    await topic.publishMessage({
      data: Buffer.from(JSON.stringify(data)),
    });
    console.log('message sent!');
  }
}

export { PubSubAdapter, pubSubClient };
