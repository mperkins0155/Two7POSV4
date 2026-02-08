// Runtime configuration
let runtimeConfig: {
  API_BASE_URL: string;
} | null = null;

// Configuration loading state
let configLoading = true;

// Default fallback configuration
const defaultConfig = {
  API_BASE_URL: 'http://127.0.0.1:8000', // Only used if runtime config fails to load
};

// Function to load runtime configuration
export async function loadRuntimeConfig(): Promise<void> {
  try {
    // Try to load configuration from a config endpoint
    const response = await fetch('/api/config');
    if (!response.ok && response.status === 404) {
      if (import.meta.env.DEV) {
        console.debug('Config endpoint not found at /api/config, trying /api/v1/config');
      }
      await loadRuntimeConfigFallback();
      return;
    }
    await parseRuntimeConfig(response);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('Failed to load runtime config, using defaults:', error);
    }
  } finally {
    configLoading = false;
  }
}

async function loadRuntimeConfigFallback(): Promise<void> {
  const response = await fetch('/api/v1/config');
  await parseRuntimeConfig(response);
}

async function parseRuntimeConfig(response: Response): Promise<void> {
  if (response.ok) {
    const contentType = response.headers.get('content-type');
    // Only parse as JSON if the response is actually JSON
    if (contentType && contentType.includes('application/json')) {
      runtimeConfig = await response.json();
    } else if (import.meta.env.DEV) {
      console.debug('Config endpoint returned non-JSON response, skipping runtime config');
    }
  } else if (import.meta.env.DEV) {
    console.debug('Config fetch failed with status:', response.status);
  }
}

// Get current configuration
export function getConfig() {
  // If config is still loading, return default config to avoid using stale Vite env vars
  if (configLoading) {
    return defaultConfig;
  }

  // First try runtime config (for Lambda)
  if (runtimeConfig) {
    return runtimeConfig;
  }

  // Then try Vite environment variables (for local development)
  if (import.meta.env.VITE_API_BASE_URL) {
    const viteConfig = {
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    };
    return viteConfig;
  }

  // Finally fall back to default
  return defaultConfig;
}

// Dynamic API_BASE_URL getter - this will always return the current config
export function getAPIBaseURL(): string {
  return getConfig().API_BASE_URL;
}

// For backward compatibility, but this should be avoided
// Removed static export to prevent using stale config values
// export const API_BASE_URL = getAPIBaseURL();

export const config = {
  get API_BASE_URL() {
    return getAPIBaseURL();
  },
};
