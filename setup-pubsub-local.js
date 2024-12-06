const { PubSub } = require('@google-cloud/pubsub');

const projectId = process.env.PUBSUB_PROJECT_ID;
const pubSubClient = new PubSub({ projectId });

const setupPlaidItemCreatedTopicAndSubscription = async () => {
  let topic = null;
  try {
    const [new_topic] = await pubSubClient.createTopic('plaid-item-created');
    topic = new_topic;
  } catch (err) {
    topic = await pubSubClient.topic('plaid-item-created');
  }

  const pushConfig = {
    pushConfig: {
      pushEndpoint:
        'http://nextjs:3000/api/message-handlers/setup-transaction-ingest', // Your webhook endpoint
    },
  };
  try {
    await topic.createSubscription('plaid-item-created', pushConfig);
  } catch (err) {}
};

const setupTransactionCreatedTopicAndSubscription = async () => {
  let topic = null;
  try {
    const [new_topic] = await pubSubClient.createTopic('transaction-created');
    topic = new_topic;
  } catch (err) {
    topic = await pubSubClient.topic('transaction-created');
  }

  const pushConfig = {
    pushConfig: {
      pushEndpoint:
        'http://nextjs:3000/api/message-handlers/create-transaction', // Your webhook endpoint
    },
  };
  try {
    await topic.createSubscription('transaction-created', pushConfig);
  } catch (err) {}
};

const setupTransactionUpdatedTopicAndSubscription = async () => {
  let topic = null;
  try {
    const [new_topic] = await pubSubClient.createTopic('transaction-updated');
    topic = new_topic;
  } catch (err) {
    topic = await pubSubClient.topic('transaction-updated');
  }
};

const setupTransactionDeletedTopicAndSubscription = async () => {
  let topic = null;
  try {
    const [new_topic] = await pubSubClient.createTopic('transaction-deleted');
    topic = new_topic;
  } catch (err) {
    topic = await pubSubClient.topic('transaction-deleted');
  }
};

setupPlaidItemCreatedTopicAndSubscription();
setupTransactionCreatedTopicAndSubscription();
setupTransactionUpdatedTopicAndSubscription();
setupTransactionDeletedTopicAndSubscription();
