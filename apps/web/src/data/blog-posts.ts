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
    slug: 'check-up-cardiologico-em-sao-jose-do-rio-preto',
    title: 'Check-up cardiológico em São José do Rio Preto: quando fazer e o que avaliar',
    excerpt:
      'Entenda quando a avaliação preventiva com cardiologista é indicada e como ela ajuda a identificar riscos antes de sintomas importantes.',
    category: 'Check-up cardiológico',
    tags: ['check-up cardiológico', 'cardiologista em São José do Rio Preto', 'prevenção cardiovascular'],
    publishedAt: '2026-07-15',
    updatedAt: '2026-07-15',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Check-up cardiológico em São José do Rio Preto | Nogueira Cardiologia',
    seoDescription:
      'Saiba quando fazer check-up cardiológico, quais fatores de risco avaliar e como a Nogueira Cardiologia orienta prevenção cardiovascular.',
    coverImage: '/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris2.png',
    featured: true,
    sections: [
      {
        heading: 'Por que o check-up cardiológico é importante',
        paragraphs: [
          'O check-up cardiológico organiza a avaliação do risco cardiovascular antes que um problema se manifeste de forma grave. Ele é especialmente relevante para pessoas com hipertensão, diabetes, colesterol alto, tabagismo, sedentarismo ou histórico familiar de infarto e AVC.',
          'Na consulta, o cardiologista analisa sintomas, histórico, exames prévios, pressão arterial, hábitos de vida e metas de prevenção. A partir disso, define se há necessidade de exames complementares e acompanhamento contínuo.',
        ],
        bullets: [
          'Adultos com fatores de risco cardiovascular devem discutir avaliação periódica com o cardiologista.',
          'Pessoas que vão iniciar atividade física intensa podem precisar de liberação e orientação individualizada.',
          'Exames alterados de colesterol, glicemia ou pressão arterial merecem investigação clínica.',
        ],
      },
      {
        heading: 'O que pode ser avaliado na consulta',
        paragraphs: [
          'A avaliação pode incluir eletrocardiograma, exames laboratoriais, ecocardiograma, teste ergométrico ou outros métodos, conforme a história clínica. O ponto central não é pedir muitos exames, mas pedir os exames certos para a pergunta clínica correta.',
          'Esse cuidado ajuda o paciente a entender seu risco, ajustar hábitos e acompanhar metas de pressão, colesterol, glicose e peso com mais clareza.',
        ],
      },
    ],
  },
  {
    slug: 'pressao-alta-hipertensao-risco-para-o-coracao',
    title: 'Pressão alta: por que a hipertensão é um risco silencioso para o coração',
    excerpt:
      'A hipertensão arterial pode evoluir sem sintomas por anos. Veja por que medir, acompanhar e tratar a pressão protege coração, cérebro e rins.',
    category: 'Hipertensão arterial',
    tags: ['pressão alta', 'hipertensão arterial', 'cardiologista', 'saúde do coração'],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-15',
    readingTime: '7 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Pressão alta e hipertensão arterial | Nogueira Cardiologia',
    seoDescription:
      'Entenda os riscos da pressão alta, quando procurar cardiologista e como controlar hipertensão arterial com acompanhamento médico.',
    coverImage: '/uploads-imagens-nogueira/nogueira-cardiologia-paulo3.png',
    featured: true,
    sections: [
      {
        heading: 'Por que a pressão alta merece acompanhamento',
        paragraphs: [
          'A hipertensão arterial é chamada de silenciosa porque muitas pessoas não sentem nada, mesmo com níveis elevados de pressão. Sem controle, ela aumenta o risco de infarto, AVC, insuficiência cardíaca, doença renal e alterações nos vasos.',
          'Medir a pressão apenas quando há mal-estar não é suficiente. O acompanhamento precisa considerar medidas repetidas, contexto clínico, outros fatores de risco e resposta ao tratamento.',
        ],
        bullets: [
          'Tenha registros confiáveis da pressão arterial em casa ou em serviços de saúde.',
          'Não interrompa medicação por conta própria, mesmo quando a pressão melhora.',
          'Leve exames e anotações de pressão para a consulta cardiológica.',
        ],
      },
      {
        heading: 'Controle envolve rotina e plano individual',
        paragraphs: [
          'O tratamento pode envolver mudanças de alimentação, redução de sal, atividade física, controle de peso, sono adequado e medicamentos. A escolha depende do perfil de risco e das condições associadas.',
          'O papel do cardiologista é ajustar metas, identificar causas ou agravantes e acompanhar a segurança do plano ao longo do tempo.',
        ],
      },
    ],
  },
  {
    slug: 'dor-no-peito-falta-de-ar-palpitacoes-quando-procurar-cardiologista',
    title: 'Dor no peito, falta de ar e palpitações: quando procurar um cardiologista',
    excerpt:
      'Sintomas cardíacos nem sempre são iguais para todos. Entenda sinais que pedem atenção e quando buscar avaliação cardiovascular.',
    category: 'Sintomas cardíacos',
    tags: ['dor no peito', 'falta de ar', 'palpitações', 'cardiologista em Rio Preto'],
    publishedAt: '2026-07-13',
    updatedAt: '2026-07-15',
    readingTime: '7 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Dor no peito e palpitações: quando procurar cardiologista | Nogueira',
    seoDescription:
      'Saiba quando dor no peito, falta de ar, tontura e palpitações precisam de avaliação com cardiologista.',
    coverImage: '/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris3.png',
    featured: false,
    sections: [
      {
        heading: 'Sintomas que não devem ser normalizados',
        paragraphs: [
          'Dor ou pressão no peito, falta de ar aos esforços, palpitações persistentes, desmaio, tontura intensa e cansaço desproporcional são sinais que merecem avaliação. Em alguns casos, podem estar ligados a doença coronariana, arritmias, insuficiência cardíaca ou outras condições.',
          'Quando a dor no peito é intensa, prolongada, vem com suor frio, náusea, falta de ar ou irradiação para braço, mandíbula ou costas, a orientação é buscar atendimento de urgência.',
        ],
        bullets: [
          'Dor no peito nova ou progressiva deve ser investigada.',
          'Palpitações com tontura, desmaio ou mal-estar exigem atenção.',
          'Falta de ar fora do padrão habitual pode ser sinal cardiovascular ou pulmonar.',
        ],
      },
      {
        heading: 'A consulta transforma sintoma em direção clínica',
        paragraphs: [
          'O cardiologista organiza a história, examina o paciente e define a necessidade de eletrocardiograma, ecocardiograma, teste ergométrico, monitorização ou exames laboratoriais.',
          'Essa condução evita tanto a banalização de sintomas importantes quanto a realização de exames sem critério.',
        ],
      },
    ],
  },
  {
    slug: 'colesterol-diabetes-tabagismo-fatores-de-risco-cardiovascular',
    title: 'Colesterol alto, diabetes e tabagismo: fatores de risco que aceleram doenças do coração',
    excerpt:
      'Conheça fatores que aumentam o risco cardiovascular e por que preveni-los exige acompanhamento, metas claras e mudança sustentável.',
    category: 'Prevenção cardiovascular',
    tags: ['colesterol alto', 'diabetes', 'tabagismo', 'risco cardiovascular'],
    publishedAt: '2026-07-12',
    updatedAt: '2026-07-15',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Colesterol, diabetes e tabagismo: risco cardiovascular | Nogueira',
    seoDescription:
      'Entenda como colesterol alto, diabetes e tabagismo aumentam risco de infarto e AVC e quando procurar avaliação cardiológica.',
    coverImage: '/uploads-imagens-nogueira/nogueira-cardiologia-cris3.png',
    featured: false,
    sections: [
      {
        heading: 'Fatores de risco se somam',
        paragraphs: [
          'O risco cardiovascular não depende de um único número. Pressão arterial, colesterol, glicemia, tabagismo, peso, sono, sedentarismo, idade e histórico familiar se combinam e mudam a probabilidade de eventos como infarto e AVC.',
          'Por isso, a prevenção precisa ser individualizada. Duas pessoas com o mesmo colesterol podem ter riscos diferentes, dependendo do conjunto clínico.',
        ],
        bullets: [
          'Colesterol LDL elevado favorece formação de placas nas artérias.',
          'Diabetes aumenta risco vascular e exige metas de controle bem definidas.',
          'Tabagismo agride os vasos e eleva risco de eventos cardiovasculares.',
        ],
      },
      {
        heading: 'Prevenção é uma estratégia contínua',
        paragraphs: [
          'Redução de risco envolve alimentação, movimento, abandono do tabagismo, controle de pressão e glicemia, além de medicamentos quando indicados.',
          'A consulta cardiológica ajuda a transformar orientações gerais em um plano aplicável para a rotina real do paciente.',
        ],
      },
    ],
  },
  {
    slug: 'coronariopatias-cardiomiopatias-entenda-o-acompanhamento',
    title: 'Coronariopatias e cardiomiopatias: entenda por que o acompanhamento especializado importa',
    excerpt:
      'Doenças das artérias coronárias e alterações do músculo cardíaco exigem avaliação cuidadosa, seguimento e decisões clínicas bem fundamentadas.',
    category: 'Cardiologia clínica',
    tags: ['coronariopatias', 'cardiomiopatias', 'cardiologia clínica', 'Dr Paulo Nogueira'],
    publishedAt: '2026-07-11',
    updatedAt: '2026-07-15',
    readingTime: '8 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Coronariopatias e cardiomiopatias | Dr. Paulo Roberto Nogueira',
    seoDescription:
      'Entenda coronariopatias, cardiomiopatias e a importância do acompanhamento com cardiologista clínico em São José do Rio Preto.',
    coverImage: '/uploads-imagens-nogueira/nogueira-cardiologia-paulo1.png',
    featured: true,
    sections: [
      {
        heading: 'O que são coronariopatias',
        paragraphs: [
          'Coronariopatias são doenças que envolvem as artérias coronárias, responsáveis por levar sangue ao músculo do coração. Quando há estreitamentos ou obstruções, o paciente pode apresentar dor no peito, falta de ar, limitação aos esforços ou eventos agudos.',
          'O acompanhamento busca avaliar sintomas, fatores de risco, exames e necessidade de tratamento clínico, investigação adicional ou encaminhamentos específicos.',
        ],
      },
      {
        heading: 'O que são cardiomiopatias',
        paragraphs: [
          'Cardiomiopatias são alterações do músculo cardíaco que podem comprometer força de contração, relaxamento, ritmo ou estrutura do coração. Algumas têm relação familiar, outras aparecem associadas a pressão alta, inflamações, doença coronariana ou outras condições.',
          'O seguimento clínico permite acompanhar função cardíaca, sintomas, medicações, risco de arritmias e evolução ao longo do tempo.',
        ],
        bullets: [
          'Cansaço progressivo, inchaço, falta de ar e palpitações merecem avaliação.',
          'Histórico familiar de doença cardíaca pode mudar a estratégia de investigação.',
          'Exames de imagem e acompanhamento regular ajudam a orientar decisões.',
        ],
      },
      {
        heading: 'Por que esse tema combina com educação médica',
        paragraphs: [
          'Coronariopatias e cardiomiopatias são temas centrais da cardiologia clínica. Explicar esses assuntos com linguagem clara ajuda pacientes e familiares a reconhecer sinais, valorizar prevenção e compreender a importância do seguimento médico.',
          'Na Nogueira Cardiologia, esse conteúdo educativo reforça uma proposta de cuidado baseada em experiência clínica, acompanhamento humanizado e informação responsável para a comunidade.',
        ],
      },
    ],
  },
  {
    slug: 'atividade-fisica-segura-para-o-coracao',
    title: 'Atividade física e coração: como começar com mais segurança cardiovascular',
    excerpt:
      'Exercício faz bem para o coração, mas algumas pessoas precisam de avaliação antes de aumentar intensidade ou iniciar treinos.',
    category: 'Prevenção cardiovascular',
    tags: ['atividade física', 'exercício e coração', 'check-up cardiológico', 'prevenção cardiovascular'],
    publishedAt: '2026-07-10',
    updatedAt: '2026-07-15',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Atividade física e coração: avaliação cardiológica | Nogueira',
    seoDescription:
      'Veja quando fazer avaliação cardiológica antes de iniciar atividade física e como proteger a saúde cardiovascular.',
    coverImage: '/uploads-imagens-nogueira/nogueira-cardiologia-cris1.png',
    featured: false,
    sections: [
      {
        heading: 'Exercício é prevenção, mas precisa respeitar o contexto clínico',
        paragraphs: [
          'A atividade física regular ajuda no controle da pressão arterial, glicemia, peso, condicionamento e saúde mental. Para muitas pessoas, começar com caminhada e progressão gradual já traz benefícios importantes.',
          'Alguns pacientes, porém, precisam de avaliação cardiológica antes de aumentar intensidade: pessoas com dor no peito, falta de ar fora do habitual, palpitações, desmaio, hipertensão sem controle, diabetes, doença cardíaca conhecida ou histórico familiar relevante.',
        ],
        bullets: [
          'Comece de forma progressiva e evite mudanças bruscas de intensidade.',
          'Procure avaliação se houver sintomas durante ou após esforço.',
          'Leve exames prévios e histórico familiar para orientar a consulta.',
        ],
      },
      {
        heading: 'O cardiologista ajuda a definir segurança e metas',
        paragraphs: [
          'A avaliação pode envolver exame físico, eletrocardiograma, teste ergométrico ou outros exames conforme o perfil. O objetivo é identificar riscos, orientar limites e permitir que o exercício seja aliado da saúde, não motivo de insegurança.',
          'A recomendação ideal considera idade, fatores de risco, medicações, rotina, condicionamento e objetivos do paciente.',
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
  [
    ...blogPosts.filter((post) => post.slug !== slug && post.category === category),
    ...getRecentPosts().filter((post) => post.slug !== slug && post.category !== category),
  ].slice(0, 3);
