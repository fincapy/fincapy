import { columns } from './columns';
import { DataTable } from './data-table';

const TransactionTable = ({ transactions }) => {
  return <DataTable columns={columns} data={transactions} />;
};

export default TransactionTable;
