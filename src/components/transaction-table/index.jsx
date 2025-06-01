import { columns } from './columns';
import { DataTable } from './data-table';
import { VirtualizedDataTable } from './virtualized-data-table';

const TransactionTable = ({ transactions }) => {
  // Use virtualization for large datasets (>100 transactions)
  // This provides significant performance improvements for large tables
  // const useVirtualization = transactions && transactions.length > 5;

  // if (useVirtualization) {
  //   return <VirtualizedDataTable columns={columns} data={transactions} />;
  // }

  return <VirtualizedDataTable columns={columns} data={transactions} />;
};

export default TransactionTable;
