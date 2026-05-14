import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  elevation?: 'low' | 'lowest' | 'highest';
  ghost?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  elevation = 'lowest', 
  ghost = false,
  className = '',
  style,
  onClick 
}) => {
  const cardClasses = [
    styles.card,
    styles[`elevation-${elevation}`],
    ghost ? styles.ghost : '',
    onClick ? styles.interactive : '',
    className
  ].join(' ');

  return (
    <div className={cardClasses} style={style} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
