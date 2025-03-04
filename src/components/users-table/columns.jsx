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
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useAtom } from 'jotai';
import { usersAtom } from '../state/atoms';
import SubmitButton from '@/components/SubmitButton';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

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
  role: z.string().min(1),
});

const ChangeRoleForm = ({
  setOuterDialogIsOpen,
  setInnerDialogIsOpen,
  role,
  userId,
}) => {
  const { toast } = useToast();
  const [usersState, setUsersState] = useAtom(usersAtom);
  const form = useForm({
    resolver: zodResolver(changeRoleFormSchema),
    defaultValues: {
      role: role,
    },
  });

  function handleServerChangeRole({ oldUsersState, onSubmit, values }) {
    setTimeout(async () => {
      try {
        const result = await changeUserRole({ userId, role: values.role });
        if (!result) {
          setUsersState(oldUsersState);
          toast({
            variant: 'outline',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <ToastAction altText="Try again" onClick={() => onSubmit(values)}>
                Try again
              </ToastAction>
            ),
          });
        }
      } catch (error) {
        setUsersState(oldUsersState);
        toast({
          variant: 'outline',
          title: 'Network Error',
          description: 'There was an issue connecting to the server.',
          action: (
            <ToastAction altText="Try again" onClick={() => onSubmit(values)}>
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  }

  const onSubmit = async (values) => {
    const oldUsersState = usersState.map((user) => ({ ...user }));
    const newUsersState = usersState.map((user) => {
      if (user.id === userId) {
        return { ...user, role: values.role };
      }
      return { ...user };
    });
    setUsersState(newUsersState);
    setInnerDialogIsOpen(false);
    setOuterDialogIsOpen(false);
    handleServerChangeRole({ oldUsersState, onSubmit, values });
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
          <SubmitButton>Save</SubmitButton>
        </DialogClose>
      </form>
    </Form>
  );
};

const ChangeRoleDialog = ({ row, setOuterDialogIsOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <VisuallyHidden>
        <DialogTitle>Change Role Dialog</DialogTitle>
      </VisuallyHidden>
      <DialogContent
        className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <ChangeRoleForm
          role={row.original.role}
          userId={row.original.id}
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
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [usersState, setUsersState] = useAtom(usersAtom);
  const userId = row.original.id;

  function handleServerRemoveUser({ oldUsersState, handleRemoveUser }) {
    setTimeout(async () => {
      try {
        const result = await removeUser({ userId });
        if (!result) {
          setUsersState(oldUsersState);
          toast({
            variant: 'outline',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <ToastAction
                altText="Try again"
                onClick={() => handleRemoveUser()}
              >
                Try again
              </ToastAction>
            ),
          });
        }
      } catch (error) {
        setUsersState(oldUsersState);
        toast({
          variant: 'outline',
          title: 'Network Error',
          description: 'There was an issue connecting to the server.',
          action: (
            <ToastAction altText="Try again" onClick={() => handleRemoveUser()}>
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  }

  const handleRemoveUser = async () => {
    const oldUsersState = usersState.map((user) => ({ ...user }));
    const newUsersState = usersState.filter((user) => user.id !== userId);
    setUsersState(newUsersState);
    setOuterDialogIsOpen(false);
    setIsOpen(false);
    handleServerRemoveUser({
      oldUsersState,
      handleRemoveUser,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%]"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle>Remove user</DialogTitle>
        <DialogDescription>
          Are you sure you want to remove this user?
        </DialogDescription>
        <Button
          variant="destructive"
          className="border-none outline-none ring-0"
          onClick={handleRemoveUser}
        >
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
  name: z.string().min(1),
});

const ChangeNameForm = ({
  setOuterDialogIsOpen,
  setInnerDialogIsOpen,
  name,
  userId,
}) => {
  const { toast } = useToast();
  const [usersState, setUsersState] = useAtom(usersAtom);
  const form = useForm({
    resolver: zodResolver(changeNameFormSchema),
    defaultValues: {
      name: name,
    },
  });

  function handleServerChangeName({ oldUsersState, onSubmit, values }) {
    setTimeout(async () => {
      try {
        const result = await changeUserName({ userId, name: values.name });
        if (!result) {
          setUsersState(oldUsersState);
          toast({
            variant: 'outline',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <ToastAction altText="Try again" onClick={() => onSubmit(values)}>
                Try again
              </ToastAction>
            ),
          });
        }
      } catch (error) {
        setUsersState(oldUsersState);
        toast({
          variant: 'outline',
          title: 'Network Error',
          description: 'There was an issue connecting to the server.',
          action: (
            <ToastAction altText="Try again" onClick={() => onSubmit(values)}>
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  }

  const onSubmit = async (values) => {
    const oldUsersState = usersState.map((user) => ({ ...user }));
    const newUsersState = usersState.map((user) => {
      if (user.id === userId) {
        return { ...user, name: values.name };
      }
      return { ...user };
    });
    setUsersState(newUsersState);
    setOuterDialogIsOpen(false);
    setInnerDialogIsOpen(false);
    handleServerChangeName({
      oldUsersState,
      onSubmit,
      values,
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
              <Input
                placeholder="Name"
                type="text"
                autoComplete="off"
                {...field}
                value={field.value}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton>Save</SubmitButton>
      </form>
    </Form>
  );
};

const ChangeNameDialog = ({ row, setOuterDialogIsOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <VisuallyHidden>
        <DialogTitle>Change Name Dialog</DialogTitle>
      </VisuallyHidden>
      <DialogContent
        className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <ChangeNameForm
          name={row.original.name}
          userId={row.original.id}
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
    accessorKey: 'id',
  },
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
