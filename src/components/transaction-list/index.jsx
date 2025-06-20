import React, { useState, useMemo } from 'react';
import TransactionItem from './TransactionItem';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const TransactionList = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) {
      return transactions;
    }
    return transactions.filter(
      (transaction) =>
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (transaction.categoryName &&
          transaction.categoryName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );
  }, [transactions, searchTerm]);

  return (
    <div className="flex flex-col h-full rounded-xl m-2">
      <div>
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction, index) => (
            <React.Fragment key={transaction.transactionId}>
              <TransactionItem transaction={transaction} />
              {index < filteredTransactions.length - 1 && <Separator />}
            </React.Fragment>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
