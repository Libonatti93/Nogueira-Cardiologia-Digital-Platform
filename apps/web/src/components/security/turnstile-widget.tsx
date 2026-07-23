'use client';

import Script from 'next/script';

type TurnstileWidgetProps = {
  action: string;
};

declare global {
  interface Window {
    turnstile?: {
      reset: () => void;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function TurnstileWidget({ action }: TurnstileWidgetProps) {
  if (!siteKey) return null;

  return (
    <div className="grid gap-2">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      <div
        className="cf-turnstile min-h-[65px]"
        data-sitekey={siteKey}
        data-action={action}
        data-theme="light"
      />
      <p className="text-xs leading-5 text-slate-500">
        Proteção antirobô para manter o portal seguro e evitar cadastros falsos.
      </p>
    </div>
  );
}

export function resetTurnstile() {
  window.turnstile?.reset();
}
