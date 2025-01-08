class Transaction {
  constructor({
    transactionId,
    updatedAt,
    amount,
    date,
    description,
    type,
    status,
  }) {
    this.transactionId = transactionId;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.date = date;
    this.description = description;
    this.type = type;
    this.status = status;
  }
}

const transactionTypes = [
  'spending',
  'transfer',
  'credit_card_payment',
  'credit_card_refund',
  'debit_card_refund',
  'investment_transfer',
  'interest_income',
  'income',
];

const spendingTransactionTypes = [
  'spending',
  'credit_card_refund',
  'debit_card_refund',
];

const incomeTransactionTypes = ['income'];

export {
  Transaction,
  transactionTypes,
  spendingTransactionTypes,
  incomeTransactionTypes,
};
