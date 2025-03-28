'use client';

import React from 'react';
import UserTable from '../users-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { inviteUser } from './serverActions';
import { UsersContext } from '../dashboard-layout/usersContext';
import { useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useAtom } from 'jotai';
import { usersAtom, isLoadingAtom } from '../state/atoms';
import { useState } from 'react';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import SubmitButton from '@/components/SubmitButton';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/backend/domain/user';
import { Separator } from '../ui/separator';

export function SelectDemo({ field }) {
  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Role" />
        </SelectTrigger>
      </FormControl>
      <SelectContent className="bg-card">
        <SelectItem
          key="editor"
          value="editor"
          className="cursor-pointer hover:bg-background"
        >
          Editor
        </SelectItem>
        <Separator className="bg-neutral-500" />
        <SelectItem
          key="viewer"
          value="viewer"
          className="cursor-pointer hover:bg-background"
        >
          Viewer
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

const inviteUserFormSchema = z.object({
  email: z.string().email({
    message: 'Invalid email address',
  }),
  role: z.string(),
  name: z.string().min(1),
});

const InviteUserForm = ({ setDialogOpen }) => {
  const [usersState, setUsersState] = useAtom(usersAtom);
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(inviteUserFormSchema),
    defaultValues: {
      email: '',
      role: 'viewer',
      name: '',
    },
  });

  function handleServerInviteUser({
    userId,
    name,
    email,
    role,
    oldUsersState,
    setUsersState,
    values,
    onSubmit,
  }) {
    setTimeout(async () => {
      try {
        const result = await inviteUser({
          name,
          email,
          role,
          userId,
        });
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

  async function onSubmit(values) {
    const email = values.email;
    const role = values.role;
    const name = values.name;
    const userId = uuidv4();
    const oldUsersState = usersState.map((user) => ({ ...user }));
    const newUsersState = [
      ...usersState,
      new User({
        id: userId,
        name,
        emails: [{ email, verified: false, primary: true }],
        role: role,
        password: null,
        mfaMethod: 'email',
        totpSecret: null,
        totpVerified: false,
      }),
    ];
    setUsersState(newUsersState);
    setDialogOpen(false);
    handleServerInviteUser({
      userId,
      name,
      email,
      role,
      oldUsersState,
      setUsersState,
      values,
      onSubmit,
    });
  }

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
              <FormControl>
                <Input
                  placeholder="Name"
                  type="text"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Email"
                  type="email"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SelectDemo field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.isValid ? (
          <DialogClose asChild>
            <SubmitButton>Invite</SubmitButton>
          </DialogClose>
        ) : (
          <SubmitButton>Invite</SubmitButton>
        )}
      </form>
    </Form>
  );
};

const InviteUserDialogue = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-card hover:bg-card hover:border-primary hover:text-primary"
          size="icon"
        >
          <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-11/12 bg-card rounded-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Invite a new user to your account
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <InviteUserForm setDialogOpen={setDialogOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Dashboard() {
  const [usersState, setUsersState] = useAtom(usersAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);

  useEffect(() => {
    if (usersState) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [usersState]);

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col w-full flex-grow gap-4 mt-4 items-center">
          <div className="w-11/12 flex flex-row justify-end">
            <Skeleton className="h-9 w-9 bg-card" />
          </div>
          <div className="w-11/12">
            <Skeleton className="h-[70vh] bg-card" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full gap-4 mb-2 mt-2">
          <div className="flex flex-col justify-end items-center gap-2 w-full">
            <div
              className="flex flex-row justify-end w-11/12"
              key="create-transaction-dialogue"
            >
              <InviteUserDialogue />
            </div>
            <div
              className="grid w-11/12 h-[70vh] lg:h-[85vh] bg-card rounded-lg"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <UserTable users={usersState} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
