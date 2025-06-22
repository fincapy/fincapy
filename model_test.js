import {
  BedrockRuntimeClient,
  ConverseCommand,
  SystemContentBlock,
} from '@aws-sdk/client-bedrock-runtime';

const transactionTypes = [
  'spending',
  'transfer',
  'credit_card_payment',
  'refund',
  'income',
];

async function main_categorize() {
  const transactionEdits = [];

  // filter the new transaction edits so that they have unique descriptions, but always take the most recent edit
  const uniqueTransactionEdits = transactionEdits
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort by date descending (newest first)
    .filter(
      (edit, index, self) =>
        self.findIndex((t) => t.description === edit.description) === index
    )
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const createPrompt = () => {
    return `
      Categorize this transaction based solely on its description. Using your knowledge of business names and merchant patterns:

      1. Identify the type of business or service (e.g., restaurant, gas station, retail store)
      2. Look for context clues in abbreviated names - common prefixes like SQ* (Square), PP* (PayPal), TST* (Toast), etc.
      3. For unclear descriptions, select the most likely category based on available information
      4. Be consistent - categorize similar business types the same way
      5. If completely uncertain, choose the most general applicable category

      Select the category that best matches the identified business type.

      Transaction Description: Servicemac
    `;
  };

  const prompt = createPrompt();

  // Format for Bedrock Converse API
  const requestBody = {
    modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
    system: [
      {
        text: 'Always call the "categorize_transaction" tool',
      },
    ],
    // additionalModelRequestFields: {
    //   reasoning_config: {
    //     type: 'enabled',
    //     budget_tokens: 1024,
    //   },
    // },
    messages: [
      {
        role: 'user',
        content: [
          {
            text: prompt,
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 3000,
      temperature: 1,
    },
    toolConfig: {
      tools: [
        {
          toolSpec: {
            name: 'categorize_transaction',
            description: 'Categorize the transaction',
            inputSchema: {
              json: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    description: 'The category of the transaction.',
                    enum: [
                      // 'none',
                      'spending.other',
                      'spending.fixed_costs',
                      'spending.guilt_free_spending',
                      'spending.student_loans',
                      'spending.fixed_costs.groceries',
                      'spending.fixed_costs.mortgage',
                      'spending.fixed_costs.dog_stuff',
                      'spending.fixed_costs.hoa',
                      'spending.fixed_costs.therapy',
                      'spending.fixed_costs.subscriptions',
                      'spending.fixed_costs.utilities',
                      'spending.fixed_costs.gas',
                      'spending.fixed_costs.insurance',
                      'spending.fixed_costs.wifi',
                      'spending.guilt_free_spending.restaurants',
                      'spending.guilt_free_spending.date_night',
                      'spending.guilt_free_spending.fun_budget',
                      // 'income.uncategorized',
                      // 'income.uplight_paycheck',
                      // 'income.habitat_paycheck',
                    ],
                  },
                },
                required: ['transaction_category'],
              },
            },
          },
        },
      ],
    },
  };

  const client = new BedrockRuntimeClient({ region: 'us-east-1' });
  const command = new ConverseCommand(requestBody);

  const response = await client.send(command);
  console.log('response', response.output.message);
  let toolCall = response.output.message.content[1].toolUse.input;
  let { inputTokens, outputTokens, totalTokens } = response.usage;

  console.log('original toolCall', toolCall);
  console.log(`Input Tokens: ${inputTokens}`);
  console.log(`Output Tokens: ${outputTokens}`);
  console.log(`Total Tokens: ${totalTokens}`);
}

async function main_type() {
  const transactionEdits = [];

  const createPrompt = () => {
    return `
        Follow these rules:
        1. The most recent edit's user_override_type with a description relevant to the transaction should be used.

        Past edits from least recent to most recent:

        Transaction:
        - Description: Servicemac
      `;
  };

  const prompt = createPrompt();

  // Format for Bedrock Converse API
  const requestBody = {
    modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
    system: [
      {
        text: 'You are a transaction type categorizer. Always call the "categorize_transaction_type" tool with the correct parameters. Think deeply through your reasoning step by step. Do not output any text. Do not explain your decision.',
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            text: prompt,
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 3000,
      temperature: 1,
    },
    additionalModelRequestFields: {
      reasoning_config: {
        type: 'enabled',
        budget_tokens: 1024,
      },
    },
    toolConfig: {
      tools: [
        {
          toolSpec: {
            name: 'categorize_transaction_type',
            description:
              'Categorize a transaction type given a transaction and a list of past user edits',
            inputSchema: {
              json: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    description: 'Type of the transaction.',
                    enum: transactionTypes,
                  },
                },
                required: ['type'],
              },
            },
          },
        },
      ],
    },
  };

  const client = new BedrockRuntimeClient({ region: 'us-east-1' });
  const command = new ConverseCommand(requestBody);

  const response = await client.send(command);
  console.log('response', response.output.message);
  let toolCall = response.output.message.content[1].toolUse.input;
  let { inputTokens, outputTokens, totalTokens } = response.usage;

  console.log('original toolCall', toolCall);
  console.log(`Input Tokens: ${inputTokens}`);
  console.log(`Output Tokens: ${outputTokens}`);
  console.log(`Total Tokens: ${totalTokens}`);
}

main_categorize();
main_type();
