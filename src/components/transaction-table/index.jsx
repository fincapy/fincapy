import { date } from 'drizzle-orm/mysql-core';
import { columns } from './columns';
import { DataTable } from './data-table';
import { DataTablePagination } from './data-table-pagination';

const TransactionTable = () => {
  const data = [
    {
      id: '728ed52f',
      amount: 100,
      status: 'pending',
      description: 'This is a really long transaction description',
      date: new Date(),
      category: 'Fixed Costs - Rent',
    },
    // ...
  ];

  return (
    <div className="container mx-auto pt-4 pb-2 overflow-auto">
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default TransactionTable;
