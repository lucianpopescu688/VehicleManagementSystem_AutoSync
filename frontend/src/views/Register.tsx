import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card/Card';
import Button from '../components/Button/Button';
import styles from './Auth.module.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STANDARD_USER'
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    }
  };

  return (
    <div className={styles.authContainer}>
      <Card elevation="lowest" className={styles.authCard}>
        <div className={styles.header}>
          <h1 className="headline-sm">Instance Registration</h1>
          <p className="label-sm" style={{ opacity: 0.6 }}>Create New Operator Profile</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className="label-md">First Name</label>
              <input name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className="label-md">Last Name</label>
              <input name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className="label-md">Email Address</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className={styles.inputGroup}>
            <label className="label-md">Access Key</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className={styles.inputGroup}>
            <label className="label-md">Primary Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="STANDARD_USER">Standard User</option>
              <option value="FLEET_MANAGER">Fleet Manager</option>
              <option value="FLEET_DRIVER">Fleet Driver</option>
              <option value="SERVICE_SHOP">Service Shop</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" style={{ marginTop: '1rem' }}>Provision Account</Button>
        </form>

        <div className={styles.footer}>
          <p className="body-md">Existing operator? <Link to="/login">Authenticate Here</Link></p>
        </div>
      </Card>
    </div>
  );
};

export default Register;
