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
      ackDeadlineSeconds: 60,
      pushEndpoint:
        'http://nextjs:3000/api/message-handlers/ingest-transaction-updates', // Your webhook endpoint
    },
  };
  try {
    await topic.createSubscription('plaid-item-created', pushConfig);
  } catch (err) {}
};

const setupPlaidItemUpdatedTopicAndSubscription = async () => {
  let topic = null;
  try {
    const [new_topic] = await pubSubClient.createTopic('plaid-item-updated');
    topic = new_topic;
  } catch (err) {
    topic = await pubSubClient.topic('plaid-item-updated');
  }

  const pushConfig = {
    pushConfig: {
      ackDeadlineSeconds: 60,
      pushEndpoint:
        'http://nextjs:3000/api/message-handlers/ingest-transaction-updates', // Your webhook endpoint
    },
  };
  try {
    await topic.createSubscription('plaid-item-updated', pushConfig);
  } catch (err) {}
};

const setupTransactionIngestRequestedTopicAndSubscription = async () => {
  let topic = null;
  try {
    const [new_topic] = await pubSubClient.createTopic(
      'transaction-ingest-requested'
    );
    topic = new_topic;
  } catch (err) {
    topic = await pubSubClient.topic('transaction-ingest-requested');
  }

  const pushConfig = {
    pushConfig: {
      ackDeadlineSeconds: 60,
      pushEndpoint:
        'http://nextjs:3000/api/message-handlers/ingest-transaction-updates', // Your webhook endpoint
    },
  };
  try {
    await topic.createSubscription('transaction-ingest-requested', pushConfig);
  } catch (err) {}
};

setupPlaidItemCreatedTopicAndSubscription();
setupPlaidItemUpdatedTopicAndSubscription();
setupTransactionIngestRequestedTopicAndSubscription();
