"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const OAUTH_CLIENT_ID =
  "845701276025-5gqpfppr16ito98f4dr2ulu5c744b888.apps.googleusercontent.com";
const SCOPES =
  "https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/yt-analytics-monetary.readonly";

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
              error?: string;
            }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

interface UseYouTubeOAuthReturn {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
}

export function useYouTubeOAuth(): UseYouTubeOAuthReturn {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<{ requestAccessToken: () => void } | null>(null);
  const gsiLoadedRef = useRef(false);

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
            setAccessToken(response.access_token);
            setError(null);
          }
        },
      });
    }

    // Check if already loaded
    if (window.google?.accounts?.oauth2) {
      initClient();
      return;
    }

    // Poll for GIS script load
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
    setError(null);
  }, []);

  return {
    accessToken,
    isAuthenticated: !!accessToken,
    isLoading,
    error,
    login,
    logout,
  };
}
