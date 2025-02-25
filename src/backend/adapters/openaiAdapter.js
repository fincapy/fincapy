import OpenAI from 'openai';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { transactionTypes } from '../domain/transaction.js';

class OpenaiAdapter {
  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.AI_URL,
      apiKey: 'ignored',
    });
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
    const tools = [
      {
        name: 'categorizeTransaction',
        description:
          'Categorizes a financial transaction into user provided categories and types.',
        input_schema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: Object.values(categoryIdToNameMap),
              description: 'The category to categorize the transaction to.',
            },
            type: {
              type: 'string',
              enum: transactionTypes,
              description:
                'The type of the transaction to categorize the transaction to.',
            },
          },
          required: ['category', 'type'],
          additionalProperties: false,
        },
      },
    ];

    const prompt = `Output a JSON object with exactly two keys: "category" and "type". 
    - "category" must be one of: ${JSON.stringify(Object.values(categoryIdToNameMap))}.
    - "type" must be one of: ${JSON.stringify(transactionTypes)}.
    
    ### Instructions:
    - Money **coming in** (negative amounts) includes credit card refunds, interest payments, etc.
    - Money **going out** (positive amounts) includes purchases, withdrawals, etc.
    - Refunds should be categorized the same as their corresponding purchases.
    - Use the user's manually edited transactions as a reference.
    - Respond only with a JSON object matching the provided schema. Do not include any additional text.
    
    ### Examples:
    
    **Example 1**  
    - Amount: -50.00  
    - Description: "Amazon"  
    - Response:  
      {
        "category": "spending.shopping",
        "type": "spending"
      }
    
    **Example 2**  
    - Amount: 120.00  
    - Description: "Walmart"  
    - Response:  
      {
        "category": "spending.groceries",
        "type": "spending"
      }
    
    **Example 3**  
    - Amount: -10.00  
    - Description: "INTRST PYMNT"  
    - Response:  
      {
        "category": "income.interest",
        "type": "interest_income"
      }
    
    ### Manually Edited Transactions:
    ${JSON.stringify(transactionEdits, null, 2)}
    
    ### Transaction to Categorize:
    Amount: ${transactionAmount}
    Category: ${transactionCategory}
    Confidence Level: ${transactionCategoryConfidenceLevel}
    Merchant Name: ${transactionMerchantName}
    Original Description: ${transactionOriginalDescription}
    Account Type: ${transactionAccountType}
    Sub-Account Type: ${transactionSubAccountType}`;

    // Fixed request body format for Bedrock
    const requestBody = {
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
      tools: tools,
      tool_choice: {
        type: 'tool',
        name: 'categorizeTransaction',
      },
    };

    const client = new BedrockRuntimeClient({ region: 'us-west-2' });
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('usage', responseBody.usage);
    const toolResponse = responseBody.content[0].input;
    console.log('toolResponse', toolResponse);

    Object.keys(categoryIdToNameMap).forEach((key) => {
      const categoryName = categoryIdToNameMap[key];
      if (categoryName === toolResponse.category) {
        toolResponse.categoryId = key;
      }
    });

    return toolResponse;
  }
}

export { OpenaiAdapter };
