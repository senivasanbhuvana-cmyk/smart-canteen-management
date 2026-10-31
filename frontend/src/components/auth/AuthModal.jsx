import React, { useState } from 'react';
import { Mail, Lock, User, Hash, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, authModalMode, setAuthModalMode, closeAuthModal, login, register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    student_id: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (authModalMode === 'login') {
      if (!formData.email || !formData.password) {
        setFormError('Please enter both email and password.');
        setSubmitting(false);
        return;
      }
      const res = await login(formData.email, formData.password);
      if (!res.success) {
        setFormError(res.error);
      }
    } else {
      // Registration validations
      if (!formData.name.trim()) {
        setFormError('Please enter your full name.');
        setSubmitting(false);
        return;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setFormError('Please enter a valid campus email.');
        setSubmitting(false);
        return;
      }
      if (!formData.student_id.trim()) {
        setFormError('Student ID is required (e.g. CS2026-042).');
        setSubmitting(false);
        return;
      }
      if (formData.password.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        setSubmitting(false);
        return;
      }

      const res = await register(formData);
      if (!res.success) {
        setFormError(res.error);
      }
    }

    setSubmitting(false);
  };

  const fillDemoStudent = () => {
    setAuthModalMode('login');
    setFormData({
      name: '',
      email: 'student@campus.edu',
      student_id: '',
      password: 'student123',
    });
    setFormError('');
  };

  const fillDemoAdmin = () => {
    setAuthModalMode('login');
    setFormData({
      name: '',
      email: 'admin@smartbite.com',
      student_id: '',
      password: 'admin123',
    });
    setFormError('');
  };

  return (
    <Modal
      isOpen={authModalOpen}
      onClose={closeAuthModal}
      title={authModalMode === 'login' ? 'Welcome to SmartBite' : 'Student Registration'}
      maxWidth="460px"
    >
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab-btn ${authModalMode === 'login' ? 'active' : ''}`}
          onClick={() => {
            setAuthModalMode('login');
            setFormError('');
          }}
        >
          <LogIn size={16} />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          className={`auth-tab-btn ${authModalMode === 'register' ? 'active' : ''}`}
          onClick={() => {
            setAuthModalMode('register');
            setFormError('');
          }}
        >
          <UserPlus size={16} />
          <span>Register Student</span>
        </button>
      </div>

      {formError && (
        <div className="form-alert form-alert-error">
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        {authModalMode === 'register' && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">
                Full Name
              </label>
              <div className="input-icon-wrap">
                <User size={18} className="input-icon" />
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-student-id">
                Student ID / Roll Number
              </label>
              <div className="input-icon-wrap">
                <Hash size={18} className="input-icon" />
                <input
                  id="auth-student-id"
                  name="student_id"
                  type="text"
                  placeholder="e.g. CS2026-042"
                  value={formData.student_id}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="auth-email">
            Email Address
          </label>
          <div className="input-icon-wrap">
            <Mail size={18} className="input-icon" />
            <input
              id="auth-email"
              name="email"
              type="email"
              placeholder="e.g. student@campus.edu"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="auth-password">
            Password
          </label>
          <div className="input-icon-wrap">
            <Lock size={18} className="input-icon" />
            <input
              id="auth-password"
              name="password"
              type="password"
              placeholder="Enter your password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn btn-primary btn-block auth-submit-btn">
          {submitting
            ? 'Processing...'
            : authModalMode === 'login'
            ? 'Sign In to SmartBite'
            : 'Create Student Account'}
        </button>
      </form>

      {/* Demo fast-fill buttons */}
      <div className="demo-credentials-box">
        <p className="demo-box-label">College Project Demo Quick-Fill:</p>
        <div className="demo-buttons-row">
          <button type="button" onClick={fillDemoStudent} className="btn-demo-pill">
            Demo Student
          </button>
          <button type="button" onClick={fillDemoAdmin} className="btn-demo-pill admin">
            Demo Admin
          </button>
        </div>
      </div>
    </Modal>
  );
}
