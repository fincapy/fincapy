import {
  BedrockRuntimeClient,
  ConverseCommand,
  SystemContentBlock,
} from '@aws-sdk/client-bedrock-runtime';

async function main() {
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
        Follow this rule:
        1. The most recent edit's user_override_category with a description relevant to the transaction should be used.

        Past edits from least recent to most recent:
        [
          { "date": "2025-01-01", "original_description": "Whole Foods", "original_category": "spending.fixed_costs", "user_override_category": "spending.fixed_costs.groceries" },
          { "date": "2025-01-02", "original_description": "Whole Foods", "original_category": "spending.fixed_costs.groceries", "user_override_category": "spending.guilt_free_spending.fun_budget" },
          { "date": "2025-01-03", "original_description": "ConocoPhillips", "original_category": "spending.fixed_costs.gas", "user_override_category": "spending.guilt_free_spending.fun_budget" },
        ]

        Transaction:
        - Amount: 29.99
        - Description: Shell
        - Plaid Suggested Category: TRANSPORTATION_GAS
    `;
  };

  const prompt = createPrompt();

  // Format for Bedrock Converse API
  const requestBody = {
    modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    system: [
      {
        text: 'You are a transaction categorizer. Always call the "categorize_transaction" tool with the correct parameters. Be succint in your reasoning.',
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
      temperature: 0,
      topP: 1,
    },
    thinking: {
      type: 'disabled',
      // budgetTokens: 1024,
    },
    toolConfig: {
      tools: [
        {
          toolSpec: {
            name: 'categorize_transaction',
            description:
              'Categorize a transaction given a transaction and a list of past user edits',
            inputSchema: {
              json: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    description: 'The category of the transaction.',
                    enum: [
                      'none',
                      'spending.uncategorized',
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
                      'income.uncategorized',
                      'income.uplight_paycheck',
                      'income.habitat_paycheck',
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

main();
