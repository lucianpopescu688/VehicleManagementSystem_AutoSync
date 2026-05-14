import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './DashboardLayout.module.css';
import Button from '../Button/Button';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <nav className={`${styles.sidebar} glass`}>
        <div className={styles.logo}>
          <span className="headline-sm">Fleet Master</span>
          <span className="label-sm" style={{ opacity: 0.6 }}>Precision & Control</span>
        </div>
        
        <div className={styles.navGroup}>
          <p className="label-md" style={{ marginBottom: '1rem', opacity: 0.5 }}>Dashboards</p>
          <NavLink to="/manager" className={({ isActive }) => `${styles.navLink} label-md ${isActive ? styles.active : ''}`}>
            Fleet Manager
          </NavLink>
          <NavLink to="/driver" className={({ isActive }) => `${styles.navLink} label-md ${isActive ? styles.active : ''}`}>
            Fleet Driver
          </NavLink>
          <NavLink to="/standard" className={({ isActive }) => `${styles.navLink} label-md ${isActive ? styles.active : ''}`}>
            Standard User
          </NavLink>
          <NavLink to="/service" className={({ isActive }) => `${styles.navLink} label-md ${isActive ? styles.active : ''}`}>
            Service Shop
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => `${styles.navLink} label-md ${isActive ? styles.active : ''}`}>
            Administrator
          </NavLink>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={styles.userInfo}>
            <p className="label-sm" style={{ opacity: 0.5 }}>Active Operator</p>
            <p className="body-md" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
          </div>
          <Button variant="secondary" onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>
            Logout
          </Button>
        </div>
      </nav>
      
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
