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

const inviteUserFormSchema = z.object({
  email: z.string().email({
    message: 'Invalid email address',
  }),
  role: z.string(),
  name: z.string(),
});

const InviteUserForm = () => {
  const form = useForm({
    resolver: zodResolver(inviteUserFormSchema),
    defaultValues: {
      email: '',
      role: 'viewer',
      name: '',
    },
  });

  async function onSubmit(values) {
    const email = values.email;
    const role = values.role;
    const name = values.name;
    await inviteUser({
      email,
      role,
      name,
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
                <Input placeholder="Name" {...field} />
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
                <Input placeholder="Email" {...field} />
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
              <FormLabel>Role</FormLabel>
              <FormControl>
                <SelectDemo field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.isValid ? (
          <DialogClose asChild>
            <Button type="submit">Invite</Button>
          </DialogClose>
        ) : (
          <Button type="submit">Invite</Button>
        )}
      </form>
    </Form>
  );
};

const InviteUserDialogue = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-11/12">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Invite a new user to your account
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <InviteUserForm />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Dashboard({ users }) {
  return (
    <div className="flex flex-col w-full flex-grow gap-4 mt-4 items-center">
      <div className="w-11/12 lg:w-3/4 flex flex-row justify-end">
        <InviteUserDialogue />
      </div>
      <div className="w-11/12 lg:w-3/4">
        <UserTable users={users} />
      </div>
    </div>
  );
}
