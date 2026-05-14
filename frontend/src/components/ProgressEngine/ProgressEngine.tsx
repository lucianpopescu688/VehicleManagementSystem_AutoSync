import React from 'react';
import styles from './ProgressEngine.module.css';

interface ProgressEngineProps {
  value: number; // 0 to 100
  label?: string;
  className?: string;
}

const ProgressEngine: React.FC<ProgressEngineProps> = ({ 
  value, 
  label,
  className = ''
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      {label && <div className={`${styles.label} label-md`}>{label}</div>}
      <div className={styles.track}>
        <div 
          className={styles.fill} 
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressEngine;
