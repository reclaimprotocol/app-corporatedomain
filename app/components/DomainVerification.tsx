'use client';

import { useState, useEffect } from 'react';

interface DomainVerificationProps {
  email: string;
}

interface EmployerStat {
  employer: string;
  count: number;
}

interface ExactMatch {
  email: string;
  employer: string | null;
}

interface SimilarDomainStats {
  domain: string;
  difference: string;
  stats: EmployerStat[];
}

export default function DomainVerification({ email }: DomainVerificationProps) {
  const [verifyEmail, setVerifyEmail] = useState('');
  const [exactMatch, setExactMatch] = useState<ExactMatch | null>(null);
  const [domainStats, setDomainStats] = useState<EmployerStat[]>([]);
  const [similarDomainsStats, setSimilarDomainsStats] = useState<SimilarDomainStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(false);

    try {
      const response = await fetch(`/api/user/stats?email=${encodeURIComponent(verifyEmail)}&searcherEmail=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        setExactMatch(data.exactMatch);
        setDomainStats(data.domainStats || []);
        setSimilarDomainsStats(data.similarDomainsStats || []);
        setSearched(true);
      } else {
        setError(data.error || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
        Domain Verification
      </h1>

      <form onSubmit={handleVerify} className="mb-8">
        <div className="flex gap-2">
          <input
            type="email"
            value={verifyEmail}
            onChange={(e) => setVerifyEmail(e.target.value)}
            placeholder="Enter email to verify domain"
            required
            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Verify'}
          </button>
        </div>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</div>
        )}
      </form>

      {searched && !loading && (
        <div className="space-y-8">
          {/* Exact Match Section */}
          {exactMatch && exactMatch.employer && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                Exact Match
              </h2>
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Email</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{exactMatch.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Employer</p>
                    <p className="text-lg font-semibold text-green-700 dark:text-green-300">{exactMatch.employer}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* From This Domain Section */}
          {domainStats.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                From this domain ({verifyEmail.split('@')[1]})
              </h2>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-200 dark:bg-zinc-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Employer
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {domainStats.map((stat, index) => (
                      <tr key={index} className="hover:bg-zinc-100 dark:hover:bg-zinc-750">
                        <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                          {stat.employer}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100 text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {stat.count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Similar Domains Section */}
          {similarDomainsStats.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                From similar domains
              </h2>
              <div className="space-y-6">
                {similarDomainsStats.map((domainData, idx) => (
                  <div key={idx}>
                    <h3 className="text-lg font-medium mb-2 text-zinc-800 dark:text-zinc-200">
                      <span className="font-mono">{domainData.domain}</span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2">
                        ({domainData.difference})
                      </span>
                    </h3>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-zinc-200 dark:bg-zinc-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                              Employer
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                              Count
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                          {domainData.stats.map((stat, index) => (
                            <tr key={index} className="hover:bg-zinc-100 dark:hover:bg-zinc-750">
                              <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                                {stat.employer}
                              </td>
                              <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100 text-right">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                  {stat.count}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {!exactMatch && domainStats.length === 0 && similarDomainsStats.length === 0 && (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              No data found for this email or domain.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
