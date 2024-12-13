import { date } from 'drizzle-orm/mysql-core';
import { columns } from './columns';
import { DataTable } from './data-table';
import { DataTablePagination } from './data-table-pagination';

const TransactionTable = ({ transactions, categoryId }) => {
  return (
    <div className="overflow-auto">
      <DataTable
        columns={columns}
        data={transactions}
        categoryId={categoryId}
      />
    </div>
  );
};

export default TransactionTable;
