import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AuthorityBlock } from '@/components/blog/authority-block';
import { PublicFooter } from '@/components/site/public-footer';
import { PublicHeader } from '@/components/site/public-header';
import { getBlogCategorySlug, getBlogPostHashtags, getCanonicalBlogCategory, getRecentPosts } from '@/data/blog-posts';
import { getPublishedEducativoPosts } from '@/lib/educativo-posts';

type BlogPageProps = {
  searchParams: Promise<{ tema?: string; pagina?: string; busca?: string }>;
};

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasQueryVariant = Boolean(params.tema || params.busca || (params.pagina && params.pagina !== '1'));

  return {
    title: 'Educativo de Cardiologia | Nogueira Cardiologia',
    description:
      'Conteúdo educativo sobre check-up cardiológico, hipertensão, sintomas cardíacos, coronariopatias e cardiomiopatias em São José do Rio Preto.',
    alternates: { canonical: '/blog' },
    robots: hasQueryVariant ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const databasePosts = await getPublishedEducativoPosts();
  const recentPosts = [...databasePosts, ...getRecentPosts()].sort((firstPost, secondPost) =>
    secondPost.publishedAt.localeCompare(firstPost.publishedAt),
  );
  const categoryMap = recentPosts.reduce((map, post) => {
    const category = getCanonicalBlogCategory(post.category);
    const current = map.get(category) ?? 0;
    map.set(category, current + 1);
    return map;
  }, new Map<string, number>());
  const categories = [...categoryMap.entries()]
    .map(([name, count]) => ({ name, slug: getBlogCategorySlug(name), count }))
    .sort((firstCategory, secondCategory) => firstCategory.name.localeCompare(secondCategory.name, 'pt-BR'));
  const selectedCategory = categories.find((category) => category.slug === params.tema);
  const categoryPosts = selectedCategory
    ? recentPosts.filter((post) => getCanonicalBlogCategory(post.category) === selectedCategory.name)
    : recentPosts;
  const searchTerm = params.busca?.trim() ?? '';
  const normalizedSearch = searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filteredPosts = normalizedSearch
    ? categoryPosts.filter((post) =>
        [post.title, post.excerpt, post.category, ...post.tags]
          .join(' ')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(normalizedSearch),
      )
    : categoryPosts;
  const postsPerPage = 5;
  const requestedPage = Number.parseInt(params.pagina ?? '1', 10);
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const visiblePosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);
  const totalPosts = recentPosts.length;
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    if (selectedCategory) query.set('tema', selectedCategory.slug);
    if (searchTerm) query.set('busca', searchTerm);
    if (page > 1) query.set('pagina', String(page));
    return query.size ? `/blog?${query.toString()}#conteudos` : '/blog#conteudos';
  };

  return (
    <div className="min-h-screen bg-[#F8F8F9] text-slate-900">
      <PublicHeader />
      <main className="pb-16">
      <section className="bg-gradient-to-br from-[#103E6A] via-[#14508B] to-[#15A7DD] py-16 text-white sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/85 sm:text-sm">Educativo Nogueira Cardiologia</p>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Conteúdo educativo em cardiologia para prevenção, orientação e cuidado com o coração
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/90 sm:text-base">
            Materiais sobre check-up cardiológico, hipertensão arterial, sintomas cardíacos, fatores de risco, coronariopatias e cardiomiopatias, com linguagem clara para pacientes e famílias.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#14508B]">
              Conhecer a clínica
            </Link>
            <Link href="/#portal-paciente" className="cta-pulse inline-flex rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white">
              Marcar consulta
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#14508B]/12 bg-white p-4 shadow-[0_24px_70px_-54px_rgba(20,80,139,0.75)] sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Escolha por tema</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#103E6A]">Encontre o conteúdo certo mais rápido</h2>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {selectedCategory
                ? `${filteredPosts.length} conteúdo${filteredPosts.length === 1 ? '' : 's'} em ${selectedCategory.name}.`
                : `${totalPosts} conteúdos educativos disponíveis.`}
            </p>
          </div>

          <form action="/blog" method="get" className="mt-5 flex flex-col gap-3 sm:flex-row">
            {selectedCategory ? <input type="hidden" name="tema" value={selectedCategory.slug} /> : null}
            <label className="relative flex-1">
              <span className="sr-only">Buscar conteúdo educativo</span>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="search"
                name="busca"
                defaultValue={searchTerm}
                placeholder="Busque: pressão alta, dor no peito, colesterol..."
                className="min-h-12 w-full rounded-2xl border border-[#14508B]/18 bg-[#F8FBFF] py-3 pl-12 pr-4 text-sm text-slate-800 outline-none focus:border-[#14508B] focus:ring-2 focus:ring-[#15A7DD]/20"
              />
            </label>
            <button type="submit" className="min-h-12 rounded-full bg-[#14508B] px-6 text-sm font-bold text-white hover:bg-[#0F3760]">
              Buscar conteúdo
            </button>
            {searchTerm ? (
              <Link href={selectedCategory ? `/blog?tema=${selectedCategory.slug}` : '/blog'} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#14508B]/20 px-5 text-sm font-bold text-[#14508B]">
                Limpar busca
              </Link>
            ) : null}
          </form>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
            <Link
              href="/blog#conteudos"
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition-colors ${
                selectedCategory
                  ? 'border-[#14508B]/14 bg-[#F4F8FD] text-[#14508B] hover:border-[#14508B]/35'
                  : 'border-[#14508B] bg-[#14508B] text-white'
              }`}
            >
              Todos
              <span className={`text-xs ${selectedCategory ? 'text-slate-500' : 'text-white/80'}`}>{totalPosts}</span>
            </Link>
            {categories.map((category) => {
              const isActive = selectedCategory?.slug === category.slug;

              return (
                <Link
                  key={category.slug}
                  href={`/blog?tema=${category.slug}#conteudos`}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'border-[#14508B] bg-[#14508B] text-white'
                      : 'border-[#14508B]/14 bg-[#F4F8FD] text-[#14508B] hover:border-[#14508B]/35 hover:bg-white'
                  }`}
                >
                  {category.name}
                  <span className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{category.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <AuthorityBlock />
      </section>

      <section id="conteudos" className="mx-auto mt-12 w-full max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 border-b border-[#14508B]/12 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Biblioteca educativa</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#103E6A] sm:text-3xl">
              {searchTerm ? `Resultados para “${searchTerm}”` : selectedCategory ? selectedCategory.name : 'Todos os conteúdos'}
            </h2>
          </div>
          {selectedCategory ? (
            <Link href="/blog#conteudos" className="text-sm font-semibold text-[#14508B]">
              Limpar filtro
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {visiblePosts.map((post) => (
            <article key={post.slug} className="overflow-hidden rounded-2xl border border-[#14508B]/10 bg-white transition-colors hover:border-[#14508B]/30">
              <div className="grid sm:grid-cols-[180px_1fr]">
                <div className="relative min-h-[170px] bg-[#0F3760]">
                  <Image
                    src={post.coverImage}
                    alt={`Imagem oficial para ${post.title}`}
                    fill
                    sizes="(max-width: 639px) 100vw, 180px"
                    className="object-cover object-[50%_20%]"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#15A7DD]">{post.category}</p>
                  <h3 className="mt-2 text-xl font-semibold leading-snug text-[#103E6A]">
                    <Link href={`/blog/${post.slug}`} className="hover:text-[#14508B]">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{post.excerpt}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {getBlogPostHashtags(post).slice(0, 4).map((hashtag) => (
                      <span key={hashtag} className="rounded-full bg-[#EAF6FF] px-2.5 py-1 text-[11px] font-bold text-[#14508B]">
                        {hashtag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{post.readingTime}</span>
                    <span>•</span>
                    <span>{post.publishedAt}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!visiblePosts.length ? (
          <div className="mt-6 rounded-2xl border border-[#14508B]/12 bg-white p-8 text-center">
            <h3 className="text-xl font-semibold text-[#103E6A]">Nenhum conteúdo encontrado</h3>
            <p className="mt-2 text-sm text-slate-600">Tente outra palavra, como “pressão”, “palpitação”, “colesterol” ou “check-up”.</p>
          </div>
        ) : null}

        {totalPages > 1 ? (
          <nav aria-label="Paginação dos conteúdos" className="mt-8 flex items-center justify-center gap-4">
            {currentPage > 1 ? (
              <Link href={pageHref(currentPage - 1)} aria-label="Página anterior" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#14508B]/20 bg-white text-2xl font-bold text-[#14508B] hover:border-[#14508B] hover:bg-[#EAF4FF]">←</Link>
            ) : <span className="h-12 w-12" aria-hidden="true" />}
            <span className="min-w-24 text-center text-sm font-bold text-[#103E6A]">
              {currentPage} de {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link href={pageHref(currentPage + 1)} aria-label="Próxima página" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#14508B]/20 bg-white text-2xl font-bold text-[#14508B] hover:border-[#14508B] hover:bg-[#EAF4FF]">→</Link>
            ) : <span className="h-12 w-12" aria-hidden="true" />}
          </nav>
        ) : null}

        <div className="mt-10 rounded-2xl border border-[#14508B]/12 bg-[#EAF6FF] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <h2 className="text-xl font-semibold text-[#103E6A]">Quer orientação para o seu caso?</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              O educativo ajuda a entender temas importantes, mas a decisão clínica depende do histórico, sintomas e exames de cada paciente.
            </p>
          </div>
          <Link
            href="/#portal-paciente"
            className="cta-pulse mt-5 inline-flex rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0F3760] sm:mt-0"
          >
            Marcar consulta
          </Link>
        </div>
      </section>
      </main>
      <PublicFooter />
    </div>
  );
}
