import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const buttonStyles = cva(["transition-colors"], {
    variants: {
        variant: {
            default: ["bg-blue-default hover:bg-blue-hover text-blue-text cursor-pointer"],
            amber: ["bg-white border border-amber-default hover:bg-blue-default text-blue-default hover:text-blue-text"],
            delete: ["bg-white border border-amber-default hover:bg-red-500 text-blue-default hover:text-blue-text"],
            rounded: ["rounded-full bg-white border border-amber-default hover:bg-blue-default text-blue-default hover:text-blue-text p-2"],
            danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
            clean: ["bg-transparent cursor-pointer"]
        },
        size: {
            default: [],
            submit: [
                "w-1/2",
                "flex",
                "justify-center",
                "items-center",
                "p-2",
                "rounded"
            ]
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});

export const Button = ({ variant, size, className, type, ...props }) => {
  return (
    <button 
        {...props}
        className={twMerge(className, buttonStyles({ variant, size }))}
    />
  );
};
