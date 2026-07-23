import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AuthorityBlock } from '@/components/blog/authority-block';
import { LeadGate } from '@/components/educativo/lead-gate';
import { PublicFooter } from '@/components/site/public-footer';
import { PublicHeader } from '@/components/site/public-header';
import { blogPosts, getBlogPostHashtags, getPostBySlug, getRelatedPosts } from '@/data/blog-posts';
import { getPublishedEducativoPostBySlug, getPublishedEducativoPosts } from '@/lib/educativo-posts';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug) ?? (await getPublishedEducativoPostBySlug(slug));

  if (!post) {
    return { title: 'Conteúdo não encontrado | Nogueira Cardiologia' };
  }

  return {
    title: post.seoTitle,
    description: post.seoDescription,
    keywords: [...post.tags, ...getBlogPostHashtags(post)],
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      images: [post.coverImage],
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug) ?? (await getPublishedEducativoPostBySlug(slug));

  if (!post) notFound();

  const databasePosts = await getPublishedEducativoPosts();
  const relatedPosts = [
    ...databasePosts.filter((relatedPost) => relatedPost.slug !== post.slug && relatedPost.category === post.category),
    ...getRelatedPosts(post.slug, post.category),
  ].slice(0, 3);
  const hashtags = getBlogPostHashtags(post);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seoDescription,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: post.author.name },
    publisher: { '@type': 'MedicalClinic', name: 'Nogueira Cardiologia' },
    keywords: hashtags.join(', '),
    mainEntityOfPage: `/blog/${post.slug}`,
  };

  return (
    <div className="min-h-screen bg-[#F8F8F9] text-slate-900">
      <PublicHeader />
      <main className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-[#14508B]">Início</Link></li>
            <li>/</li>
            <li><Link href="/blog" className="hover:text-[#14508B]">Educativo</Link></li>
            <li>/</li>
            <li className="text-[#14508B]">{post.category}</li>
          </ol>
        </nav>

        <article className="mt-6 rounded-3xl border border-[#14508B]/12 bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#15A7DD]">{post.category}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#103E6A] sm:text-4xl">{post.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">{post.excerpt}</p>

          <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500 sm:text-sm">
            <span>Por {post.author.name}</span>
            <span>•</span>
            <span>Publicado em {post.publishedAt}</span>
            <span>•</span>
            <span>Atualizado em {post.updatedAt}</span>
            <span>•</span>
            <span>{post.readingTime} de leitura</span>
          </div>

          <div className="relative mt-7 h-[360px] overflow-hidden rounded-2xl bg-[#0F3760]">
            <Image
              src={post.coverImage}
              alt={`Imagem oficial para ${post.title}`}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover object-[50%_20%]"
              priority
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2" aria-label="Hashtags do conteúdo educativo">
            {hashtags.map((hashtag) => (
              <span key={hashtag} className="rounded-full bg-[#EAF6FF] px-3 py-1.5 text-xs font-bold text-[#14508B]">
                {hashtag}
              </span>
            ))}
          </div>

          <LeadGate postSlug={post.slug} postTitle={post.title} sections={post.sections} />
        </article>

        <div className="mt-8 rounded-3xl bg-gradient-to-br from-[#11457B] to-[#15A7DD] p-6 text-white sm:p-8">
          <h2 className="text-2xl font-semibold">Próximo passo no seu cuidado cardiovascular</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-base">
            Para avaliação cardiovascular individualizada, acesse o portal do paciente e realize seu agendamento digital com segurança.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/#portal-paciente" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#14508B]">
              Entrar no portal do paciente
            </Link>
            <Link href="/#corpo-clinico" className="inline-flex rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white">
              Conhecer o corpo clínico
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <AuthorityBlock />
        </div>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-[#103E6A]">Leituras relacionadas</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((related) => (
              <article key={related.slug} className="rounded-2xl border border-[#14508B]/12 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#15A7DD]">{related.category}</p>
                <h3 className="mt-2 text-lg font-semibold text-[#103E6A]">
                  <Link href={`/blog/${related.slug}`}>{related.title}</Link>
                </h3>
              </article>
            ))}
          </div>
        </section>
      </div>
      </main>
      <PublicFooter />
    </div>
  );
}
