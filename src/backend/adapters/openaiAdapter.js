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
    this.rateLimiter = new RateLimiter(10); // Limit for requests per minute
    this.typeRateLimiter = new RateLimiter(10); // Limit for requests per minute
  }

  async getTransactionCategory({
    categoryIdToNameMap,
    transactionAmount,
    transactionOriginalDescription,
  }) {
    const createPrompt = () => {
      return `
        Categorize this transaction based on its description and amount.

        Transaction Description: ${transactionOriginalDescription}
        Transaction Amount: ${transactionAmount}
      `;
    };

    const MAX_RETRIES = 6;
    let attemptCount = 0;
    let categories;

    while (attemptCount <= MAX_RETRIES) {
      const prompt = createPrompt();

      // Format for Bedrock Converse API
      const requestBody = {
        modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
        system: [
          {
            text: 'You are a transaction categorizer. Always call the "categorize_transaction" tool with the correct parameters. Be succint in your reasoning. Do not output any text. Do not explain your decision.',
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
                name: 'categorize_transaction',
                description:
                  'Categorize a transaction given its description and amount',
                inputSchema: {
                  json: {
                    type: 'object',
                    properties: {
                      category: {
                        type: 'string',
                        description: 'Category of the transaction.',
                        enum: Object.values(categoryIdToNameMap),
                      },
                    },
                    required: ['category'],
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

        const toolUseContent = response.output.message.content.find(
          (message) => message.toolUse
        );
        categories = toolUseContent.toolUse.input;
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
