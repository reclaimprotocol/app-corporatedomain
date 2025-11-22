'use client';

import { useState } from 'react';

interface OtpVerificationProps {
  email: string;
  onVerified: (token: string, email: string) => void;
  onBack: () => void;
}

export default function OtpVerification({
  email,
  onVerified,
  onBack,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        onVerified(data.token, data.email);
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-2 text-center text-zinc-900 dark:text-white">
        Verify OTP
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 text-center">
        Enter the code sent to {email}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="otp"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            OTP Code
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white text-center text-2xl tracking-widest"
            placeholder="000000"
            disabled={loading}
          />
        </div>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Back
        </button>
      </form>
    </div>
  );
}
