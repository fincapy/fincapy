import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { transactionTypes } from '../domain/transaction.js';

// Rate limiter for Bedrock API calls
class RateLimiter {
  constructor(maxRequestsPerMinute) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.requestTimestamps = [];
  }

  async waitForPermission() {
    const now = Date.now();

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < 60000
    );

    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      // Calculate how long to wait
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestTimestamp);

      if (waitTime > 0) {
        console.log(
          `Rate limit reached. Waiting ${waitTime}ms before next request.`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // Add current timestamp and allow the request
    this.requestTimestamps.push(Date.now());
  }
}

class OpenaiAdapter {
  constructor() {
    this.rateLimiter = new RateLimiter(500); // Limit for requests per minute
  }

  async categorizeTransaction({
    categoryIdToNameMap,
    transactionEdits,
    transactionAmount,
    transactionCategory,
    transactionCategoryConfidenceLevel,
    transactionMerchantName,
    transactionOriginalDescription,
    transactionAccountType,
    transactionSubAccountType,
  }) {
    // multiply by -1 to make it negative and then add a + or - sign if positive or negative
    const formatTransactionAmount = (amount) => {
      const formattedAmount = amount * -1;
      return formattedAmount > 0 ? `+${formattedAmount}` : formattedAmount;
    };

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
        ${transactionEdits}

        Transaction:
        - Amount: ${formatTransactionAmount(transactionAmount)}
        - Description: ${transactionOriginalDescription}
      `;
    };

    const MAX_RETRIES = 5;
    let attemptCount = 0;
    let categories;

    while (attemptCount <= MAX_RETRIES) {
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
                        enum: transactionTypes,
                      },
                      category: {
                        type: 'string',
                        description: 'Category of the transaction.',
                        enum: Object.values(categoryIdToNameMap),
                      },
                    },
                    required: ['type', 'category'],
                  },
                },
              },
            },
          ],
        },
      };

      // Wait for rate limiter permission before making the request
      await this.rateLimiter.waitForPermission();

      try {
        const client = new BedrockRuntimeClient({ region: 'us-east-1' });
        const command = new ConverseCommand(requestBody);

        const response = await client.send(command);
        const { inputTokens, outputTokens, totalTokens } = response.usage;
        console.log(`Input Tokens: ${inputTokens}`);
        console.log(`Output Tokens: ${outputTokens}`);
        console.log(`Total Tokens: ${totalTokens}`);

        categories = response.output.message.content[0].toolUse.input;
        break;
      } catch (error) {
        console.error(`Attempt ${attemptCount + 1} failed:`, error.message);

        if (attemptCount >= MAX_RETRIES) {
          throw new Error(
            `Failed to get valid JSON response after ${MAX_RETRIES + 1} attempts`
          );
        }

        // Increment attempt counter and try again
        attemptCount++;
      }
    }

    Object.keys(categoryIdToNameMap).forEach((key) => {
      const categoryName = categoryIdToNameMap[key];
      if (categoryName === categories.category) {
        categories.categoryId = key;
      }
    });

    return categories;
  }
}

export { OpenaiAdapter };
