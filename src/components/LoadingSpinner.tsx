import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ className = '' }: { className?: string }) => (
  <Loader2 className={`animate-spin text-primary ${className}`} />
);

export default LoadingSpinner;
