'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { login, requestPasswordReset } from './actions';
import FullScreenLoader from '@/components/FullScreenLoader';
import ModalDialog from '@/components/ui/ModalDialog';
import { useToast } from '@/components/ui/ToastProvider';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await login(formData);
    if (result?.error) {
      setError(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
    }

    setLoading(false);
  }

  async function handleResetSubmit(formData: FormData) {
    setResetSending(true);
    setResetError(null);
    setResetSuccess(null);

    const result = await requestPasswordReset(formData);
    setResetSending(false);

    if (result?.error) {
      setResetError(result.error);
      showToast({
        title: 'Password reset failed',
        description: result.error,
        tone: 'danger',
      });
      return;
    }

    if (result?.success) {
      setResetSuccess(result.success);
      showToast({
        title: 'Reset email requested',
        description: result.success,
        tone: 'success',
      });
    }
  }

  return (
    <>
      {loading && <FullScreenLoader message="Authenticating..." />}
      <main className="auth-shell">
        <section className="auth-card page-animate-enter" aria-labelledby="auth-heading">
          <div className="auth-brand">
            <div className="auth-logo" aria-hidden="true">
              ITM
            </div>
            <h1 id="auth-heading" className="auth-title">
              Integtrust Task Monitoring
            </h1>
            <p className="auth-subtitle">
              Sign in with your workspace credentials to continue.
            </p>
          </div>

          <form action={handleSubmit} className="form-stack">
            {error && (
              <div className="form-alert form-alert--error" role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="field">
              <label htmlFor="email" className="field-label">
                Email Address<span className="field-required" aria-hidden="true">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                enterKeyHint="next"
                required
                data-error="login-email-error"
                className="field-input"
                placeholder="you@company.com"
              />
              <div id="login-email-error" className="error-msg">
                <AlertCircle size={14} aria-hidden="true" />
                <span>Enter a valid email address.</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="password" className="field-label">
                Password<span className="field-required" aria-hidden="true">*</span>
              </label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  enterKeyHint="done"
                  required
                  data-error="login-password-error"
                  className="field-input"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              <div id="login-password-error" className="error-msg">
                <AlertCircle size={14} aria-hidden="true" />
                <span>Password is required.</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBlockStart: '0.875rem',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setResetError(null);
                setResetSuccess(null);
                setResetOpen(true);
              }}
            >
              Forgot password?
            </button>
          </div>

          <p className="auth-footer">
            Need an account? Contact your company administrator.
          </p>
        </section>
      </main>

      <ModalDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset Password"
        subtitle="Enter your account email and we will send a password recovery link."
        size="sm"
      >
        <form action={handleResetSubmit} className="form-stack">
          {resetError && (
            <div className="form-alert form-alert--error" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{resetError}</span>
            </div>
          )}
          {resetSuccess && (
            <div className="form-alert form-alert--success" role="status">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>{resetSuccess}</span>
            </div>
          )}

          <div className="field">
            <label htmlFor="reset_email" className="field-label">
              Account Email<span className="field-required" aria-hidden="true">*</span>
            </label>
            <input
              id="reset_email"
              name="reset_email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              required
              data-error="reset-email-error"
              className="field-input"
              placeholder="you@company.com"
            />
            <div id="reset-email-error" className="error-msg">
              <AlertCircle size={14} aria-hidden="true" />
              <span>Enter a valid email address.</span>
            </div>
          </div>

          <div className="form-actions-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setResetOpen(false)}
              disabled={resetSending}
            >
              Close
            </button>
            <button type="submit" className="btn btn-primary" disabled={resetSending}>
              {resetSending ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </ModalDialog>
    </>
  );
}
