import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card/Card';
import Button from '../components/Button/Button';
import styles from './Auth.module.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('FLEET_MANAGER');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, role);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    }
  };

  return (
    <div className={styles.authContainer}>
      <Card elevation="lowest" className={styles.authCard}>
        <div className={styles.header}>
          <h1 className="headline-sm">Fleet Master</h1>
          <p className="label-sm" style={{ opacity: 0.6 }}>Authentication Required</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className="label-md">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="operator@autosync.com"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className="label-md">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className="label-md">Assigned Role (Demo)</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="FLEET_MANAGER">Fleet Manager</option>
              <option value="FLEET_DRIVER">Fleet Driver</option>
              <option value="STANDARD_USER">Standard User</option>
              <option value="SERVICE_SHOP">Service Shop</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" style={{ marginTop: '1rem' }}>Enter System</Button>
        </form>

        <div className={styles.footer}>
          <p className="body-md">New operator? <Link to="/register">Register Instance</Link></p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
