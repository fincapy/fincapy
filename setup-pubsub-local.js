const { PubSub } = require('@google-cloud/pubsub');

const projectId = process.env.PUBSUB_PROJECT_ID;
const pubSubClient = new PubSub({ projectId });

const setupTopicsAndSubscriptions = async () => {
  let topic = null;
  try {
    const [new_topic] = await pubSubClient.createTopic('plaid-item-created');
    topic = new_topic;
  } catch (err) {
    topic = await pubSubClient.topic('plaid-item-created');
  }

  const pushConfig = {
    pushConfig: {
      pushEndpoint: 'http://nextjs:3000/api/webhook', // Your webhook endpoint
    },
  };
  try {
    await topic.createSubscription('plaid-item-created', pushConfig);
  } catch (err) {}
};

setupTopicsAndSubscriptions();
