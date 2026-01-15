// src/components/ui/badge/Badge.jsx
import React from 'react';

const variantStyles = {
  default: 'text-blue-default border border-amber-default ',
  closed: 'bg-neutral-bg text-neutral-text border border-neutral-default',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
  outline: 'text-foreground border border-input hover:bg-accent hover:text-accent-foreground',
  success: 'bg-green-100 text-green-800 hover:bg-green-200',
  warning: 'bg-amber-50 text-amber-600 border border-amber-default',
  error: 'bg-red-50 text-error-border border border-error-border',
  info: 'bg-sky-50 text-blue-default border border-blue-default'
};

export const Badge = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
