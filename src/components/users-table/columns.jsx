import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from './data-table-column-header';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { removeUser, changeUserRole, changeUserName } from './serverActions';
import { Input } from '@/components/ui/input';

export function SelectDemo({ field }) {
  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Role" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem key="editor" value="editor">
          Editor
        </SelectItem>
        <SelectItem key="viewer" value="viewer">
          Viewer
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

const changeRoleFormSchema = z.object({
  role: z.string(),
});

const ChangeRoleForm = ({
  setOuterDialogIsOpen,
  setInnerDialogIsOpen,
  role,
  email,
}) => {
  const form = useForm({
    resolver: zodResolver(changeRoleFormSchema),
    defaultValues: {
      role: role,
    },
  });

  const onSubmit = async (data) => {
    setInnerDialogIsOpen(false);
    setOuterDialogIsOpen(false);
    await changeUserRole({
      email,
      role: data.role,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Change role</FormLabel>
              <SelectDemo field={field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogClose asChild>
          <Button type="submit">Submit</Button>
        </DialogClose>
      </form>
    </Form>
  );
};

const ChangeRoleDialog = ({ row, setOuterDialogIsOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-11/12">
        <ChangeRoleForm
          role={row.original.role}
          email={row.original.email}
          setOuterDialogIsOpen={setOuterDialogIsOpen}
          setInnerDialogIsOpen={setIsOpen}
        />
      </DialogContent>
      <DropdownMenuItem
        className="cursor-pointer"
        onSelect={(e) => {
          e.preventDefault(); // Prevent dropdown from closing
          setIsOpen(true);
        }}
      >
        Change role
      </DropdownMenuItem>
    </Dialog>
  );
};

const RemoveUserDialog = ({ row, setOuterDialogIsOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleRemoveUser = async () => {
    await removeUser(row.original.email);
    setOuterDialogIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-11/12">
        <DialogTitle>Remove user</DialogTitle>
        <DialogDescription>
          Are you sure you want to remove this user?
        </DialogDescription>
        <Button variant="destructive" onClick={handleRemoveUser}>
          Remove user
        </Button>
      </DialogContent>
      <DropdownMenuItem
        className="cursor-pointer"
        onSelect={(e) => {
          e.preventDefault(); // Prevent dropdown from closing
          setIsOpen(true);
        }}
      >
        Remove user
      </DropdownMenuItem>
    </Dialog>
  );
};

const changeNameFormSchema = z.object({
  name: z.string(),
});

const ChangeNameForm = ({
  setOuterDialogIsOpen,
  setInnerDialogIsOpen,
  name,
  email,
}) => {
  const form = useForm({
    resolver: zodResolver(changeNameFormSchema),
    defaultValues: {
      name: name,
    },
  });

  const onSubmit = async (data) => {
    setInnerDialogIsOpen(false);
    setOuterDialogIsOpen(false);
    console.log(data);
    console.log(email);
    await changeUserName({
      email,
      name: data.name,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Change name</FormLabel>
              <Input placeholder="Name" {...field} value={field.value} />
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogClose asChild>
          <Button type="submit">Submit</Button>
        </DialogClose>
      </form>
    </Form>
  );
};

const ChangeNameDialog = ({ row, setOuterDialogIsOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-11/12">
        <ChangeNameForm
          name={row.original.name}
          email={row.original.email}
          setOuterDialogIsOpen={setOuterDialogIsOpen}
          setInnerDialogIsOpen={setIsOpen}
        />
      </DialogContent>
      <DropdownMenuItem
        className="cursor-pointer"
        onSelect={(e) => {
          e.preventDefault(); // Prevent dropdown from closing
          setIsOpen(true);
        }}
      >
        Change name
      </DropdownMenuItem>
    </Dialog>
  );
};

const Actions = ({ row }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ChangeNameDialog row={row} setOuterDialogIsOpen={setIsOpen} />
        <ChangeRoleDialog row={row} setOuterDialogIsOpen={setIsOpen} />
        <RemoveUserDialog row={row} setOuterDialogIsOpen={setIsOpen} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return <Actions row={row} />;
    },
  },
];
