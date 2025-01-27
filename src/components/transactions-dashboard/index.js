import { DataTable } from '../transaction-table/data-table';

const TransactionsDashboard = () => {
  return (
    <div className="flex flex-col w-full h-full gap-4 mb-2 mt-2">
      <div className="flex flex-col justify-center items-center gap-2">
        <div
          className="flex flex-row justify-end gap-4 w-11/12"
          key="create-transaction-dialogue"
        >
          <CreateCategoryDialogue />
        </div>
        <DataTable />
      </div>
    </div>
  );
};

export { TransactionsDashboard };
