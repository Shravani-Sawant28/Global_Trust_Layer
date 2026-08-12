import axios from 'axios';

/**
 * Axios instance pre-configured to call the GTL backend.
 *
 * TODO: Ensure NEXT_PUBLIC_API_BASE_URL is set in .env.local
 *       once the backend is deployed.
 *
 * All requests automatically include:
 *  - JSON content-type header
 *  - Wallet address in X-Wallet-Address header (set via setWallet())
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ── Request interceptor: inject wallet address header ─────────────
api.interceptors.request.use((config) => {
  const wallet =
    typeof window !== 'undefined'
      ? localStorage.getItem('gtl_wallet_address')
      : null;
  if (wallet) {
    config.headers['X-Wallet-Address'] = wallet;
  }
  return config;
});

// ── Response interceptor: normalise errors ────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Unknown API error';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ─── Typed API helpers ────────────────────────────────────────────

/** Create a new job (off-chain metadata). */
export const createJob = (data) => api.post('/api/jobs', data);

/** Get all jobs visible to a wallet address. */
export const getJobs = (wallet) => api.get(`/api/jobs?wallet=${wallet}`);

/** Get a single job by id. */
export const getJob = (id) => api.get(`/api/jobs/${id}`);

/** Get all open (public) jobs for the Browse page. */
export const getOpenJobs = (params = {}) =>
  api.get('/api/jobs/open', { params });

/** Get or create the user record for a wallet. */
export const getUser = (wallet) => api.get(`/api/user/${wallet}`);

/** Save the user role (CLIENT | FREELANCER) after onboarding. */
export const saveUserRole = (wallet, role) =>
  api.post('/api/user', { wallet, role });

/** Get the AI trust report for a wallet. */
export const getTrustReport = (wallet) => api.get(`/api/trust/${wallet}`);

/** Raise a dispute (off-chain record). */
export const raiseDisputeRecord = (data) => api.post('/api/dispute', data);

/** Manually link on-chain job ID to a DB job. */
export const linkJobOnChain = (id, onChainJobId) => api.patch(`/api/jobs/${id}/link`, { onChainJobId });
