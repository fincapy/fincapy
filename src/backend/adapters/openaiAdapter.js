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
    this.rateLimiter = new RateLimiter(800); // Limit for requests per minute
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
    const createPrompt = (attemptCount) => {
      let emphasisLevel = '';
      if (attemptCount > 0) {
        emphasisLevel =
          attemptCount >= 3
            ? 'CRITICAL: YOUR RESPONSE MUST BE VALID JSON. PREVIOUS ATTEMPTS FAILED TO PARSE. '
            : 'IMPORTANT: Your response must be valid JSON. ';
      }

      return `
      Rules:
      - Incoming (negative amounts) typically include refunds, interest, and income.
      - Outgoing (positive amounts) typically include purchases, withdrawals, and transfers.
      - Refunds must mirror their original purchase's category.
      - Reference edited transactions for consistency.
      - Determine the transaction type based on the following rules:
        - "spending": Purchases, payments, and withdrawals.
        - "transfer": Movement of money between accounts of the same owner.
        - "credit_card_payment": Payments made to a credit card.
        - "credit_card_refund": Refunds for purchases made with a credit card.
        - "debit_card_refund": Refunds for purchases made with a debit card.
        - "investment_transfer": Transfers to or from an investment account.
        - "interest_income": Interest earned on an account.
        - "income": Salary, deposits, or other sources of revenue.
      - Only use these valid values:
        - Categories: ${JSON.stringify(Object.values(categoryIdToNameMap))}
        - Types: ${JSON.stringify(transactionTypes)}

      Edited: ${JSON.stringify(transactionEdits)}

      Transaction:
      - Amount: ${transactionAmount}
      - Merchant: ${transactionMerchantName}
      - Description: ${transactionOriginalDescription}
      - Acct: ${transactionAccountType}
      - Sub-Acct: ${transactionSubAccountType}
      
      ${emphasisLevel}
      `;
    };

    const createSystemPrompt = (attemptCount) => {
      let basePrompt =
        'You are an expert transaction categorization assistant. When given transaction details and lists of valid values, your task is to output exactly one JSON object with two keys: "category" and "type". Use only the values provided in the valid lists.';

      if (attemptCount > 0) {
        basePrompt +=
          ' RESPOND WITH VALID JSON ONLY. NO MARKDOWN DELIMITERS, NO EXPLANATIONS, JUST THE RAW JSON OBJECT.';
      }

      if (attemptCount >= 3) {
        basePrompt +=
          ' THIS IS CRITICAL: YOUR ENTIRE RESPONSE MUST BE PARSEABLE AS JSON.';
      }

      return basePrompt;
    };

    const MAX_RETRIES = 5;
    let attemptCount = 0;
    let categories;

    while (attemptCount <= MAX_RETRIES) {
      const prompt = createPrompt(attemptCount);

      // Format for Bedrock Converse API
      const requestBody = {
        modelId: process.env.MODEL_ID,
        system: [
          {
            text: createSystemPrompt(attemptCount),
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
          maxTokens: 1000,
          temperature: 0,
          topP: 0.3,
        },
      };

      // Wait for rate limiter permission before making the request
      await this.rateLimiter.waitForPermission();

      try {
        const client = new BedrockRuntimeClient({ region: 'us-west-2' });
        const command = new ConverseCommand(requestBody);

        const response = await client.send(command);
        let rawOutput = response.output.message.content[0].text;

        // Clean up the output to handle potential markdown or other formatting
        rawOutput = rawOutput
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '')
          .trim();

        // Try to find JSON in the response if it's not already valid JSON
        if (!rawOutput.startsWith('{')) {
          const jsonMatch = rawOutput.match(/({[\s\S]*})/);
          if (jsonMatch) {
            rawOutput = jsonMatch[1];
          }
        }

        // Parse the JSON
        categories = JSON.parse(rawOutput);

        // If we got here, parsing succeeded
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
