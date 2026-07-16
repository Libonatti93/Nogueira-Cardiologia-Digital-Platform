const whatsappLink = 'https://wa.me/5517997440223';

export function FloatingWhatsappButton() {
  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com a Nogueira Cardiologia pelo WhatsApp"
      title="Falar com a Nogueira Cardiologia pelo WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_38px_-16px_rgba(37,211,102,0.95)] ring-4 ring-white/90 transition-all hover:-translate-y-1 hover:bg-[#1EBE5D] focus:outline-none focus:ring-[#9FE6FF] sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8 fill-current">
        <path d="M16.04 3.2C9.02 3.2 3.3 8.9 3.3 15.92c0 2.25.6 4.45 1.73 6.38L3.2 28.8l6.65-1.75a12.7 12.7 0 0 0 6.18 1.58h.01c7.02 0 12.73-5.7 12.73-12.72S23.06 3.2 16.04 3.2Zm0 23.26h-.01a10.55 10.55 0 0 1-5.38-1.47l-.39-.23-3.94 1.04 1.05-3.85-.25-.4a10.5 10.5 0 0 1-1.62-5.63c0-5.8 4.73-10.53 10.55-10.53 2.81 0 5.46 1.1 7.45 3.09a10.46 10.46 0 0 1 3.1 7.44c0 5.81-4.73 10.54-10.56 10.54Zm5.78-7.9c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.72.16-.21.32-.83 1.03-1.02 1.24-.19.21-.38.24-.7.08-.32-.16-1.34-.49-2.55-1.56-.94-.84-1.58-1.88-1.77-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.38.48-.57.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.57-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.1-1.12 2.68s1.15 3.1 1.31 3.31c.16.21 2.27 3.47 5.5 4.86.77.33 1.37.53 1.84.68.77.24 1.47.21 2.02.13.62-.09 1.88-.77 2.15-1.51.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  );
}
