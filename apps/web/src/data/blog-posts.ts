export type BlogAuthor = {
  name: string;
  role: string;
};

export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  author: BlogAuthor;
  seoTitle: string;
  seoDescription: string;
  coverImage: string;
  featured: boolean;
  sections: BlogSection[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'sinais-de-alerta-do-coracao',
    title: 'Sinais de alerta do coração: quando os sintomas exigem atenção imediata',
    excerpt:
      'Entenda os principais sinais cardiovasculares que merecem avaliação rápida e como agir com segurança em situações de risco.',
    category: 'Sintomas e prevenção',
    tags: ['cardiologia', 'saúde cardiovascular', 'prevenção cardiovascular'],
    publishedAt: '2026-05-10',
    updatedAt: '2026-05-10',
    readingTime: '6 min',
    author: {
      name: 'Equipe Editorial Nogueira Cardiologia',
      role: 'Conteúdo institucional revisado pela clínica',
    },
    seoTitle: 'Sinais de alerta do coração | Nogueira Cardiologia',
    seoDescription:
      'Veja os sintomas cardíacos que merecem atenção e quando procurar consulta com cardiologista em São José do Rio Preto.',
    coverImage: '/blog/placeholder-cover.jpg',
    featured: true,
    sections: [
      {
        heading: 'Sintomas que não devem ser ignorados',
        paragraphs: [
          'Dor no peito persistente, falta de ar súbita, palpitações acompanhadas de mal-estar e tontura intensa são sinais que podem indicar necessidade de avaliação cardiovascular urgente.',
          'Mesmo quando os sintomas parecem leves, o ideal é não adiar a busca por atendimento, especialmente em pessoas com fatores de risco para doença coronariana.',
        ],
        bullets: [
          'Pressão ou aperto no peito com irradiação para braço, mandíbula ou costas.',
          'Cansaço desproporcional e falta de ar em esforços habituais.',
          'Desmaio, pré-desmaio ou palpitação com sudorese fria.',
        ],
      },
      {
        heading: 'Quem deve redobrar a atenção',
        paragraphs: [
          'Pacientes com hipertensão arterial, diabetes, tabagismo, colesterol elevado e histórico familiar de infarto precisam de acompanhamento regular em cardiologia.',
          'A consulta com cardiologista permite identificar riscos precocemente e reduzir a chance de eventos agudos.',
        ],
      },
    ],
  },
  {
    slug: 'quando-procurar-cardiologista',
    title: 'Quando procurar um cardiologista: orientação prática para a rotina',
    excerpt:
      'Saiba em quais fases da vida e em quais situações a consulta com cardiologista é recomendada para prevenção e cuidado contínuo.',
    category: 'Consulta e acompanhamento',
    tags: ['cardiologista', 'consulta com cardiologista', 'check-up cardiológico'],
    publishedAt: '2026-05-09',
    updatedAt: '2026-05-09',
    readingTime: '5 min',
    author: {
      name: 'Equipe Editorial Nogueira Cardiologia',
      role: 'Conteúdo institucional revisado pela clínica',
    },
    seoTitle: 'Quando procurar um cardiologista | Nogueira Cardiologia',
    seoDescription:
      'Descubra quando agendar consulta com cardiologista e como a prevenção cardiovascular protege sua saúde no longo prazo.',
    coverImage: '/blog/placeholder-cover.jpg',
    featured: true,
    sections: [
      {
        heading: 'Situações comuns em que a avaliação é indicada',
        paragraphs: [
          'A avaliação cardiovascular pode ser recomendada antes de iniciar atividade física intensa, após alterações em exames de rotina ou quando surgem sintomas como dor torácica e cansaço.',
        ],
        bullets: [
          'Histórico familiar de doença cardíaca precoce.',
          'Hipertensão, diabetes ou dislipidemia.',
          'Mudanças de estilo de vida que exigem liberação clínica.',
        ],
      },
    ],
  },
  {
    slug: 'exames-cardiologicos-mais-comuns',
    title: 'Exames cardiológicos mais comuns e para que serve cada um',
    excerpt:
      'Conheça os principais exames usados na cardiologia clínica e como eles ajudam no diagnóstico e no acompanhamento terapêutico.',
    category: 'Exames cardiológicos',
    tags: ['exames', 'avaliação cardiovascular', 'cardiologia'],
    publishedAt: '2026-05-08',
    updatedAt: '2026-05-08',
    readingTime: '7 min',
    author: {
      name: 'Equipe Editorial Nogueira Cardiologia',
      role: 'Conteúdo institucional revisado pela clínica',
    },
    seoTitle: 'Exames cardiológicos mais comuns | Dr. Paulo Roberto Nogueira',
    seoDescription:
      'Entenda eletrocardiograma, ecocardiograma, teste ergométrico e outros exames usados na avaliação cardiovascular.',
    coverImage: '/blog/placeholder-cover.jpg',
    featured: false,
    sections: [
      {
        heading: 'Principais exames da cardiologia clínica',
        paragraphs: [
          'O eletrocardiograma analisa a atividade elétrica do coração, enquanto o ecocardiograma avalia estruturas, função e fluxo sanguíneo.',
          'Já o teste ergométrico investiga resposta cardiovascular ao esforço e pode auxiliar na condução de condutas preventivas.',
        ],
      },
    ],
  },
  {
    slug: 'prevencao-cardiovascular-no-dia-a-dia',
    title: 'Prevenção cardiovascular no dia a dia: hábitos que fazem diferença real',
    excerpt:
      'Veja como alimentação, atividade física e controle de fatores de risco contribuem para um cuidado cardiovascular duradouro.',
    category: 'Prevenção cardiovascular',
    tags: ['prevenção cardiovascular', 'saúde cardiovascular', 'cardiologia'],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07',
    readingTime: '6 min',
    author: {
      name: 'Equipe Editorial Nogueira Cardiologia',
      role: 'Conteúdo institucional revisado pela clínica',
    },
    seoTitle: 'Prevenção cardiovascular no dia a dia | Nogueira Cardiologia',
    seoDescription:
      'Descubra hábitos de rotina para reduzir fatores de risco e fortalecer sua saúde cardiovascular com orientação médica.',
    coverImage: '/blog/placeholder-cover.jpg',
    featured: false,
    sections: [
      {
        heading: 'Estratégias de rotina para proteger o coração',
        paragraphs: [
          'A prevenção cardiovascular envolve alimentação equilibrada, cessação do tabagismo, sono adequado e atividade física regular com orientação profissional.',
          'Além dos hábitos, consultas periódicas ajudam a ajustar metas e identificar alterações precocemente.',
        ],
      },
    ],
  },
];

export const getFeaturedPosts = () => blogPosts.filter((post) => post.featured);
export const getPostBySlug = (slug: string) => blogPosts.find((post) => post.slug === slug);
export const getRecentPosts = () =>
  [...blogPosts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
export const getRelatedPosts = (slug: string, category: string) =>
  blogPosts.filter((post) => post.slug !== slug && post.category === category).slice(0, 3);
