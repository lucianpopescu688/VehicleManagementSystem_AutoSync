import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    className
  ].join(' ');

  return (
    <button className={buttonClasses} {...props}>
      <span className="label-md">{children}</span>
    </button>
  );
};

export default Button;
