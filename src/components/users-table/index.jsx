import { columns } from './columns';
import { DataTable } from './data-table';

const UserTable = ({ users }) => {
  return <DataTable columns={columns} data={users} />;
};

export default UserTable;
