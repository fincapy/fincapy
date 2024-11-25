import { PubSub } from '@google-cloud/pubsub';

const projectId = process.env.PUBSUB_PROJECT_ID;
const pubSubClient = new PubSub({ projectId });

const setupTopicsAndSubscriptions = async () => {
  let topic = null;
  try {
    const [new_topic] = await pubSubClient.createTopic(
      'transactions-new-customer'
    );
    topic = new_topic;
  } catch (err) {
    topic = await pubSubClient.topic('transactions-new-customer');
  }

  const pushConfig = {
    pushConfig: {
      pushEndpoint: 'http://nextjs:3000/api/webhook', // Your webhook endpoint
    },
  };
  try {
    await topic.createSubscription('setup-new-customer', pushConfig);
  } catch (err) {}
};

setupTopicsAndSubscriptions();
