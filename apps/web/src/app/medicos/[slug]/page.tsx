import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicFooter } from '@/components/site/public-footer';
import { PublicHeader } from '@/components/site/public-header';
import { doctors, getDoctorBySlug } from '@/data/doctors';
import { absoluteUrl, clinic, siteUrl } from '@/lib/seo';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return doctors.map((doctor) => ({ slug: doctor.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const doctor = getDoctorBySlug((await params).slug);
  if (!doctor) return { title: 'Médico não encontrado | Nogueira Cardiologia' };

  return {
    title: doctor.seoTitle,
    description: doctor.seoDescription,
    alternates: { canonical: `/medicos/${doctor.slug}` },
    openGraph: {
      type: 'profile',
      locale: 'pt_BR',
      siteName: clinic.name,
      url: `/medicos/${doctor.slug}`,
      title: doctor.seoTitle,
      description: doctor.seoDescription,
      images: [{ url: doctor.image, alt: doctor.name }],
    },
  };
}

export default async function DoctorPage({ params }: PageProps) {
  const doctor = getDoctorBySlug((await params).slug);
  if (!doctor) notFound();

  const physicianSchema = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    '@id': `${absoluteUrl(`/medicos/${doctor.slug}`)}#physician`,
    name: doctor.name,
    url: absoluteUrl(`/medicos/${doctor.slug}`),
    image: absoluteUrl(doctor.image),
    description: doctor.introduction,
    medicalSpecialty: 'Cardiovascular',
    identifier: doctor.crm,
    worksFor: { '@id': `${siteUrl}/#clinic` },
    address: { '@type': 'PostalAddress', ...clinic.address },
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <PublicHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(physicianSchema) }} />
      <main>
        <section className="bg-[#0A2C4D] py-12 text-white sm:py-16">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[280px_1fr] md:items-center lg:px-8">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/15 bg-white/10">
              <Image src={doctor.image} alt={`Foto oficial de ${doctor.name}`} fill priority sizes="280px" className="object-cover object-top" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9FE6FF]">Corpo clínico</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{doctor.name}</h1>
              <p className="mt-3 font-bold text-[#9FE6FF]">{doctor.crm}</p>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/85">{doctor.introduction}</p>
              <Link href="/portal" className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-[#14508B]">
                Marcar consulta
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:px-8">
          <section className="rounded-3xl border border-[#14508B]/12 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-[#0F3760]">Áreas de atuação</h2>
            <ul className="mt-5 grid gap-3">
              {doctor.specialties.map((specialty) => (
                <li key={specialty} className="border-l-2 border-[#15A7DD] bg-[#F4F9FF] px-4 py-3 text-sm font-semibold text-[#103E6A]">
                  {specialty}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-[#14508B]/12 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-[#0F3760]">Trajetória profissional</h2>
            <ul className="mt-5 grid gap-3 text-sm leading-7 text-slate-600">
              {doctor.credentials.map((credential) => <li key={credential}>• {credential}</li>)}
            </ul>
          </section>
        </div>

        <section className="mx-auto mb-14 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#14508B] p-6 text-white sm:p-8">
            <h2 className="text-2xl font-semibold">Informação e acompanhamento cardiovascular</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
              Conheça os conteúdos educativos revisados pela clínica ou acesse o portal para solicitar uma avaliação individualizada.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/blog" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#14508B]">Ler conteúdos</Link>
              <Link href="/portal" className="rounded-full border border-white/35 px-6 py-3 text-sm font-bold">Acessar portal</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
