'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

const consentStorageKey = 'nogueira-cookie-consent';

type ConsentChoice = 'all' | 'necessary';

function subscribeToConsent(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('nogueira:cookie-consent', callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('nogueira:cookie-consent', callback);
  };
}

function getConsentSnapshot() {
  return window.localStorage.getItem(consentStorageKey);
}

export function CookieConsent() {
  const consent = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, () => 'loading');

  const saveChoice = (choice: ConsentChoice) => {
    window.localStorage.setItem(consentStorageKey, choice);
    window.dispatchEvent(
      new CustomEvent('nogueira:cookie-consent', {
        detail: { choice },
      }),
    );
  };

  if (consent !== null) {
    return null;
  }

  return (
    <section
      aria-label="Preferências de cookies"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-5xl rounded-2xl border border-[#14508B]/15 bg-white/95 p-4 text-slate-700 shadow-[0_24px_70px_-24px_rgba(15,55,96,0.55)] backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF6FF] text-[#14508B]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                <path d="M12 3a4 4 0 0 0 5 5 4 4 0 0 0 4 5A9 9 0 1 1 12 3Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.5 10.5h.01M12 15h.01M7.5 16.5h.01" strokeLinecap="round" />
              </svg>
            </span>
            <h2 className="text-base font-bold text-[#0F3760] sm:text-lg">Sua privacidade importa</h2>
          </div>
          <p className="mt-2 text-sm leading-6">
            Usamos cookies necessários para o site funcionar e, com sua permissão, cookies de análise para melhorar sua experiência.
            Você pode escolher agora e alterar sua decisão depois.{' '}
            <Link href="/privacidade#cookies" className="font-semibold text-[#14508B] underline decoration-[#15A7DD]/45 underline-offset-4 hover:text-[#0F3760]">
              Saiba mais
            </Link>
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row lg:shrink-0">
          <button
            type="button"
            onClick={() => saveChoice('necessary')}
            className="min-h-11 rounded-full border border-[#14508B]/25 px-5 py-2.5 text-sm font-bold text-[#14508B] transition-colors hover:bg-[#EAF6FF] focus:outline-none focus:ring-4 focus:ring-[#9FE6FF]/60"
          >
            Somente necessários
          </button>
          <button
            type="button"
            onClick={() => saveChoice('all')}
            className="min-h-11 rounded-full bg-[#14508B] px-6 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_-18px_rgba(20,80,139,0.9)] transition-colors hover:bg-[#0F3760] focus:outline-none focus:ring-4 focus:ring-[#9FE6FF]/70"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </section>
  );
}
