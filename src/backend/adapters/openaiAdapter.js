import OpenAI from 'openai';
import { transactionTypes } from '../domain/transaction';

class OpenaiAdapter {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async categorizeTransaction({
    categoryIdToNameMap,
    recategorizations,
    transactionAmount,
    transactionCategory,
    transactionCategoryConfidenceLevel,
    transactionMerchantName,
    transactionOriginalDescription,
    transactionAccountType,
    transactionSubAccountType,
  }) {
    const jsonschema = {
      name: 'transaction_categorization',
      schema: {
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
      strict: true,
    };

    const prompt = `Categorize the transaction based on the following data. Money coming in will be negative. Money going out will be positive. For instance, credit card refunds, interest payments, etc. are negative. Refunds should be categorized the same as if they were purchases:
    The recategorized manually by user transactions:
    ${JSON.stringify(recategorizations)}
    
    The transaction to be categorized:
    ${JSON.stringify({
      amount: transactionAmount,
      category: transactionCategory,
      categoryConfidenceLevel: transactionCategoryConfidenceLevel,
      merchantName: transactionMerchantName,
      originalDescription: transactionOriginalDescription,
      accountType: transactionAccountType,
      subAccountType: transactionSubAccountType,
    })}`;

    console.log('prompt', prompt);

    const completion = await this.client.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_schema', json_schema: jsonschema },
      temperature: 0,
    });

    const categories = completion.choices[0].message.parsed;
    console.log('usage', completion.usage);
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
