import { DataTable } from './data-table';
import { columns } from './columns';

const TransactionTable = ({ transactions }) => {
  return <DataTable columns={columns} data={transactions} />;
};

export default TransactionTable;
