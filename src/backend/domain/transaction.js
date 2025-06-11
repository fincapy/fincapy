class Transaction {
  constructor({
    transactionId,
    amount,
    date,
    description,
    type,
    status,
    createdByUser,
    plaidItemId = null,
  }) {
    this.transactionId = transactionId;
    this.amount = amount;
    this.date = date;
    this.description = description;
    this.type = type;
    this.status = status;
    this.createdByUser = createdByUser;
    this.plaidItemId = plaidItemId;
  }
}

const transactionTypes = [
  'spending',
  'transfer',
  'credit_card_payment',
  'refund',
  'income',
];

const spendingTransactionTypes = ['spending', 'refund'];

const incomeTransactionTypes = ['income'];

export {
  Transaction,
  transactionTypes,
  spendingTransactionTypes,
  incomeTransactionTypes,
};
