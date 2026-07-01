import { useApp } from '@/context/AppContext';

/**
 * useRole — convenience hook for accessing and setting the user's role.
 *
 * Role is stored in localStorage under 'gtl_role' and mirrored in
 * AppContext. It is set during the onboarding flow.
 *
 * TODO: When backend is available, also sync to POST /api/user
 *       via AppContext.setRole().
 */
export function useRole() {
  const { role, setRole, isHydrated } = useApp();

  return {
    role,
    setRole,
    isHydrated,
    isClient:     role === 'CLIENT',
    isFreelancer: role === 'FREELANCER',
    hasRole:      !!role,
  };
}
