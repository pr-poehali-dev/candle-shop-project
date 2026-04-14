import { useState, useEffect, useCallback } from "react";

interface TelegramUser {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

const AUTH_URL = "https://functions.poehali.dev/50029f2a-f7b0-457a-b533-022cf6c0fc7c";
const AUTH_ME_URL = "https://functions.poehali.dev/281e8018-828d-4d16-bb85-776d3950682d";
const SESSION_KEY = "lumiere_session";

export function useAuth() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getSessionToken = () => localStorage.getItem(SESSION_KEY);

  const fetchMe = useCallback(async (token: string) => {
    try {
      const res = await fetch(AUTH_ME_URL, {
        headers: { "X-Session-Id": token },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return true;
      }
    } catch (_e) {
      return false;
    }
    return false;
  }, []);

  useEffect(() => {
    const token = getSessionToken();
    if (token) {
      fetchMe(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const loginWithTelegram = useCallback(async (telegramData: Record<string, string | number>) => {
    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramData }),
    });
    if (!res.ok) throw new Error("Auth failed");
    const data = await res.json();
    localStorage.setItem(SESSION_KEY, data.sessionToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return { user, loading, loginWithTelegram, logout, getSessionToken };
}