import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAtom, useAtomValue } from 'jotai';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '../ui/toast';
import { planAtom, categoryNamesAtom } from '../state/atoms';
import { transactionTypes } from '@/backend/domain/transaction';
import { editTransaction } from '@/components/transaction-table/serverActions';
import SubmitButton from '@/components/SubmitButton';

export function SelectDemo({ field }) {
  const categoryNames = useAtomValue(categoryNamesAtom);

  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="None" />
        </SelectTrigger>
      </FormControl>
      <SelectContent className="bg-card">
        {categoryNames.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const recategorizeFormSchema = z.object({
  category: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Enter a date in the format YYYY-MM-DD',
  }),
  description: z
    .string()
    .min(1, {
      message: 'Description must be at least 1 character.',
    })
    .max(100, {
      message: 'Description should be less than 100 characters',
    }),
  status: z.string(),
  type: z.string(),
  amount: z.union([
    z.number().refine((value) => /^\d+(\.\d{1,2})?$/.test(value.toString()), {
      message: 'Must be a valid currency format (up to two decimal places)',
    }),
    z
      .string()
      .regex(
        /^\d+(\.\d{1,2})?$/,
        'Must be a valid currency format (up to two decimal places)'
      ),
  ]),
});

const EditTransactionForm = ({
  transaction,
  transactionId,
  setDialogIsOpen,
}) => {
  const { toast } = useToast();
  const [planState, setPlanState] = useAtom(planAtom);
  const form = useForm({
    resolver: zodResolver(recategorizeFormSchema),
    defaultValues: {
      category: transaction.subcategoryId ?? transaction.categoryId,
      date: transaction.date,
      description: transaction.description,
      status: transaction.status,
      type: transaction.type,
      amount: transaction.amount,
    },
  });

  const handleServerEditTransaction = ({
    oldPlanState,
    onSubmit,
    values,
    transactionId,
  }) => {
    setTimeout(async () => {
      try {
        const result = await editTransaction({
          transactionId,
          planId: 'initial',
          newCategoryId: values.category,
          categoryId: transaction.categoryId,
          subcategoryId: transaction.subcategoryId,
          date: values.date,
          description: values.description,
          status: values.status,
          type: values.type,
          amount: parseFloat(values.amount, 10),
        });
        if (!result) {
          setPlanState(oldPlanState);
          toast({
            variant: 'outline',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <ToastAction
                altText="Try again"
                onClick={() => {
                  onSubmit(values);
                }}
              >
                Try again
              </ToastAction>
            ),
          });
        }
      } catch (error) {
        setPlanState(oldPlanState);
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
  };

  const onSubmit = async (values) => {
    const oldPlanState = planState.clone();
    const newPlanState = planState.clone();
    newPlanState.editTransaction({
      transactionId,
      newCategoryId: values.category,
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId,
      date: values.date,
      description: values.description,
      status: values.status,
      type: values.type,
      amount: parseFloat(values.amount, 10),
    });
    setPlanState(newPlanState);
    handleServerEditTransaction({
      oldPlanState: oldPlanState,
      onSubmit,
      values,
      transactionId,
      planId: 'initial',
      newCategoryId: values.category,
    });
    setDialogIsOpen(false);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3 h-full"
      >
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <Input
                type="text"
                placeholder="YYYY-MM-DD"
                autoComplete="off"
                {...field}
              />
              <FormMessage />
            </FormItem>
          )}
        ></FormField>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <Input
                type="text"
                placeholder="Your Description"
                autoComplete="off"
                {...field}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card">
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card">
                  {transactionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <SelectDemo field={field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <Input
                type="text"
                placeholder="0.00"
                {...field}
                autoComplete="off"
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

export default EditTransactionForm;
