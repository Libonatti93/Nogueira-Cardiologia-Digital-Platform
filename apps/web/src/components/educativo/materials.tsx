'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { KeyboardEvent, TouchEvent } from 'react';
import type { Material } from '@/lib/educativo-types';
import { materialUrl } from '@/lib/educativo-types';
import styles from './materials.module.css';

// Bookmarks contain only a material ID / page number. They never grant access or cache slides.
const bookmarkEvent = 'educativo-bookmark';
function subscribeBookmarks(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(bookmarkEvent, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(bookmarkEvent, callback);
  };
}
function useBookmark(key: string) {
  return useSyncExternalStore(subscribeBookmarks, () => {
    try { return localStorage.getItem(key) || ''; } catch { return ''; }
  }, () => null);
}
function saveBookmark(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event(bookmarkEvent));
  } catch { /* Reading works when storage is unavailable, too. */ }
}
const pageKey = (material: Material) => `nogueira-aula:${material.post_id}:${material.id}:pagina`;
const ready = (material: Material) => material.type === 'IMAGE' || material.page_count > 0;
const format = (material: Material) => material.type === 'POWERPOINT' ? 'Aula em slides' : material.type === 'PDF' ? 'Leitura em PDF' : 'Imagem de apoio';

function Icon({ name }: { name: 'screen' | 'expand' | 'close' | 'left' | 'right' | 'zoom' | 'play' }) {
  const paths = {
    screen: <><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8m-4-5v5"/></>,
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    left: <path d="m15 5-7 7 7 7"/>,
    right: <path d="m9 5 7 7-7 7"/>,
    zoom: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6m-3-3v6"/></>,
    play: <path d="m9 5 11 7-11 7Z"/>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function SlideImage({ material, page, onLoaded }: { material: Material; page: number; onLoaded: () => void }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const url = material.type === 'IMAGE' ? materialUrl(material.id) : `${materialUrl(material.id)}?page=${page}`;
  return <>
    {status === 'loading' && <div className={styles.message} role="status"><span className={styles.spinner}/><p>Preparando sua aula…</p></div>}
    {status === 'error' ? <div className={styles.message} role="alert">
      <strong>Não foi possível carregar esta parte da aula.</strong>
      <p>Confira sua conexão e tente novamente. Se o acesso expirou, recarregue a aula para entrar novamente.</p>
      <button className={styles.control} onClick={() => { setStatus('loading'); setAttempt(value => value + 1); }}>Tentar novamente</button>
    </div> :
      // Protected images use the session cookie directly, never an image optimization proxy.
      // eslint-disable-next-line @next/next/no-img-element
      <img key={attempt} src={`${url}${attempt ? `${url.includes('?') ? '&' : '?'}retry=${attempt}` : ''}`}
        alt={`${material.title}, ${material.type === 'POWERPOINT' ? 'slide' : 'página'} ${page}`}
        draggable={false} className={status === 'ready' ? styles.slide : styles.loadingSlide}
        onLoad={() => { setStatus('ready'); onLoaded(); }} onError={() => setStatus('error')}/>
    }
  </>;
}

function LessonPlayer({ material, onRead }: { material: Material; onRead: () => void }) {
  const saved = useBookmark(pageKey(material));
  const count = material.type === 'IMAGE' ? 1 : material.page_count;
  const storedPage = Number(saved);
  const resumePage = Number.isInteger(storedPage) && storedPage >= 1 && storedPage <= count ? storedPage : 1;
  const [requestedPage, setRequestedPage] = useState<number | null>(null);
  const page = requestedPage ?? resumePage;
  const [expanded, setExpanded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const unit = material.type === 'POWERPOINT' ? 'Slide' : 'Página';
  const plural = material.type === 'POWERPOINT' ? 'slides' : 'páginas';

  useEffect(() => {
    if (!expanded || !dialog.current) return;
    const modal = dialog.current;
    const container = modal.parentElement;
    const fullscreenTarget = player.current;
    let enteredNativeFullscreen = false;
    const fullscreenChanged = () => {
      if (document.fullscreenElement === fullscreenTarget) enteredNativeFullscreen = true;
      else if (enteredNativeFullscreen) setExpanded(false);
    };
    modal.showModal();
    document.addEventListener('fullscreenchange', fullscreenChanged);
    // The modal still fills the viewport on browsers that cannot fullscreen an element.
    if (document.fullscreenEnabled && fullscreenTarget?.requestFullscreen) void fullscreenTarget.requestFullscreen().catch(() => {});
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChanged);
      if (document.fullscreenElement === fullscreenTarget) void document.exitFullscreen().catch(() => {});
      modal.close();
      document.body.style.overflow = previousOverflow;
      container?.querySelector<HTMLElement>('[data-lesson-player]')?.focus({ preventScroll: true });
    };
  }, [expanded]);

  function goTo(next: number) {
    setRequestedPage(Math.min(count, Math.max(1, next)));
    setZoomed(false);
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat ||
      (event.target as HTMLElement).closest('input, select, textarea, [contenteditable="true"]')) return;
    const next = event.key === 'ArrowRight' ? page + 1 : event.key === 'ArrowLeft' ? page - 1 : event.key === 'Home' ? 1 : event.key === 'End' ? count : null;
    if (next !== null) { event.preventDefault(); goTo(next); }
  }
  function touchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touch.current;
    touch.current = null;
    if (!start || zoomed || !event.changedTouches[0]) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(page + (dx < 0 ? 1 : -1));
  }

  const surface = <div ref={player} className={styles.player} data-lesson-player tabIndex={0} onKeyDown={keyboard} aria-label={`Visualização de ${material.title}`}>
    <div className={styles.playerHeader}>
      <div className={styles.materialHeading}><span className={styles.eyebrow}>{format(material)}</span><h3>{material.title}</h3></div>
      <div className={styles.tools}>
        <button className={styles.control} aria-label={zoomed ? 'Ajustar à tela' : 'Ampliar slide'} aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}><Icon name="zoom"/><span>{zoomed ? 'Ajustar' : 'Ampliar'}</span></button>
        <button className={styles.control} onClick={() => setExpanded(value => !value)} aria-label={expanded ? 'Sair da tela cheia' : 'Tela cheia'}><Icon name={expanded ? 'close' : 'expand'}/><span>{expanded ? 'Sair' : 'Tela cheia'}</span></button>
      </div>
    </div>
    <div className={`${styles.stage} ${zoomed ? styles.zoomed : ''}`} onContextMenu={event => event.preventDefault()}
      onTouchStart={event => { touch.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }}
      onTouchMove={event => { if (event.touches.length !== 1) touch.current = null; }} onTouchEnd={touchEnd} onTouchCancel={() => { touch.current = null; }}>
      {saved === null ? <div className={styles.message} role="status">Preparando sua aula…</div> :
        <SlideImage key={`${material.id}-${page}`} material={material} page={page} onLoaded={() => {
          setLoadedPage(page);
          saveBookmark(pageKey(material), String(page));
          onRead();
        }}/>}
    </div>
    <div className={styles.progress} role="progressbar" aria-label="Posição na aula" aria-valuemin={1} aria-valuemax={count} aria-valuenow={page} aria-valuetext={`${unit} ${page} de ${count}`}><span style={{ width: `${page / count * 100}%` }}/></div>
    <div className={styles.transport}>
      <button className={styles.control} disabled={page === 1} onClick={() => goTo(page - 1)} aria-label={material.type === 'POWERPOINT' ? 'Slide anterior' : 'Página anterior'}><Icon name="left"/><span>Anterior</span></button>
      <div className={styles.position}><strong aria-live="polite" aria-atomic="true">{unit} {page} <span>de {count}</span></strong>{count > 1 && <button onClick={() => setIndexOpen(value => !value)} aria-expanded={indexOpen} aria-controls={`indice-${material.id}`}>{indexOpen ? 'Fechar índice' : `Ver ${plural}`}</button>}</div>
      <button className={`${styles.control} ${styles.next}`} disabled={page === count} onClick={() => goTo(page + 1)} aria-label={material.type === 'POWERPOINT' ? 'Próximo slide' : 'Próxima página'}><span>Próximo</span><Icon name="right"/></button>
    </div>
    {indexOpen && <nav id={`indice-${material.id}`} className={styles.pageIndex} aria-label={`Índice de ${plural}`}>
      {Array.from({ length: count }, (_, index) => <button key={index} aria-label={`${unit} ${index + 1}`} aria-current={page === index + 1 ? 'page' : undefined} onClick={() => { goTo(index + 1); setIndexOpen(false); player.current?.focus({ preventScroll: true }); }}>{index + 1}</button>)}
    </nav>}
    <div className={styles.playerFooter}>
      <p>{loadedPage === page && page === count && count > 1 ? 'Você chegou ao final deste material.' : 'Siga no seu ritmo. Use as setas ou deslize para os lados.'}</p>
      {page > 1 && <button onClick={() => goTo(1)}>Voltar ao início</button>}
    </div>
  </div>;

  return <>
    {!expanded && surface}
    <dialog ref={dialog} className={styles.fullscreen} aria-label={`Aula em tela cheia: ${material.title}`} onCancel={event => { event.preventDefault(); setExpanded(false); }} onClose={() => setExpanded(false)}>{expanded && surface}</dialog>
  </>;
}

function Classroom({ materials }: { materials: Material[] }) {
  const selectionKey = `nogueira-aula:${materials[0].post_id}:material`;
  const savedSelection = useBookmark(selectionKey);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = materials.find(material => material.id === (selectedId ?? savedSelection) && ready(material)) ?? materials.find(ready);
  const anchor = useRef<HTMLDivElement>(null);
  return <section className={styles.classroom} aria-label="Materiais da aula" data-nosnippet>
    <header className={styles.heading}>
      <span className={styles.headingIcon}><Icon name="screen"/></span>
      <div><p className={styles.kicker}>CONHECIMENTO PARA CUIDAR</p><h2>Sua sala de aula</h2><p>Aprenda com o Prof. Dr. Paulo Roberto Nogueira, no seu ritmo.</p></div>
    </header>
    <div className={`${styles.layout} ${materials.length > 1 ? styles.withPlaylist : ''}`}>
      <div ref={anchor} className={styles.viewerAnchor} tabIndex={-1}>
        {selected ? <LessonPlayer key={selected.id} material={selected} onRead={() => saveBookmark(selectionKey, selected.id)}/> :
          <div className={styles.unavailable}><Icon name="screen"/><h3>Esta aula está sendo preparada</h3><p>Os materiais aparecerão aqui assim que a visualização estiver disponível.</p></div>}
        {selected && <div className={styles.description}>{selected.description && <p>{selected.description}</p>}{selected.caption && <p>{selected.caption}</p>}<p className={styles.bookmarkHint}>Sua posição é lembrada neste navegador.</p></div>}
      </div>
      {materials.length > 1 && <aside className={styles.playlist} aria-label="Conteúdo desta aula"><div className={styles.playlistHeading}><h3>Conteúdo da aula</h3><span>{materials.length} materiais</span></div>
        <ol>{materials.map((material, index) => <li key={material.id}>
          <button className={styles.materialCard} aria-current={selected?.id === material.id ? 'true' : undefined} disabled={!ready(material)} onClick={() => {
            setSelectedId(material.id);
            anchor.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
            anchor.current?.focus({ preventScroll: true });
          }}>
            <span className={styles.materialNumber}>{selected?.id === material.id ? <Icon name="play"/> : String(index + 1).padStart(2, '0')}</span>
            <span><strong>{material.title}</strong><small>{format(material)}{material.page_count > 0 ? ` · ${material.page_count} ${material.type === 'POWERPOINT' ? 'slides' : 'páginas'}` : ''}</small><small className={styles.currentLabel}>{!ready(material) ? 'Visualização em preparação' : selected?.id === material.id ? 'Em exibição' : 'Abrir material'}</small></span>
          </button>
        </li>)}</ol>
      </aside>}
    </div>
    <p className={styles.copyright}>© Prof. Dr. Paulo Roberto Nogueira · Acesso pessoal para assistir no site.</p>
  </section>;
}

export function Materials({ materials }: { materials: Material[] }) {
  return materials.length ? <Classroom key={materials[0].post_id} materials={materials}/> : null;
}
