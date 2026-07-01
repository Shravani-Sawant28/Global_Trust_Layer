'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { MOCK_JOBS, MOCK_PROFILES } from '@/lib/mockData';

/**
 * AppContext — global application state
 *
 * Provides:
 *  - role: 'CLIENT' | 'FREELANCER' | null (localStorage cached)
 *  - jobs: mock job list (replaced by real API when backend is ready)
 *  - profile: current wallet's reputation profile
 *  - setRole(role): persists role selection to localStorage
 *
 * TODO: Replace mock data reads with real API calls via api.js
 *       once the backend is running.
 */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user, authenticated } = usePrivy();

  const [role, setRoleState]     = useState(null);
  const [jobs, setJobs]          = useState(MOCK_JOBS);
  const [profile, setProfile]    = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // ── Hydrate role from localStorage on mount ─────────────────────
  useEffect(() => {
    const storedRole = localStorage.getItem('gtl_role');
    if (storedRole) setRoleState(storedRole);
    setIsHydrated(true);
  }, []);

  // ── Load profile when wallet becomes available ──────────────────
  useEffect(() => {
    if (!authenticated || !user) return;

    const wallet =
      user.wallet?.address ||
      user.linkedAccounts?.find((a) => a.type === 'wallet')?.address;

    if (wallet) {
      // TODO: Replace with real API call: getUser(wallet)
      const mockProfile = MOCK_PROFILES[wallet] || {
        wallet,
        trustScore: 0,
        jobsCompleted: 0,
        disputeCount: 0,
        totalEarned: '0',
        totalSpent: '0',
        memberSince: new Date().toISOString(),
        role: localStorage.getItem('gtl_role') || null,
      };
      setProfile(mockProfile);
      localStorage.setItem('gtl_wallet_address', wallet);
    }
  }, [authenticated, user]);

  // ── Role setter — persists to localStorage ──────────────────────
  const setRole = useCallback((newRole) => {
    setRoleState(newRole);
    localStorage.setItem('gtl_role', newRole);
    // TODO: Also call saveUserRole(walletAddress, newRole) from api.js
    //       to persist to backend when it's available.
  }, []);

  // ── Add a newly created job to the local list ───────────────────
  const addJob = useCallback((job) => {
    setJobs((prev) => [job, ...prev]);
  }, []);

  const value = {
    role,
    setRole,
    jobs,
    addJob,
    profile,
    isHydrated,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
};
