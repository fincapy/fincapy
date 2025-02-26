import OpenAI from 'openai';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
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
    this.rateLimiter = new RateLimiter(3); // Limit to 10 requests per minute
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
    const prompt = `
      Categorize the transaction using these rules:
      - **Incoming** (negative): refunds, interest, etc.
      - **Outgoing** (positive): purchases, withdrawals, etc.
      - Refunds must mirror their original purchase's category.
      - Refer to the edited transactions below.
      - Use these valid values:
        - Categories: ${JSON.stringify(Object.values(categoryIdToNameMap))}
        - Types: ${JSON.stringify(transactionTypes)}

      Edited: ${JSON.stringify(transactionEdits)}

      Transaction:
      - Amount: ${transactionAmount}
      - Category: ${transactionCategory}
      - Confidence: ${transactionCategoryConfidenceLevel}
      - Merchant: ${transactionMerchantName}
      - Description: ${transactionOriginalDescription}
      - Acct: ${transactionAccountType}
      - Sub-Acct: ${transactionSubAccountType}
    `;
    console.log('prompt', prompt);

    // Fixed request body format for Bedrock
    const requestBody = {
      system:
        "You are a transaction categorization assistant. When given transaction details and lists of valid values, your task is to output exactly one JSON object with two keys: 'category' and 'type'. Use only the values provided in the valid lists. Do not include any additional text or commentary. Follow the instructions precisely.",
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      // tools: claudeTools,
      // tool_choice: {
      //   type: 'tool',
      //   name: 'categorizeTransaction',
      // },
    };

    // Wait for rate limiter permission before making the request
    await this.rateLimiter.waitForPermission();

    const client = new BedrockRuntimeClient({ region: 'us-west-2' });
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('usage', responseBody.usage);
    const categories = JSON.parse(responseBody.content[0].text);
    console.log('categories', categories);

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
