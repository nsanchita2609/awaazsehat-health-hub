import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backRoute?: string;
  rightElement?: React.ReactNode;
  showLogo?: boolean;
}

const AppHeader = ({ title, showBack, backRoute, rightElement, showLogo }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-[60px] px-4 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => backRoute ? navigate(backRoute) : navigate(-1)}
            className="p-2 -ml-2 rounded-lg transition-colors duration-200 hover:bg-primary-light"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        {showLogo && (
          <span className="text-[22px] font-bold text-primary flex items-center gap-1">
            🫁 AwaazSehat
          </span>
        )}
      </div>
      {title && (
        <h1 className="text-base font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
          {title}
        </h1>
      )}
      <div className="flex items-center">
        {rightElement}
      </div>
    </header>
  );
};

export default AppHeader;
