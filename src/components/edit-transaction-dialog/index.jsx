import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import EditTransactionForm from '@/components/edit-transaction-form';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

const EditTransactionDialog = ({ transaction, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
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
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionDialog;
