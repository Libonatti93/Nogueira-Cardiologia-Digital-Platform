import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AuthorityBlock } from '@/components/blog/authority-block';
import { getFeaturedPosts, getRecentPosts } from '@/data/blog-posts';

export const metadata: Metadata = {
  title: 'Educativo de Cardiologia | Nogueira Cardiologia',
  description:
    'Conteúdo educativo sobre check-up cardiológico, hipertensão, sintomas cardíacos, coronariopatias e cardiomiopatias em São José do Rio Preto.',
};

const categories = [
  'Check-up cardiológico',
  'Hipertensão arterial',
  'Sintomas cardíacos',
  'Prevenção cardiovascular',
  'Cardiologia clínica',
];

export default function BlogPage() {
  const featuredPosts = getFeaturedPosts();
  const recentPosts = getRecentPosts();

  return (
    <main className="min-h-screen bg-[#F8F8F9] pb-16 text-slate-900">
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
            <Link href="/#portal-paciente" className="inline-flex rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white">
              Acessar agendamento digital
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <AuthorityBlock />
      </section>

      <section className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold text-[#103E6A] sm:text-3xl">Conteúdos em destaque</h2>
          <Link href="/#corpo-clinico" className="text-sm font-semibold text-[#14508B]">
            Ver corpo clínico
          </Link>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {featuredPosts.map((post) => (
            <article key={post.slug} className="overflow-hidden rounded-3xl border border-[#14508B]/15 bg-white">
              <div className="relative h-64 bg-[#0F3760]">
                <Image
                  src={post.coverImage}
                  alt={`Imagem oficial para ${post.title}`}
                  fill
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover object-[50%_20%]"
                />
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#15A7DD]">{post.category}</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#103E6A]">
                  <Link href={`/blog/${post.slug}`} className="hover:text-[#14508B]">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_280px] lg:px-8">
        <div>
          <h2 className="text-2xl font-semibold text-[#103E6A] sm:text-3xl">Conteúdos educativos recentes</h2>
          <div className="mt-6 space-y-4">
            {recentPosts.map((post) => (
              <article key={post.slug} className="overflow-hidden rounded-2xl border border-[#14508B]/10 bg-white">
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
                    <h3 className="text-xl font-semibold text-[#103E6A]">
                      <Link href={`/blog/${post.slug}`} className="hover:text-[#14508B]">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
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
        </div>

        <aside className="rounded-3xl border border-[#14508B]/12 bg-white p-6 h-fit">
          <h2 className="text-lg font-semibold text-[#103E6A]">Temas e categorias</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {categories.map((category) => (
              <li key={category} className="rounded-xl bg-[#F4F8FD] px-3 py-2">
                {category}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
