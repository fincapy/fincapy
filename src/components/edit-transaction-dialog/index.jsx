import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState, useTransition } from 'react';
import EditTransactionForm from '@/components/edit-transaction-form';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { deleteTransaction } from '../transaction-table/serverActions';
import { toast } from '@/hooks/use-toast';
import { useAtom } from 'jotai';
import { planAtom } from '../state/atoms';
import { Button } from '@/components/ui/button';

const EditTransactionDialog = ({ transaction, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
    useState(false);
  const [isPending, startTransition] = useTransition();
  const [planState, setPlanState] = useAtom(planAtom);

  console.log('transaction', transaction);

  function handleServerDeleteTransaction({
    oldPlanState,
    handleDeleteTransaction,
  }) {
    setTimeout(async () => {
      try {
        const result = await deleteTransaction({
          planId: 'initial',
          transactionId: transaction.transactionId,
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
                onClick={() => handleDeleteTransaction()}
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
            <ToastAction
              altText="Try again"
              onClick={() => handleDeleteTransaction()}
            >
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  }

  const handleDeleteTransaction = async () => {
    const oldPlanState = planState.clone();
    const newPlanState = planState.clone();
    newPlanState.deleteTransaction({
      transactionId: transaction.transactionId,
    });
    setPlanState(newPlanState);
    setIsOpen(false);
    handleServerDeleteTransaction({
      oldPlanState,
      handleDeleteTransaction,
    });
    toast({
      variant: 'success',
      title: 'Transaction deleted',
      description: 'Your transaction has been successfully deleted.',
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="w-full">{children}</div>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[95%] bg-card max-w-[95%] lg:max-w-[30%] md:max-w-[50%] rounded-xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <VisuallyHidden>
            <DialogTitle>Edit Transaction</DialogTitle>
          </VisuallyHidden>
          <EditTransactionForm
            transaction={transaction}
            transactionId={transaction.transactionId}
            setDialogIsOpen={setIsOpen}
            onDelete={() => setIsConfirmDeleteDialogOpen(true)}
            isDeleting={isPending}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              Your transaction will be permanently deleted
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTransaction}
              className="text-white hover:bg-red-900"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditTransactionDialog;
