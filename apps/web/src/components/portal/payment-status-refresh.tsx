'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PaymentStatusRefresh({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    const interval = window.setInterval(() => router.refresh(), 5000);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 120000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [active, router]);

  if (!active) return null;

  return (
    <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#14508B]" role="status">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
      Aguardando a confirmação segura do Asaas. Esta página será atualizada automaticamente.
    </p>
  );
}
