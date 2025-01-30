import { Button } from './ui/button';

const SubmitButton = ({ children }) => {
  return (
    <Button
      type="submit"
      className="text-sm font-bold"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </Button>
  );
};

export default SubmitButton;
