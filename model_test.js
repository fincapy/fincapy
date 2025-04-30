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

  console.log(uniqueTransactionEdits);

  const createPrompt = () => {
    return `
        Follow these rules:
        1. Valid types: 
            1a. "spending": a negative (-) amount
            1b. "transfer": a negative (-) amount
            1c. "credit_card_payment": a positive (+) amount
            1d. "refund": a positive (+) amount
            1e. "income": a positive (+) amount
        2. "refund" types must use the same category as if they were "spending" types.
        3. The most recent edit's user_override_category with a description relevant to the transaction should be used.
    
        Past edits from least recent to most recent:
        ${JSON.stringify(transactionEdits, null, 2)}

        Transaction details:
        Amount: +23.59
        Description: Shell
    `;
  };

  const prompt = createPrompt();

  // Format for Bedrock Converse API
  const requestBody = {
    modelId: 'us.meta.llama4-maverick-17b-instruct-v1:0',
    system: [
      {
        text: 'You are a transaction categorizer. Always call the "categorize_transaction" tool with the correct parameters.',
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
                  type: {
                    type: 'string',
                    description:
                      'Type of the transaction. "refund", "income", and "credit_card_payment" will be positive (+) amounts. "spending" and "transfer" will be negative (-) amounts.',
                    enum: [
                      'spending',
                      'transfer',
                      'credit_card_payment',
                      'refund',
                      'income',
                    ],
                  },
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
                required: ['transaction_type', 'transaction_category'],
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
  let toolCall = response.output.message.content[0].toolUse.input;
  let rawOutput = response.output.message.content[0];
  const { inputTokens, outputTokens, totalTokens } = response.usage;

  console.log(toolCall);
  console.log(rawOutput);
  console.log(`Input Tokens: ${inputTokens}`);
  console.log(`Output Tokens: ${outputTokens}`);
  console.log(`Total Tokens: ${totalTokens}`);
}

main();
