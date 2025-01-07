'use client';

import React from 'react';
import UserTable from '../users-table';
import { Button } from '@/components/ui/button';

export default function Dashboard({ users }) {
  return (
    <div className="flex flex-col w-full flex-grow gap-4 mt-4 items-center">
      <div className="w-11/12 lg:w-3/4 flex flex-row justify-end">
        <Button variant="outline">Add User</Button>
      </div>
      <div className="w-11/12 lg:w-3/4">
        <UserTable users={users} />
      </div>
    </div>
  );
}
