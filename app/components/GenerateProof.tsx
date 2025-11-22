'use client';

import { useState, useEffect } from 'react';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import { useAuth } from '@/app/context/AuthContext';
import providers from '@/app/lib/providers.json';

interface GenerateProofProps {
  email: string;
}

interface Provider {
  id: string;
  name: string;
  logoUrl: string;
  active?: boolean;
}

const COUNTRIES = Object.keys(providers).filter(key => key !== 'ALL');

export default function GenerateProof({ email }: GenerateProofProps) {
  const { token } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [proof, setProof] = useState<any>(null);

  useEffect(() => {
    if (selectedCountry) {
      // Get providers for selected country and ALL
      const countryProviders: Provider[] = [];

      // Add country-specific providers
      if (providers[selectedCountry as keyof typeof providers]) {
        const countryData = providers[selectedCountry as keyof typeof providers];
        Object.values(countryData).forEach((provider) => {
          countryProviders.push(provider as Provider);
        });
      }

      // Add ALL providers
      if (providers.ALL) {
        Object.values(providers.ALL).forEach((provider) => {
          countryProviders.push(provider as Provider);
        });
      }

      setAvailableProviders(countryProviders);
      setSelectedProvider(null);
    }
  }, [selectedCountry]);

  const handleVerification = async () => {
    if (!token) {
      setMessage({ type: 'error', text: 'Authentication required' });
      return;
    }

    if (!selectedCountry) {
      setMessage({ type: 'error', text: 'Please select a country' });
      return;
    }

    if (!selectedProvider) {
      setMessage({ type: 'error', text: 'Please select a provider' });
      return;
    }

    try {
      setIsVerifying(true);
      setMessage(null);

      // Fetch config from our API route with email, country, provider and auth token
      const response = await fetch('/api/reclaim/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          country: selectedCountry,
          provider: selectedProvider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch config');
      }

      const { reclaimProofRequestConfig } = await response.json();

      // Reconstruct proof request
      const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(
        reclaimProofRequestConfig
      );

      // Trigger verification flow (this will show QR code)
      await reclaimProofRequest.triggerReclaimFlow();

      // Listen for results
      await reclaimProofRequest.startSession({
        onSuccess: (proofs: any) => {
          console.log('Verification successful:', proofs);
          setIsVerifying(false);
          setProof(proofs);
          setMessage({ type: 'success', text: 'Verification successful! Redirecting...' });
          // Reload the page to show domain verification
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        },
        onError: (error: Error) => {
          console.error('Verification failed:', error);
          setIsVerifying(false);
          setMessage({ type: 'error', text: error.message || 'Verification failed' });
        },
      });
    } catch (error) {
      console.error('Error:', error);
      setIsVerifying(false);
      setMessage({ type: 'error', text: (error as Error).message || 'Failed to start verification' });
    }
  };

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setMessage(null);
    setProof(null);
  };

  // Get country flag emoji
  const getCountryFlag = (countryName: string): string => {
    const countryToCode: { [key: string]: string } = {
      'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Andorra': 'AD', 'Angola': 'AO',
      'Antigua and Barbuda': 'AG', 'Argentina': 'AR', 'Armenia': 'AM', 'Australia': 'AU', 'Austria': 'AT',
      'Azerbaijan': 'AZ', 'Bahamas': 'BS', 'Bahrain': 'BH', 'Bangladesh': 'BD', 'Barbados': 'BB',
      'Belarus': 'BY', 'Belgium': 'BE', 'Belize': 'BZ', 'Benin': 'BJ', 'Bhutan': 'BT',
      'Bolivia': 'BO', 'Bosnia and Herzegovina': 'BA', 'Botswana': 'BW', 'Brazil': 'BR', 'Brunei': 'BN',
      'Bulgaria': 'BG', 'Burkina Faso': 'BF', 'Burundi': 'BI', 'Cambodia': 'KH', 'Cameroon': 'CM',
      'Canada': 'CA', 'Cape Verde': 'CV', 'Central African Republic': 'CF', 'Chad': 'TD', 'Chile': 'CL',
      'China': 'CN', 'Colombia': 'CO', 'Comoros': 'KM', 'Congo': 'CG', 'Costa Rica': 'CR',
      'Croatia': 'HR', 'Cuba': 'CU', 'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Denmark': 'DK',
      'Djibouti': 'DJ', 'Dominica': 'DM', 'Dominican Republic': 'DO', 'Ecuador': 'EC', 'Egypt': 'EG',
      'El Salvador': 'SV', 'Equatorial Guinea': 'GQ', 'Eritrea': 'ER', 'Estonia': 'EE', 'Eswatini': 'SZ',
      'Ethiopia': 'ET', 'Fiji': 'FJ', 'Finland': 'FI', 'France': 'FR', 'Gabon': 'GA',
      'Gambia': 'GM', 'Georgia': 'GE', 'Germany': 'DE', 'Ghana': 'GH', 'Greece': 'GR',
      'Grenada': 'GD', 'Guatemala': 'GT', 'Guinea': 'GN', 'Guinea-Bissau': 'GW', 'Guyana': 'GY',
      'Haiti': 'HT', 'Honduras': 'HN', 'Hungary': 'HU', 'Iceland': 'IS', 'India': 'IN',
      'Indonesia': 'ID', 'Iran': 'IR', 'Iraq': 'IQ', 'Ireland': 'IE', 'Israel': 'IL',
      'Italy': 'IT', 'Jamaica': 'JM', 'Japan': 'JP', 'Jordan': 'JO', 'Kazakhstan': 'KZ',
      'Kenya': 'KE', 'Kiribati': 'KI', 'Kuwait': 'KW', 'Kyrgyzstan': 'KG', 'Laos': 'LA',
      'Latvia': 'LV', 'Lebanon': 'LB', 'Lesotho': 'LS', 'Liberia': 'LR', 'Libya': 'LY',
      'Liechtenstein': 'LI', 'Lithuania': 'LT', 'Luxembourg': 'LU', 'Madagascar': 'MG', 'Malawi': 'MW',
      'Malaysia': 'MY', 'Maldives': 'MV', 'Mali': 'ML', 'Malta': 'MT', 'Marshall Islands': 'MH',
      'Mauritania': 'MR', 'Mauritius': 'MU', 'Mexico': 'MX', 'Micronesia': 'FM', 'Moldova': 'MD',
      'Monaco': 'MC', 'Mongolia': 'MN', 'Montenegro': 'ME', 'Morocco': 'MA', 'Mozambique': 'MZ',
      'Myanmar': 'MM', 'Namibia': 'NA', 'Nauru': 'NR', 'Nepal': 'NP', 'Netherlands': 'NL',
      'New Zealand': 'NZ', 'Nicaragua': 'NI', 'Niger': 'NE', 'Nigeria': 'NG', 'North Korea': 'KP',
      'North Macedonia': 'MK', 'Norway': 'NO', 'Oman': 'OM', 'Pakistan': 'PK', 'Palau': 'PW',
      'Palestine': 'PS', 'Panama': 'PA', 'Papua New Guinea': 'PG', 'Paraguay': 'PY', 'Peru': 'PE',
      'Philippines': 'PH', 'Poland': 'PL', 'Portugal': 'PT', 'Qatar': 'QA', 'Romania': 'RO',
      'Russia': 'RU', 'Rwanda': 'RW', 'Saint Kitts and Nevis': 'KN', 'Saint Lucia': 'LC', 'Saint Vincent and the Grenadines': 'VC',
      'Samoa': 'WS', 'San Marino': 'SM', 'Sao Tome and Principe': 'ST', 'Saudi Arabia': 'SA', 'Senegal': 'SN',
      'Serbia': 'RS', 'Seychelles': 'SC', 'Sierra Leone': 'SL', 'Singapore': 'SG', 'Slovakia': 'SK',
      'Slovenia': 'SI', 'Solomon Islands': 'SB', 'Somalia': 'SO', 'South Africa': 'ZA', 'South Korea': 'KR',
      'South Sudan': 'SS', 'Spain': 'ES', 'Sri Lanka': 'LK', 'Sudan': 'SD', 'Suriname': 'SR',
      'Sweden': 'SE', 'Switzerland': 'CH', 'Syria': 'SY', 'Tajikistan': 'TJ', 'Tanzania': 'TZ',
      'Thailand': 'TH', 'Timor-Leste': 'TL', 'Togo': 'TG', 'Tonga': 'TO', 'Trinidad and Tobago': 'TT',
      'Tunisia': 'TN', 'Turkey': 'TR', 'Turkmenistan': 'TM', 'Tuvalu': 'TV', 'Uganda': 'UG',
      'Ukraine': 'UA', 'United Arab Emirates': 'AE', 'United Kingdom': 'GB', 'United States': 'US', 'Uruguay': 'UY',
      'Uzbekistan': 'UZ', 'Vanuatu': 'VU', 'Vatican City': 'VA', 'Venezuela': 'VE', 'Vietnam': 'VN',
      'Yemen': 'YE', 'Zambia': 'ZM', 'Zimbabwe': 'ZW'
    };

    const code = countryToCode[countryName];
    if (!code) return '🌐';

    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-2xl p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
      {!selectedCountry ? (
        <>
          <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white text-center">
            Select Your Country
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-center">
            Choose your employer's country to verify employment
          </p>

          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-96 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {filteredCountries.map((country) => (
              <button
                key={country}
                onClick={() => handleCountrySelect(country)}
                className="p-4 rounded-lg border-2 text-left transition-all border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCountryFlag(country)}</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{country}</span>
                </div>
              </button>
            ))}
          </div>

          {filteredCountries.length === 0 && (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              No countries found matching "{searchQuery}"
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Select Provider
            </h1>
            <button
              onClick={() => setSelectedCountry(null)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Change Country
            </button>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Selected country: <strong>{selectedCountry}</strong>
          </p>

          <div className="space-y-3 mb-6">
            {availableProviders.map((provider) => {
              const isActive = provider.active !== false;
              return (
                <button
                  key={provider.id}
                  onClick={() => isActive && setSelectedProvider(provider.id)}
                  disabled={!isActive}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    !isActive
                      ? 'opacity-50 cursor-not-allowed border-zinc-300 dark:border-zinc-700'
                      : selectedProvider === provider.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-zinc-900 dark:text-white">{provider.name}</span>
                    {!isActive && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedProvider && !proof && (
            <div className="mb-6">
              <button
                onClick={handleVerification}
                disabled={isVerifying}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
              >
                {isVerifying ? '🔄 Verifying...' : '🔐 Verify with Reclaim Protocol'}
              </button>
            </div>
          )}
        </>
      )}

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {proof && (
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="text-green-800 dark:text-green-300 font-semibold mb-2">
            ✅ Verification Successful!
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            <strong>Proof ID:</strong> {proof.identifier || 'N/A'}
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
              View full proof
            </summary>
            <pre className="mt-2 p-2 bg-white dark:bg-zinc-800 rounded text-xs overflow-x-auto text-zinc-900 dark:text-zinc-100">
              {JSON.stringify(proof, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
