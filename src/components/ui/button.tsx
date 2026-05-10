import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20 hover:shadow-accent/30',
        secondary: 'bg-bg-elevated text-text-primary border border-border-secondary hover:bg-bg-hover hover:border-border-accent',
        ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
        danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20',
        outline: 'border border-border-secondary text-text-secondary hover:text-text-primary hover:border-accent hover:bg-accent-glow',
        glow: 'bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/30 hover:shadow-accent/50 animate-pulse-glow',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
