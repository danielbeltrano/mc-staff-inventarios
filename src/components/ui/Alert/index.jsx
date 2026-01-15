import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const variants = {
  default: {
    container: "bg-blue-50 border border-blue-default",
    icon: "text-blue-default",
    text: "text-blue-hover"
  },
  error: {
    container: "bg-error-light border border-error-border",
    icon: "text-error-bold",
    text: "text-error-bold"
  },
  success: {
    container: "bg-success-light border border-success-border",
    icon: "text-success-text",
    text: "text-success-text"
  },
  warning: {
    container: "bg-amber-50 border border-amber-default",
    icon: "text-amber-hover",
    text: "text-amber-hover"
  }
};

const icons = {
  default: Info,
  error: AlertCircle,
  success: CheckCircle2,
  warning: Info
};

export const Alert = ({ 
  children, 
  variant = "default", 
  className = "",
  icon: CustomIcon,
  ...props 
}) => {
  const IconComponent = CustomIcon || icons[variant];
  const styles = variants[variant] || variants.default;

  return (
    <div
      role="alert"
      className={`
        relative w-full rounded-card p-4
        flex items-start gap-3
        animate-fadeIn
        ${styles.container}
        ${className}
      `}
      {...props}
    >
      {IconComponent && (
        <IconComponent className={`h-5 w-5 ${styles.icon} flex-shrink-0`} />
      )}
      <div className={`flex-1 ${styles.text}`}>
        {children}
      </div>
    </div>
  );
};

export const AlertDescription = ({ 
  children, 
  className = "", 
  ...props 
}) => {
  return (
    <div
      className={`text-sm leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertTitle = ({ 
  children, 
  className = "", 
  ...props 
}) => {
  return (
    <h5
      className={`font-medium leading-none tracking-tight mb-2 ${className}`}
      {...props}
    >
      {children}
    </h5>
  );
};