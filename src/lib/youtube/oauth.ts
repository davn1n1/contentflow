"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const OAUTH_CLIENT_ID =
  "845701276025-5gqpfppr16ito98f4dr2ulu5c744b888.apps.googleusercontent.com";
const SCOPES =
  "https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/yt-analytics-monetary.readonly";

const STORAGE_KEY = "yt_oauth_token";

// Extend Window for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              expires_in?: number;
              error?: string;
            }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

interface StoredToken {
  access_token: string;
  expires_at: number; // timestamp ms
}

function saveToken(token: string, expiresIn: number) {
  const data: StoredToken = {
    access_token: token,
    expires_at: Date.now() + expiresIn * 1000,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage not available
  }
}

function loadToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredToken = JSON.parse(raw);
    // Check if still valid (with 60s margin)
    if (Date.now() < data.expires_at - 60_000) {
      return data.access_token;
    }
    // Expired — clean up
    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

function clearToken() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage not available
  }
}

interface UseYouTubeOAuthReturn {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  expiresIn: number | null; // minutes remaining
  login: () => void;
  logout: () => void;
}

export function useYouTubeOAuth(): UseYouTubeOAuthReturn {
  const [accessToken, setAccessToken] = useState<string | null>(() => loadToken());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data: StoredToken = JSON.parse(raw);
      return data.expires_at;
    } catch {
      return null;
    }
  });
  const clientRef = useRef<{ requestAccessToken: () => void } | null>(null);
  const gsiLoadedRef = useRef(false);

  // Auto-expire token
  useEffect(() => {
    if (!expiresAt) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      setAccessToken(null);
      setExpiresAt(null);
      clearToken();
      return;
    }
    const timer = setTimeout(() => {
      setAccessToken(null);
      setExpiresAt(null);
      clearToken();
      setError("Token expirado. Reconecta para continuar.");
    }, remaining);
    return () => clearTimeout(timer);
  }, [expiresAt]);

  // Initialize token client once GIS script is loaded
  useEffect(() => {
    function initClient() {
      if (!window.google?.accounts?.oauth2 || gsiLoadedRef.current) return;
      gsiLoadedRef.current = true;

      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          setIsLoading(false);
          if (response.error) {
            setError(`OAuth error: ${response.error}`);
            return;
          }
          if (response.access_token) {
            const expiresIn = response.expires_in || 3600;
            setAccessToken(response.access_token);
            setExpiresAt(Date.now() + expiresIn * 1000);
            setError(null);
            saveToken(response.access_token, expiresIn);
          }
        },
      });
    }

    if (window.google?.accounts?.oauth2) {
      initClient();
      return;
    }

    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        initClient();
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const login = useCallback(() => {
    if (!clientRef.current) {
      setError("Google Identity Services no cargado. Recarga la pagina.");
      return;
    }
    setIsLoading(true);
    setError(null);
    clientRef.current.requestAccessToken();
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setExpiresAt(null);
    setError(null);
    clearToken();
  }, []);

  // Calculate minutes remaining
  const expiresIn = expiresAt ? Math.max(0, Math.round((expiresAt - Date.now()) / 60_000)) : null;

  return {
    accessToken,
    isAuthenticated: !!accessToken,
    isLoading,
    error,
    expiresIn,
    login,
    logout,
  };
}
