import { columns } from './columns';
import { DataTable } from './data-table';

const UserTable = ({ users }) => {
  console.log(users);
  return (
    <div className="overflow-auto">
      <DataTable columns={columns} data={users} />
    </div>
  );
};

export default UserTable;
