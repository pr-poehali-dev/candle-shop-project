import { useEffect, useRef } from "react";

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (data: Record<string, string | number>) => void;
  buttonSize?: "large" | "medium" | "small";
}

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, string | number>) => void;
  }
}

// Глобальный реестр — живёт всегда, не зависит от монтирования компонента
const authCallbacks = new Set<(data: Record<string, string | number>) => void>();
window.onTelegramAuth = (user) => {
  authCallbacks.forEach((cb) => cb(user));
};

export default function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = "medium",
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onAuthRef = useRef(onAuth);
  onAuthRef.current = onAuth;

  useEffect(() => {
    const cb = (data: Record<string, string | number>) => onAuthRef.current(data);
    authCallbacks.add(cb);
    return () => { authCallbacks.delete(cb); };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !botName) return;

    // Удаляем старый скрипт если есть
    const old = containerRef.current.querySelector("script");
    if (old) old.remove();

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", buttonSize);
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);
  }, [botName, buttonSize]);

  return <div ref={containerRef} />;
}
