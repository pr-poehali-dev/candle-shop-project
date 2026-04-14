import { useEffect, useRef, useCallback } from "react";

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

export default function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = "medium",
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onAuthRef = useRef(onAuth);
  onAuthRef.current = onAuth;

  const stableOnAuth = useCallback((data: Record<string, string | number>) => {
    onAuthRef.current(data);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !botName) return;

    window.onTelegramAuth = stableOnAuth;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", buttonSize);
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [botName, buttonSize, stableOnAuth]);

  return (
    <div ref={containerRef}>
      {!botName && (
        <span className="text-xs text-muted-foreground">Войти через Telegram</span>
      )}
    </div>
  );
}
