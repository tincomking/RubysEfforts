import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-display font-bold rounded-2xl transition-all active:translate-y-1 border-b-4 focus:outline-none flex items-center justify-center";
  
  const variants = {
    primary: "bg-kawaii-main text-white border-blue-700 hover:bg-blue-400",
    secondary: "bg-kawaii-sub text-slate-700 border-blue-300 hover:bg-blue-200",
    success: "bg-kawaii-success text-white border-green-700 hover:bg-green-500",
    danger: "bg-gray-200 text-gray-500 border-gray-400 hover:bg-gray-300"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-lg",
    lg: "px-8 py-4 text-xl w-full"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
