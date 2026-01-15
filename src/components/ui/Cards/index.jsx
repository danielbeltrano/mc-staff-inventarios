// src/components/ui/card/Card.jsx
import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white rounded-lg border shadow-sm hover:border-amber-default hover:shadow-md ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};


export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`flex flex-col p-6 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};


export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`p-6 pt-0 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};


export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`flex items-center p-6 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};


export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 
      className={`text-lg text-blue-default font-semibold leading-none tracking-tight ${className}`} 
      {...props}
    >
      {children}
    </h3>
  );
};


export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p 
      className={`text-sm text-muted-foreground ${className}`} 
      {...props}
    >
      {children}
    </p>
  );
};
