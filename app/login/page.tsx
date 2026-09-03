'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, loginWithGoogle, resetPassword } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleAuthSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      router.push('/');
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      const code = firebaseError.code || '';

      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect password or credentials. Please check your password or use Google Sign-In.');
      } else if (code === 'auth/user-not-found') {
        setError('No account found with this email address. Please switch to "Create Account" above.');
      } else if (code === 'auth/weak-password') {
        setError('Weak password. Password should be at least 6 characters long.');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists. Please switch to "Sign In" above to log in.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('Email/Password provider is disabled in Firebase Authentication. Please use "Sign In with Google" below.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset password.');
      } else {
        setError(firebaseError.message || 'An error occurred during authentication.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      router.push('/');
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      setError(firebaseError.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address above to receive a password reset link.');
      return;
    }
    setError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      await resetPassword(email.trim());
      setInfoMessage(`Password reset link sent to ${email.trim()}. Please check your inbox.`);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      setError(firebaseError.message || 'Failed to send password reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleAuthSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl shadow-2xl p-8 z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-800/80 text-emerald-400 mb-4 shadow-lg shadow-emerald-950/50">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
            Karez <span className="text-emerald-400">2.0</span>
          </h1>
          <p className="text-xs font-medium text-emerald-300/80 uppercase tracking-wider">
            PPRA Compliance Engine for Pakistan
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setError(null);
              setInfoMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              !isRegisterMode
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError(null);
              setInfoMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              isRegisterMode
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Info Notification */}
        {infoMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs flex items-start space-x-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{infoMessage}</span>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form Inputs (No <form> tags) */}
        <div className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="officer@procurement.gov.pk"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              {!isRegisterMode && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleAuthSubmit}
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isRegisterMode ? 'Creating Account...' : 'Authenticating...'}</span>
              </>
            ) : (
              <>
                <span>{isRegisterMode ? 'Register Officer Account' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 active:bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign In with Google</span>
          </button>
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-slate-400 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Encrypted PPRA Rules 2004 Audit Trail</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>PEC Category & Technical Evaluation Engine</span>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <p className="mt-6 text-slate-500 text-xs text-center z-10">
        Public Procurement Regulatory Authority (PPRA) • Government of Pakistan
      </p>
    </div>
  );
}
