import { useState, useEffect } from 'react';

const TERMS_AGREEMENT_KEY = 'shopmart_terms_agreed';

export function useTermsAgreement() {
  const [hasAgreed, setHasAgreed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load agreement status from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TERMS_AGREEMENT_KEY);
      setHasAgreed(stored === 'true');
    } catch (error) {
      console.error('Error reading terms agreement from localStorage:', error);
      setHasAgreed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Accept terms and save to localStorage
  const acceptTerms = () => {
    try {
      localStorage.setItem(TERMS_AGREEMENT_KEY, 'true');
      setHasAgreed(true);
    } catch (error) {
      console.error('Error saving terms agreement to localStorage:', error);
    }
  };

  // Reject terms and clear localStorage
  const rejectTerms = () => {
    try {
      localStorage.removeItem(TERMS_AGREEMENT_KEY);
      setHasAgreed(false);
    } catch (error) {
      console.error('Error clearing terms agreement from localStorage:', error);
    }
  };

  return {
    hasAgreed,
    isLoading,
    acceptTerms,
    rejectTerms,
  };
}
