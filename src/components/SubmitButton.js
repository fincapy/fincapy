import { Button } from './ui/button';

const SubmitButton = ({ children }) => {
  return (
    <Button
      type="submit"
      className="text-sm font-bold text-white hover:bg-primary-dark"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </Button>
  );
};

export default SubmitButton;
