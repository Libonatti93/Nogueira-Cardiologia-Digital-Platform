import { absoluteUrl, clinic, siteUrl } from '@/lib/seo';

export function OrganizationSchema() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: clinic.name,
        alternateName: 'Nogueira Cardiologia Digital',
        inLanguage: 'pt-BR',
        publisher: { '@id': `${siteUrl}/#clinic` },
      },
      {
        '@type': ['MedicalClinic', 'LocalBusiness', 'Organization'],
        '@id': `${siteUrl}/#clinic`,
        name: clinic.name,
        legalName: clinic.legalName,
        taxID: clinic.cnpj,
        url: siteUrl,
        logo: absoluteUrl('/brand/nogueira-cardiologia-logo.svg'),
        image: absoluteUrl('/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris3.png'),
        telephone: clinic.telephone,
        email: clinic.email,
        priceRange: '$$',
        medicalSpecialty: ['Cardiovascular', 'Cardiology'],
        address: {
          '@type': 'PostalAddress',
          ...clinic.address,
        },
        areaServed: {
          '@type': 'City',
          name: 'São José do Rio Preto',
        },
        sameAs: [
          'https://www.instagram.com/drpaulonogueiracardiologista/',
          'https://www.linkedin.com/in/paulo-roberto-nogueira-b704282a/',
        ],
        employee: [
          { '@id': `${siteUrl}/medicos/dr-paulo-roberto-nogueira#physician` },
          { '@id': `${siteUrl}/medicos/dra-cristiani-nogueira#physician` },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
