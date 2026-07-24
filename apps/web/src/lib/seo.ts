export const siteUrl = 'https://www.nogueiracardiologia.com.br';

export const clinic = {
  name: 'Nogueira Cardiologia',
  legalName: 'Nogueira Cardiologia LTDA',
  cnpj: '12.388.371/0001-71',
  telephone: '+55 17 2139-8338',
  whatsapp: '+55 17 99744-0223',
  email: 'contato@nogueiracardiologia.com.br',
  address: {
    streetAddress: 'Av. José Munia, 7301',
    addressLocality: 'São José do Rio Preto',
    addressRegion: 'SP',
    postalCode: '15085-895',
    addressCountry: 'BR',
  },
} as const;

export const absoluteUrl = (path = '/') => new URL(path, siteUrl).toString();

export const noIndexRobots = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
} as const;
