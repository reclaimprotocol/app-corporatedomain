'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import OtpVerification from './components/OtpVerification';
import GenerateProof from './components/GenerateProof';
import DomainVerification from './components/DomainVerification';
import { useSearchParams } from 'next/navigation';

interface UserData {
  email: string;
  domain_name: string;
  employer: string | null;
  proof: object | null;
}

export default function Home() {
  const { token, email, login, logout, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const forceReverify = searchParams.get('reverify') === 'true';
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    if (email && token) {
      fetchUserData();
    }
  }, [email, token]);

  const fetchUserData = async () => {
    setLoadingUser(true);
    try {
      const response = await fetch(`/api/user?email=${encodeURIComponent(email!)}`);
      const data = await response.json();

      if (response.ok) {
        setUserData(data.user);
      } else if (response.status === 404) {
        // User not found in database, logout
        logout();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleOtpSent = (userEmail: string) => {
    setPendingEmail(userEmail);
  };

  const handleVerified = (newToken: string, userEmail: string) => {
    login(newToken, userEmail);
    setPendingEmail(null);
  };

  const handleBack = () => {
    setPendingEmail(null);
  };

  if (isLoading || loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        {!pendingEmail ? (
          <LoginForm onOtpSent={handleOtpSent} />
        ) : (
          <OtpVerification
            email={pendingEmail}
            onVerified={handleVerified}
            onBack={handleBack}
          />
        )}
      </div>
    );
  }

  const handleUpdateEmployer = async () => {
    if (!confirm('Are you sure you want to update your employer? This will delete your current data and log you out.')) {
      return;
    }

    try {
      const response = await fetch(`/api/user?email=${encodeURIComponent(email!)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        logout();
      } else {
        console.error('Failed to delete user data');
        alert('Failed to delete user data. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting user data:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // User is logged in
  // If user data exists and has employer and proof, show Domain Verification
  // Unless forceReverify is set, then show Generate Proof page
  console.log("User data:", userData);
  if (userData?.employer && userData?.proof && !forceReverify) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="w-full max-w-4xl space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Logged in as</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{email}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">Current employer</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{userData.employer}</p>
              </div>
              <button
                onClick={handleUpdateEmployer}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Update
              </button>
            </div>
          </div>
          <DomainVerification email={email!} />
        </div>
      </div>
    );
  }

  // Otherwise show Generate Proof page (for new users, users without proof, or forced reverify)
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <GenerateProof email={email!} />
    </div>
  );
}
