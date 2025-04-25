import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const SubmitButton = ({ children, className = '', onClick }) => {
  return (
    <Button
      type="submit"
      className={cn(
        'text-md font-bold text-gray-900 hover:bg-amber-600 border border-amber-600',
        className
      )}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

export default SubmitButton;
