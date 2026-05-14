import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'error' | 'success';
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'neutral' 
}) => {
  return (
    <div className={`${styles.badge} ${styles[variant]} label-sm`}>
      {children}
    </div>
  );
};

export default Badge;
