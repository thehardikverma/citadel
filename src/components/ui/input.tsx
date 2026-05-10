import * as React from 'react';
import { cn } from '@/lib/cn';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-border-secondary bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-border-secondary bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent',
          'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Input, Textarea };
