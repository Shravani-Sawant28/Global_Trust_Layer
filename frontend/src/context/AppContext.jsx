'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { MOCK_JOBS, MOCK_PROFILES } from '@/lib/mockData';
import { getJobs, getOpenJobs } from '@/lib/api';

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

    const storedJobs = localStorage.getItem('gtl_jobs');
    if (storedJobs) {
      try {
        const parsed = JSON.parse(storedJobs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge mock jobs with custom local jobs (so they don't lose mock data entirely)
          // We assume local jobs have a different ID format or we can just prepend them
          const customJobs = parsed.filter(j => !MOCK_JOBS.find(mj => mj.id === j.id));
          setJobs([...customJobs, ...MOCK_JOBS]);
        }
      } catch (e) {
        console.error(e);
      }
    }

    setIsHydrated(true);
  }, []);

  // ── Load profile when wallet becomes available ──────────────────
  useEffect(() => {
    if (!authenticated || !user) return;

    const wallet =
      user.wallet?.address ||
      user.linkedAccounts?.find((a) => a.type === 'wallet')?.address;

    if (wallet) {
      // Fetch user's jobs and open jobs from backend API
      const loadJobsFromApi = async () => {
        try {
          const [userJobsRes, openJobsRes] = await Promise.all([
            getJobs(wallet).catch(() => ({ jobs: [] })),
            getOpenJobs().catch(() => ({ jobs: [] }))
          ]);
          
          const apiJobs = [...(userJobsRes?.jobs || []), ...(openJobsRes?.jobs || [])];
          
          // Deduplicate by ID
          const uniqueApiJobs = Array.from(new Map(apiJobs.map(j => [j.id, j])).values());
          
          if (uniqueApiJobs.length > 0) {
            setJobs(prev => {
              // Merge API jobs with existing mock/local jobs (avoiding duplicates)
              const existingIds = new Set(uniqueApiJobs.map(j => j.id));
              const prevUnique = prev.filter(p => !existingIds.has(p.id));
              return [...uniqueApiJobs, ...prevUnique];
            });
          }
        } catch (err) {
          console.warn("Failed to fetch jobs from API", err);
        }
      };
      
      loadJobsFromApi();

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
    setJobs((prev) => {
      const newJobs = [job, ...prev];
      localStorage.setItem('gtl_jobs', JSON.stringify(newJobs));
      return newJobs;
    });
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
