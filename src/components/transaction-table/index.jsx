import { date } from 'drizzle-orm/mysql-core';
import { columns } from './columns';
import { DataTable } from './data-table';
import { DataTablePagination } from './data-table-pagination';

const TransactionTable = ({ transactions }) => {
  return (
    <div className="overflow-auto">
      <DataTable columns={columns} data={transactions} />
    </div>
  );
};

export default TransactionTable;
