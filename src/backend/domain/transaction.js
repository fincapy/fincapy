class Transaction {
  constructor({
    transactionId,
    amount,
    date,
    description,
    type,
    status,
    createdByUser,
  }) {
    this.transactionId = transactionId;
    this.amount = amount;
    this.date = date;
    this.description = description;
    this.type = type;
    this.status = status;
    this.createdByUser = createdByUser;
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

const incomeTransactionTypes = ['income', 'interest_income'];

export {
  Transaction,
  transactionTypes,
  spendingTransactionTypes,
  incomeTransactionTypes,
};
