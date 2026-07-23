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

export type BlogCategorySummary = {
  name: string;
  slug: string;
  count: number;
};

export const getBlogCategorySlug = (category: string) =>
  category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const getBlogPostHashtags = (post: Pick<BlogPost, 'category' | 'tags'>) => {
  const toHashtag = (value: string) => {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    return normalized ? `#${normalized}` : '';
  };

  return [
    '#NogueiraCardiologia',
    '#Cardiologista',
    '#SaoJoseDoRioPreto',
    '#TelemedicinaCardiologica',
    toHashtag(post.category),
    ...post.tags.map(toHashtag),
  ]
    .filter(Boolean)
    .filter((tag, index, tags) => tags.indexOf(tag) === index)
    .slice(0, 9);
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
    coverImage: '/uploads-imagens-nogueira/educativo-covers/check-up-cardiologico-em-sao-jose-do-rio-preto.svg',
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
    coverImage: '/uploads-imagens-nogueira/educativo-covers/pressao-alta-hipertensao-risco-para-o-coracao.svg',
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
    coverImage: '/uploads-imagens-nogueira/educativo-covers/dor-no-peito-falta-de-ar-palpitacoes-quando-procurar-cardiologista.svg',
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
    coverImage: '/uploads-imagens-nogueira/educativo-covers/colesterol-diabetes-tabagismo-fatores-de-risco-cardiovascular.svg',
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
    coverImage: '/uploads-imagens-nogueira/educativo-covers/coronariopatias-cardiomiopatias-entenda-o-acompanhamento.svg',
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
    coverImage: '/uploads-imagens-nogueira/educativo-covers/atividade-fisica-segura-para-o-coracao.svg',
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
  {
    slug: 'arritmia-cardiaca-palpitacoes-holter-quando-investigar',
    title: 'Arritmia cardíaca e palpitações: quando investigar com Holter e cardiologista',
    excerpt:
      'Palpitações podem ser benignas, mas também podem indicar arritmias que merecem registro, avaliação clínica e acompanhamento cardiológico.',
    category: 'Arritmias cardíacas',
    tags: ['arritmia cardíaca', 'palpitações', 'Holter 24 horas', 'cardiologista em São José do Rio Preto'],
    publishedAt: '2026-07-21',
    updatedAt: '2026-07-21',
    readingTime: '7 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Arritmia cardíaca e palpitações: quando investigar | Nogueira Cardiologia',
    seoDescription:
      'Entenda quando palpitações, coração acelerado e falhas no ritmo precisam de avaliação com cardiologista, eletrocardiograma ou Holter.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/arritmia-cardiaca-palpitacoes-holter-quando-investigar.svg',
    featured: true,
    sections: [
      {
        heading: 'Quando palpitações pedem atenção',
        paragraphs: [
          'Palpitação é a percepção dos batimentos do coração. Pode aparecer como coração acelerado, batidas fortes, falhas, pausas ou sensação de tremor no peito. Nem toda palpitação significa doença grave, mas sintomas repetidos precisam ser contextualizados.',
          'A avaliação é mais importante quando há tontura, desmaio, dor no peito, falta de ar, histórico familiar de morte súbita, doença cardíaca conhecida ou episódios durante esforço físico.',
        ],
        bullets: [
          'Anote horário, duração, gatilhos e sintomas associados.',
          'Procure urgência se houver desmaio, dor no peito intensa ou falta de ar importante.',
          'Leve exames prévios e lista de medicamentos para a consulta.',
        ],
      },
      {
        heading: 'Por que o Holter pode ajudar',
        paragraphs: [
          'O eletrocardiograma registra um momento curto. Já o Holter acompanha o ritmo por um período maior, geralmente 24 horas ou mais, aumentando a chance de capturar alterações que aparecem de forma intermitente.',
          'O cardiologista decide se o Holter é necessário a partir da história clínica, exame físico, frequência dos sintomas e risco individual do paciente.',
        ],
      },
    ],
  },
  {
    slug: 'ecocardiograma-quando-o-cardiologista-solicita',
    title: 'Ecocardiograma: quando o cardiologista solicita e o que esse exame avalia',
    excerpt:
      'O ecocardiograma ajuda a avaliar estrutura, válvulas e função do coração, mas deve ser indicado conforme a pergunta clínica.',
    category: 'Exames cardiológicos',
    tags: ['ecocardiograma', 'exames cardiológicos', 'cardiologista', 'sopro no coração'],
    publishedAt: '2026-07-21',
    updatedAt: '2026-07-21',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Ecocardiograma: quando fazer e o que avalia | Nogueira Cardiologia',
    seoDescription:
      'Saiba quando o ecocardiograma é indicado, o que ele mostra sobre válvulas, músculo cardíaco e função do coração.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/ecocardiograma-quando-o-cardiologista-solicita.svg',
    featured: false,
    sections: [
      {
        heading: 'O que o ecocardiograma mostra',
        paragraphs: [
          'O ecocardiograma usa ultrassom para avaliar câmaras cardíacas, válvulas, espessura das paredes, força de contração e alguns fluxos dentro do coração. É um exame útil em sopros, falta de ar, inchaço, dor torácica selecionada e acompanhamento de doenças cardíacas.',
          'Ele não substitui a consulta. O resultado precisa ser interpretado junto com sintomas, exame físico, pressão arterial, eletrocardiograma e histórico do paciente.',
        ],
        bullets: [
          'Pode avaliar válvulas cardíacas e função do ventrículo esquerdo.',
          'Ajuda no seguimento de cardiomiopatias e insuficiência cardíaca.',
          'Pode ser solicitado após alteração no exame físico ou em outros exames.',
        ],
      },
      {
        heading: 'Exame certo para a pergunta certa',
        paragraphs: [
          'Pedir exames sem uma pergunta clínica clara pode gerar ansiedade e achados sem relevância. A melhor estratégia é usar o ecocardiograma quando ele realmente pode mudar conduta, orientar acompanhamento ou esclarecer sintomas.',
          'Na rotina cardiológica, a indicação bem feita reduz desperdício e melhora a qualidade da decisão médica.',
        ],
      },
    ],
  },
  {
    slug: 'teste-ergometrico-preparo-indicacoes-e-cuidados',
    title: 'Teste ergométrico: preparo, indicações e cuidados antes do exame',
    excerpt:
      'O teste ergométrico avalia resposta ao esforço e pode ajudar na investigação de sintomas, risco cardiovascular e liberação para atividade física.',
    category: 'Exames cardiológicos',
    tags: ['teste ergométrico', 'exame de esforço', 'atividade física', 'cardiologista'],
    publishedAt: '2026-07-20',
    updatedAt: '2026-07-21',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Teste ergométrico: preparo e quando fazer | Nogueira Cardiologia',
    seoDescription:
      'Entenda para que serve o teste ergométrico, como se preparar e quando o cardiologista pode indicar avaliação de esforço.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/teste-ergometrico-preparo-indicacoes-e-cuidados.svg',
    featured: false,
    sections: [
      {
        heading: 'Para que serve o teste de esforço',
        paragraphs: [
          'O teste ergométrico observa pressão, sintomas, ritmo e eletrocardiograma durante esforço progressivo. Pode ser usado na investigação de dor no peito, avaliação funcional e orientação para atividade física em pacientes selecionados.',
          'A indicação depende do risco clínico. Em algumas situações, outros exames podem ser mais adequados ou o teste pode ser contraindicado temporariamente.',
        ],
        bullets: [
          'Informe medicamentos em uso antes do exame.',
          'Use roupa e calçado adequados para caminhar ou correr.',
          'Avise a equipe sobre dor, tontura, falta de ar ou mal-estar.',
        ],
      },
      {
        heading: 'Preparo começa na consulta',
        paragraphs: [
          'O preparo não é apenas operacional. Antes do exame, o cardiologista precisa entender o motivo da solicitação, sintomas, limitações físicas, pressão arterial e doenças associadas.',
          'Esse cuidado ajuda a aumentar segurança e utilidade do resultado.',
        ],
      },
    ],
  },
  {
    slug: 'holter-24-horas-e-mapa-diferencas-entre-os-exames',
    title: 'Holter 24 horas e MAPA: diferenças entre os exames e quando são indicados',
    excerpt:
      'Holter acompanha o ritmo cardíaco; MAPA acompanha a pressão arterial. Entenda como cada exame contribui para a avaliação cardiovascular.',
    category: 'Exames cardiológicos',
    tags: ['Holter 24 horas', 'MAPA', 'pressão arterial', 'arritmia cardíaca'],
    publishedAt: '2026-07-20',
    updatedAt: '2026-07-21',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Holter e MAPA: diferenças e indicações | Nogueira Cardiologia',
    seoDescription:
      'Veja a diferença entre Holter 24 horas e MAPA, exames usados para investigar arritmias e pressão arterial fora do consultório.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/holter-24-horas-e-mapa-diferencas-entre-os-exames.svg',
    featured: false,
    sections: [
      {
        heading: 'Holter registra ritmo, MAPA registra pressão',
        paragraphs: [
          'O Holter monitora os batimentos cardíacos durante as atividades do dia, sendo útil para palpitações, tontura, desmaios e suspeita de arritmias. O MAPA mede a pressão arterial várias vezes, inclusive durante sono, ajudando no diagnóstico e controle da hipertensão.',
          'Apesar de ambos acompanharem o paciente fora do consultório, respondem perguntas diferentes e não devem ser confundidos.',
        ],
        bullets: [
          'Holter: ritmo, pausas, extrassístoles e arritmias.',
          'MAPA: médias de pressão, picos, queda noturna e controle terapêutico.',
          'A escolha depende do sintoma ou da dúvida clínica.',
        ],
      },
      {
        heading: 'Diário de sintomas melhora a interpretação',
        paragraphs: [
          'Durante o uso dos aparelhos, anotar horários de sintomas, esforço, sono e medicações ajuda o cardiologista a relacionar eventos com os registros.',
          'Essa informação torna o laudo mais útil para decisões de tratamento.',
        ],
      },
    ],
  },
  {
    slug: 'insuficiencia-cardiaca-sinais-que-merecem-avaliacao',
    title: 'Insuficiência cardíaca: sinais que merecem avaliação e acompanhamento',
    excerpt:
      'Falta de ar, inchaço e cansaço progressivo podem ter relação com insuficiência cardíaca e precisam de investigação responsável.',
    category: 'Insuficiência cardíaca',
    tags: ['insuficiência cardíaca', 'falta de ar', 'inchaço', 'cardiologia clínica'],
    publishedAt: '2026-07-19',
    updatedAt: '2026-07-21',
    readingTime: '7 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Insuficiência cardíaca: sintomas e acompanhamento | Nogueira',
    seoDescription:
      'Conheça sinais de insuficiência cardíaca, como falta de ar, inchaço e cansaço, e entenda a importância do seguimento cardiológico.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/insuficiencia-cardiaca-sinais-que-merecem-avaliacao.svg',
    featured: true,
    sections: [
      {
        heading: 'Sintomas que podem indicar descompensação',
        paragraphs: [
          'Insuficiência cardíaca ocorre quando o coração tem dificuldade para bombear ou receber sangue de forma adequada. Os sintomas podem incluir falta de ar ao esforço ou ao deitar, inchaço nas pernas, ganho rápido de peso, cansaço e redução da tolerância às atividades.',
          'Esses sinais não confirmam diagnóstico sozinhos, mas indicam necessidade de avaliação, principalmente em quem já tem pressão alta, doença coronariana, infarto prévio ou cardiomiopatia.',
        ],
        bullets: [
          'Piora súbita da falta de ar exige atendimento rápido.',
          'Ganho de peso em poucos dias pode indicar retenção de líquido.',
          'Não ajuste diuréticos ou medicações sem orientação médica.',
        ],
      },
      {
        heading: 'Acompanhamento reduz risco de novas crises',
        paragraphs: [
          'O tratamento combina medicações, controle de pressão, avaliação de exames, ajustes de rotina e reconhecimento precoce de sinais de alerta.',
          'Quando o paciente entende a própria condição, fica mais fácil agir cedo e evitar internações.',
        ],
      },
    ],
  },
  {
    slug: 'sopro-no-coracao-em-adultos-o-que-pode-significar',
    title: 'Sopro no coração em adultos: o que pode significar e quando investigar',
    excerpt:
      'Sopro é um achado no exame físico que pode ser inocente ou indicar alterações valvares que precisam de avaliação cardiológica.',
    category: 'Cardiologia clínica',
    tags: ['sopro no coração', 'válvulas cardíacas', 'ecocardiograma', 'cardiologista'],
    publishedAt: '2026-07-19',
    updatedAt: '2026-07-21',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Sopro no coração em adultos: quando investigar | Nogueira',
    seoDescription:
      'Entenda o que pode significar sopro no coração em adultos e quando o cardiologista pode solicitar ecocardiograma.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/sopro-no-coracao-em-adultos-o-que-pode-significar.svg',
    featured: false,
    sections: [
      {
        heading: 'Sopro é um som, não um diagnóstico final',
        paragraphs: [
          'O sopro é percebido na ausculta cardíaca quando há turbulência no fluxo de sangue. Pode ocorrer por situações sem gravidade, mas também pode estar associado a estreitamentos ou insuficiências das válvulas cardíacas.',
          'A relevância depende da intensidade, localização, sintomas, idade, histórico e achados do exame físico.',
        ],
        bullets: [
          'Falta de ar, dor no peito, desmaio ou cansaço progressivo merecem investigação.',
          'O ecocardiograma pode esclarecer estrutura e funcionamento das válvulas.',
          'Acompanhamento periódico pode ser indicado mesmo sem sintomas.',
        ],
      },
      {
        heading: 'Avaliação evita tanto susto quanto descuido',
        paragraphs: [
          'Muitas pessoas ficam assustadas ao ouvir que têm sopro. A consulta ajuda a separar achados benignos de situações que exigem seguimento.',
          'Quando existe doença valvar, acompanhar evolução é essencial para decidir o momento certo de tratamento.',
        ],
      },
    ],
  },
  {
    slug: 'historico-familiar-de-infarto-como-avaliar-risco',
    title: 'Histórico familiar de infarto: como avaliar risco cardiovascular com clareza',
    excerpt:
      'Ter familiares com infarto precoce pode mudar a estratégia de prevenção e justificar avaliação cardiológica mais cuidadosa.',
    category: 'Prevenção cardiovascular',
    tags: ['histórico familiar', 'infarto', 'risco cardiovascular', 'check-up cardiológico'],
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-21',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Histórico familiar de infarto e risco cardiovascular | Nogueira',
    seoDescription:
      'Saiba como histórico familiar de infarto influencia prevenção cardiovascular, check-up cardiológico e metas de controle.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/historico-familiar-de-infarto-como-avaliar-risco.svg',
    featured: false,
    sections: [
      {
        heading: 'Quando o histórico familiar pesa mais',
        paragraphs: [
          'Infarto, AVC ou morte súbita em familiares de primeiro grau, especialmente em idade precoce, pode indicar maior predisposição cardiovascular. Isso não significa destino inevitável, mas muda a atenção com prevenção.',
          'O cardiologista avalia idade dos eventos na família, presença de colesterol alto, hipertensão, diabetes, tabagismo e outros fatores modificáveis.',
        ],
        bullets: [
          'Informe quais familiares tiveram eventos e com que idade.',
          'Leve exames de colesterol, glicose e pressão se tiver.',
          'Prevenção precoce pode reduzir risco ao longo da vida.',
        ],
      },
      {
        heading: 'Risco familiar não substitui hábitos e metas',
        paragraphs: [
          'Mesmo com genética desfavorável, controlar pressão, colesterol, glicemia, peso, sono e tabagismo continua sendo decisivo.',
          'A avaliação transforma uma preocupação familiar em plano concreto de cuidado.',
        ],
      },
    ],
  },
  {
    slug: 'menopausa-e-coracao-cuidados-cardiovasculares-para-mulheres',
    title: 'Menopausa e coração: cuidados cardiovasculares importantes para mulheres',
    excerpt:
      'Após a menopausa, fatores como pressão, colesterol, peso e sintomas cardíacos merecem atenção renovada na prevenção cardiovascular.',
    category: 'Cardiologia da mulher',
    tags: ['menopausa e coração', 'cardiologia da mulher', 'prevenção cardiovascular', 'colesterol'],
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-21',
    readingTime: '7 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Menopausa e coração: prevenção cardiovascular | Nogueira',
    seoDescription:
      'Entenda por que mulheres após a menopausa devem acompanhar pressão, colesterol, sintomas e risco cardiovascular.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/menopausa-e-coracao-cuidados-cardiovasculares-para-mulheres.svg',
    featured: false,
    sections: [
      {
        heading: 'Risco cardiovascular também é assunto feminino',
        paragraphs: [
          'Doenças cardiovasculares também afetam mulheres de forma relevante. Após a menopausa, alterações hormonais, metabólicas e de composição corporal podem contribuir para aumento de pressão, colesterol e resistência à insulina.',
          'Além disso, sintomas de doença cardíaca em mulheres podem ser menos típicos, incluindo falta de ar, cansaço, náusea, dor nas costas ou desconforto torácico.',
        ],
        bullets: [
          'Acompanhe pressão arterial e exames metabólicos regularmente.',
          'Não normalize cansaço progressivo ou falta de ar aos esforços.',
          'Discuta histórico familiar e sintomas com o cardiologista.',
        ],
      },
      {
        heading: 'Prevenção precisa caber na vida real',
        paragraphs: [
          'A orientação cardiovascular deve considerar rotina, sono, estresse, alimentação, atividade física e outras condições de saúde.',
          'Uma abordagem individualizada ajuda a construir metas sustentáveis, sem transformar prevenção em lista impossível de cumprir.',
        ],
      },
    ],
  },
  {
    slug: 'saude-cardiovascular-do-idoso-acompanhamento-com-cardiologista',
    title: 'Saúde cardiovascular do idoso: acompanhamento com cardiologista e prevenção',
    excerpt:
      'Na terceira idade, controlar pressão, ritmo, medicações e sintomas ajuda a preservar autonomia e reduzir complicações cardiovasculares.',
    category: 'Cardiologia do idoso',
    tags: ['cardiologia do idoso', 'pressão no idoso', 'arritmia', 'prevenção cardiovascular'],
    publishedAt: '2026-07-17',
    updatedAt: '2026-07-21',
    readingTime: '7 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Cardiologia do idoso: acompanhamento e prevenção | Nogueira',
    seoDescription:
      'Veja cuidados cardiovasculares importantes para idosos, incluindo pressão arterial, sintomas, medicações e acompanhamento cardiológico.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/saude-cardiovascular-do-idoso-acompanhamento-com-cardiologista.svg',
    featured: false,
    sections: [
      {
        heading: 'Cuidado cardiovascular muda com o envelhecimento',
        paragraphs: [
          'Com o passar dos anos, aumenta a frequência de hipertensão, arritmias, doença coronariana, alterações valvares e uso de múltiplas medicações. O objetivo do cuidado não é apenas tratar números, mas preservar qualidade de vida e segurança.',
          'Sintomas como queda, tontura, confusão, falta de ar e cansaço podem ter causas cardiovasculares ou relação com remédios.',
        ],
        bullets: [
          'Revise a lista completa de medicamentos em consulta.',
          'Monitore pressão sem excessos e com técnica adequada.',
          'Valorize quedas, desmaios e tonturas novas.',
        ],
      },
      {
        heading: 'Metas precisam ser individualizadas',
        paragraphs: [
          'Em idosos, metas de pressão, colesterol e tratamento devem considerar fragilidade, risco de queda, função renal, sintomas e preferências do paciente.',
          'Essa visão reduz decisões automáticas e aumenta a segurança do acompanhamento.',
        ],
      },
    ],
  },
  {
    slug: 'obesidade-e-coracao-risco-cardiovascular-e-prevencao',
    title: 'Obesidade e coração: risco cardiovascular, prevenção e acompanhamento',
    excerpt:
      'O excesso de peso pode se associar a hipertensão, diabetes, apneia do sono e maior risco cardiovascular, exigindo cuidado integrado.',
    category: 'Prevenção cardiovascular',
    tags: ['obesidade e coração', 'risco cardiovascular', 'hipertensão', 'diabetes'],
    publishedAt: '2026-07-17',
    updatedAt: '2026-07-21',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Obesidade e coração: riscos cardiovasculares | Nogueira',
    seoDescription:
      'Entenda a relação entre obesidade, hipertensão, diabetes, apneia do sono e risco cardiovascular.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/obesidade-e-coracao-risco-cardiovascular-e-prevencao.svg',
    featured: false,
    sections: [
      {
        heading: 'Peso é parte de um contexto metabólico',
        paragraphs: [
          'A obesidade pode aumentar risco de pressão alta, diabetes, colesterol alterado, gordura no fígado, apneia do sono e inflamação crônica. Esses fatores se conectam e podem acelerar doenças cardiovasculares.',
          'A avaliação cardiológica ajuda a medir risco de forma objetiva e orientar metas realistas.',
        ],
        bullets: [
          'Controle de pressão, glicose e colesterol é prioridade.',
          'Atividade física deve começar com segurança e progressão.',
          'Sono e apneia precisam ser considerados quando há ronco e sonolência.',
        ],
      },
      {
        heading: 'Tratamento exige continuidade',
        paragraphs: [
          'Mudanças sustentáveis costumam funcionar melhor do que medidas radicais e passageiras. O cuidado pode envolver equipe multiprofissional, ajustes alimentares, movimento, sono e medicações quando indicadas.',
          'O cardiologista contribui avaliando risco, sintomas, exames e segurança cardiovascular do plano.',
        ],
      },
    ],
  },
  {
    slug: 'sono-apneia-e-coracao-por-que-ronco-importa',
    title: 'Sono, apneia e coração: por que ronco e pausas respiratórias importam',
    excerpt:
      'Apneia do sono pode piorar pressão arterial, arritmias e cansaço, além de aumentar risco cardiovascular quando não tratada.',
    category: 'Prevenção cardiovascular',
    tags: ['apneia do sono', 'ronco', 'pressão alta', 'arritmia'],
    publishedAt: '2026-07-16',
    updatedAt: '2026-07-21',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Apneia do sono e coração: riscos cardiovasculares | Nogueira',
    seoDescription:
      'Saiba como ronco, apneia do sono e pausas respiratórias podem influenciar pressão alta, arritmias e saúde do coração.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/sono-apneia-e-coracao-por-que-ronco-importa.svg',
    featured: false,
    sections: [
      {
        heading: 'Sono ruim pode afetar o coração',
        paragraphs: [
          'A apneia obstrutiva do sono causa pausas respiratórias repetidas, queda de oxigênio e despertares breves. Com o tempo, pode dificultar controle da pressão arterial e se associar a arritmias e maior risco cardiovascular.',
          'Ronco alto, engasgos durante sono, sonolência diurna, dor de cabeça matinal e pressão difícil de controlar são pistas importantes.',
        ],
        bullets: [
          'Informe ronco e pausas respiratórias na consulta.',
          'Pressão alta resistente pode ter relação com sono ruim.',
          'Tratamento adequado melhora disposição e controle clínico.',
        ],
      },
      {
        heading: 'Coração e sono precisam conversar',
        paragraphs: [
          'Nem todo ronco é apneia, mas ignorar sinais persistentes pode atrasar tratamento. A investigação deve considerar peso, medidas de pressão, sintomas, medicações e avaliação específica do sono quando indicada.',
          'Essa integração melhora a estratégia de prevenção cardiovascular.',
        ],
      },
    ],
  },
  {
    slug: 'ansiedade-palpitacoes-e-coracao-como-diferenciar',
    title: 'Ansiedade, palpitações e coração: como diferenciar sem banalizar sintomas',
    excerpt:
      'Ansiedade pode causar palpitações, mas sintomas cardíacos também precisam ser avaliados quando há sinais de alerta ou repetição.',
    category: 'Sintomas cardíacos',
    tags: ['ansiedade e palpitações', 'coração acelerado', 'arritmia', 'sintomas cardíacos'],
    publishedAt: '2026-07-16',
    updatedAt: '2026-07-21',
    readingTime: '7 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Ansiedade e palpitações: quando avaliar o coração | Nogueira',
    seoDescription:
      'Entenda quando palpitações podem estar ligadas à ansiedade e quando sintomas pedem avaliação cardiológica.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/ansiedade-palpitacoes-e-coracao-como-diferenciar.svg',
    featured: false,
    sections: [
      {
        heading: 'Nem tudo é ansiedade, nem tudo é coração',
        paragraphs: [
          'Ansiedade pode provocar coração acelerado, aperto no peito, falta de ar e tremores. Ao mesmo tempo, arritmias e outras condições cardíacas também podem causar sintomas parecidos.',
          'O erro é decidir sozinho que é apenas emocional ou, no outro extremo, assumir que todo episódio é grave. A avaliação clínica organiza o risco.',
        ],
        bullets: [
          'Palpitações com desmaio, dor no peito ou falta de ar intensa exigem atenção.',
          'Episódios recorrentes merecem registro de frequência e duração.',
          'Cafeína, estimulantes e privação de sono podem piorar sintomas.',
        ],
      },
      {
        heading: 'Avaliação traz segurança para tratar a causa certa',
        paragraphs: [
          'Quando necessário, o cardiologista pode indicar eletrocardiograma, Holter, exames laboratoriais ou avaliação complementar.',
          'Se o coração estiver bem, essa informação também é valiosa: permite direcionar cuidado para ansiedade, sono, estresse e hábitos sem medo desnecessário.',
        ],
      },
    ],
  },
  {
    slug: 'pos-infarto-acompanhamento-cardiologico-e-prevencao-secundaria',
    title: 'Pós-infarto: acompanhamento cardiológico e prevenção secundária',
    excerpt:
      'Depois de um infarto, o acompanhamento reduz risco de novos eventos e organiza medicações, exames, reabilitação e metas de prevenção.',
    category: 'Doença coronariana',
    tags: ['pós-infarto', 'prevenção secundária', 'doença coronariana', 'cardiologista'],
    publishedAt: '2026-07-15',
    updatedAt: '2026-07-21',
    readingTime: '8 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Pós-infarto: acompanhamento e prevenção secundária | Nogueira',
    seoDescription:
      'Entenda a importância do seguimento cardiológico após infarto, com controle de medicações, exames e fatores de risco.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/pos-infarto-acompanhamento-cardiologico-e-prevencao-secundaria.svg',
    featured: true,
    sections: [
      {
        heading: 'O cuidado continua depois da alta',
        paragraphs: [
          'Após um infarto, a fase de acompanhamento é decisiva. O objetivo é reduzir risco de novos eventos, controlar sintomas, ajustar medicações, acompanhar exames e orientar retorno seguro às atividades.',
          'Esse período também é uma oportunidade para tratar tabagismo, colesterol, pressão, diabetes, peso e sedentarismo com metas claras.',
        ],
        bullets: [
          'Não interrompa antiagregantes, estatinas ou outros remédios sem orientação.',
          'Leve relatório da internação, exames e lista de medicamentos.',
          'Pergunte sobre retorno ao trabalho, atividade física e reabilitação.',
        ],
      },
      {
        heading: 'Prevenção secundária é tratamento ativo',
        paragraphs: [
          'Prevenção secundária significa cuidar de quem já teve evento cardiovascular para evitar recorrência. Ela envolve acompanhamento regular, adesão ao tratamento e decisões compartilhadas.',
          'Quanto mais claro for o plano, maior a chance de o paciente manter o cuidado no longo prazo.',
        ],
      },
    ],
  },
  {
    slug: 'valvulopatias-doencas-das-valvulas-cardiacas',
    title: 'Valvulopatias: doenças das válvulas cardíacas e sinais de acompanhamento',
    excerpt:
      'Alterações nas válvulas cardíacas podem evoluir lentamente e exigem seguimento para decidir o momento certo de intervenção.',
    category: 'Cardiologia clínica',
    tags: ['valvulopatias', 'válvulas cardíacas', 'ecocardiograma', 'sopro no coração'],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-21',
    readingTime: '7 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Valvulopatias: doenças das válvulas cardíacas | Nogueira',
    seoDescription:
      'Saiba o que são valvulopatias, sintomas de alerta e como o cardiologista acompanha alterações nas válvulas do coração.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/valvulopatias-doencas-das-valvulas-cardiacas.svg',
    featured: false,
    sections: [
      {
        heading: 'O que são valvulopatias',
        paragraphs: [
          'Valvulopatias são alterações nas válvulas que controlam a passagem do sangue dentro do coração. Elas podem envolver estreitamento, vazamento ou combinações desses problemas.',
          'Algumas pessoas não sentem sintomas no início. Outras apresentam falta de ar, cansaço, dor no peito, tontura, palpitações ou inchaço.',
        ],
        bullets: [
          'Sopro pode ser uma pista de doença valvar.',
          'Ecocardiograma ajuda a classificar gravidade e acompanhar evolução.',
          'Sintomas novos devem ser comunicados ao cardiologista.',
        ],
      },
      {
        heading: 'Acompanhamento define o tempo certo',
        paragraphs: [
          'Nem toda valvulopatia precisa de procedimento imediato. O desafio é acompanhar com regularidade para não intervir cedo demais nem tarde demais.',
          'A decisão considera sintomas, função cardíaca, tamanho das câmaras, pressão pulmonar e evolução dos exames.',
        ],
      },
    ],
  },
  {
    slug: 'anticoagulantes-cuidados-seguranca-e-acompanhamento',
    title: 'Anticoagulantes: cuidados, segurança e acompanhamento cardiológico',
    excerpt:
      'Medicamentos anticoagulantes reduzem risco de trombose e AVC em situações específicas, mas exigem orientação e uso correto.',
    category: 'Tratamento cardiovascular',
    tags: ['anticoagulantes', 'fibrilação atrial', 'AVC', 'segurança medicamentosa'],
    publishedAt: '2026-07-13',
    updatedAt: '2026-07-21',
    readingTime: '7 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Anticoagulantes: cuidados e acompanhamento | Nogueira',
    seoDescription:
      'Entenda cuidados com anticoagulantes, risco de sangramento, interações e importância do acompanhamento médico.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/anticoagulantes-cuidados-seguranca-e-acompanhamento.svg',
    featured: false,
    sections: [
      {
        heading: 'Por que anticoagulantes são prescritos',
        paragraphs: [
          'Anticoagulantes podem ser indicados em condições como fibrilação atrial, trombose, embolia pulmonar, próteses valvares ou outros cenários de risco. O objetivo é reduzir formação de coágulos e prevenir complicações como AVC.',
          'Como também aumentam risco de sangramento, precisam ser usados exatamente conforme orientação.',
        ],
        bullets: [
          'Não suspenda anticoagulante sem falar com o médico.',
          'Avise antes de cirurgias, procedimentos odontológicos ou novos remédios.',
          'Sangramentos importantes ou queda com trauma exigem avaliação rápida.',
        ],
      },
      {
        heading: 'Segurança depende de comunicação',
        paragraphs: [
          'O acompanhamento inclui revisar dose, função renal, interações, adesão e eventos de sangramento. Alguns anticoagulantes exigem controle laboratorial específico, outros não.',
          'Levar uma lista atualizada de medicamentos evita combinações perigosas e melhora a segurança do tratamento.',
        ],
      },
    ],
  },
  {
    slug: 'telemedicina-com-cardiologista-quando-o-atendimento-virtual-ajuda',
    title: 'Telemedicina com cardiologista: quando o atendimento virtual ajuda',
    excerpt:
      'A consulta cardiológica online pode facilitar retornos, orientação de exames e acompanhamento, desde que indicada com segurança.',
    category: 'Telemedicina cardiológica',
    tags: ['telemedicina cardiológica', 'atendimento virtual', 'consulta online com cardiologista', 'portal do paciente'],
    publishedAt: '2026-07-12',
    updatedAt: '2026-07-21',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Telemedicina com cardiologista: quando usar | Nogueira',
    seoDescription:
      'Veja quando a telemedicina cardiológica pode ajudar em retornos, orientação de exames e acompanhamento cardiovascular.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/telemedicina-com-cardiologista-quando-o-atendimento-virtual-ajuda.svg',
    featured: true,
    sections: [
      {
        heading: 'Atendimento virtual amplia acesso com critério',
        paragraphs: [
          'A telemedicina pode ser útil para retornos, discussão de exames, ajuste de condutas já planejadas, orientação preventiva e acompanhamento de pacientes estáveis. Ela reduz deslocamentos e facilita continuidade do cuidado.',
          'Existem situações em que o atendimento presencial ou de urgência é mais adequado, especialmente diante de sintomas intensos, instabilidade ou necessidade de exame físico imediato.',
        ],
        bullets: [
          'Tenha exames e lista de medicamentos disponíveis antes da consulta.',
          'Use ambiente silencioso e conexão estável.',
          'Dor no peito intensa ou falta de ar importante não deve esperar teleconsulta.',
        ],
      },
      {
        heading: 'Segurança vem da triagem correta',
        paragraphs: [
          'O atendimento virtual funciona melhor quando integrado ao prontuário, histórico e canal de agendamento. Assim, a equipe consegue orientar o melhor formato para cada caso.',
          'Na jornada digital, o objetivo é dar acesso sem perder responsabilidade clínica.',
        ],
      },
    ],
  },
  {
    slug: 'retorno-cardiologico-o-que-levar-para-a-consulta',
    title: 'Retorno cardiológico: o que levar para aproveitar melhor a consulta',
    excerpt:
      'Organizar exames, sintomas, remédios e dúvidas antes do retorno torna a consulta mais objetiva e melhora decisões de acompanhamento.',
    category: 'Consulta cardiológica',
    tags: ['retorno cardiológico', 'consulta com cardiologista', 'exames cardiológicos', 'portal do paciente'],
    publishedAt: '2026-07-11',
    updatedAt: '2026-07-21',
    readingTime: '5 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Retorno cardiológico: o que levar para consulta | Nogueira',
    seoDescription:
      'Veja como organizar exames, medicamentos, sintomas e dúvidas para aproveitar melhor o retorno com cardiologista.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/retorno-cardiologico-o-que-levar-para-a-consulta.svg',
    featured: false,
    sections: [
      {
        heading: 'Consulta boa começa antes da consulta',
        paragraphs: [
          'O retorno cardiológico serve para revisar evolução, sintomas, exames, efeitos de medicamentos e metas de tratamento. Quando o paciente chega organizado, a consulta rende mais e evita decisões com informação incompleta.',
          'Anotar dúvidas e mudanças desde a última consulta ajuda o médico a entender o que realmente aconteceu na rotina.',
        ],
        bullets: [
          'Leve exames recentes e laudos anteriores.',
          'Tenha lista de medicamentos com dose e horário.',
          'Anote pressão, sintomas, efeitos colaterais e dúvidas.',
        ],
      },
      {
        heading: 'Portal do paciente ajuda na organização',
        paragraphs: [
          'Enviar exames e informações com antecedência pode facilitar a preparação da equipe e reduzir esquecimentos.',
          'Esse hábito melhora continuidade do cuidado e deixa o acompanhamento mais profissional.',
        ],
      },
    ],
  },
  {
    slug: 'como-medir-pressao-em-casa-do-jeito-certo',
    title: 'Como medir pressão em casa do jeito certo e evitar leituras enganosas',
    excerpt:
      'Medir a pressão em casa pode ajudar no controle da hipertensão, mas técnica inadequada gera números confusos e decisões ruins.',
    category: 'Hipertensão arterial',
    tags: ['medir pressão em casa', 'pressão alta', 'hipertensão arterial', 'MAPA'],
    publishedAt: '2026-07-10',
    updatedAt: '2026-07-21',
    readingTime: '6 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Como medir pressão em casa corretamente | Nogueira',
    seoDescription:
      'Aprenda cuidados básicos para medir pressão arterial em casa e levar registros úteis para o cardiologista.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/como-medir-pressao-em-casa-do-jeito-certo.svg',
    featured: false,
    sections: [
      {
        heading: 'Técnica muda o resultado',
        paragraphs: [
          'Pressão medida com pressa, após café, exercício, cigarro, dor ou estresse pode não representar o padrão real. O ideal é medir em repouso, sentado, com braço apoiado e manguito adequado.',
          'Registros isolados assustam mais do que ajudam. O cardiologista interpreta médias, contexto e sintomas.',
        ],
        bullets: [
          'Descanse alguns minutos antes de medir.',
          'Evite falar durante a medida.',
          'Anote data, horário, valor e condição do momento.',
        ],
      },
      {
        heading: 'Quando os números precisam de avaliação',
        paragraphs: [
          'Valores repetidamente elevados, sintomas associados ou pressão muito alta exigem orientação médica. Já oscilações pequenas podem ocorrer normalmente.',
          'Levar registros organizados para a consulta ajuda a diferenciar hipertensão persistente, efeito do consultório e necessidade de ajustes.',
        ],
      },
    ],
  },
  {
    slug: 'colesterol-ldl-hdl-triglicerides-entenda-os-exames',
    title: 'Colesterol LDL, HDL e triglicérides: entenda os exames e o risco do coração',
    excerpt:
      'O colesterol precisa ser interpretado dentro do risco cardiovascular total, não apenas por um valor isolado no exame.',
    category: 'Prevenção cardiovascular',
    tags: ['colesterol LDL', 'HDL', 'triglicérides', 'risco cardiovascular'],
    publishedAt: '2026-07-09',
    updatedAt: '2026-07-21',
    readingTime: '7 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Colesterol LDL, HDL e triglicérides: entenda | Nogueira',
    seoDescription:
      'Entenda LDL, HDL, triglicérides e por que metas de colesterol dependem do risco cardiovascular de cada paciente.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/colesterol-ldl-hdl-triglicerides-entenda-os-exames.svg',
    featured: false,
    sections: [
      {
        heading: 'LDL, HDL e triglicérides têm papéis diferentes',
        paragraphs: [
          'O LDL é conhecido como colesterol associado à formação de placas nas artérias. O HDL participa do transporte reverso de colesterol, mas não deve ser analisado sozinho. Triglicérides podem subir com excesso de calorias, álcool, diabetes, obesidade e fatores genéticos.',
          'A meta ideal depende do risco global: quem já teve infarto, AVC ou doença arterial costuma precisar de controle mais rigoroso.',
        ],
        bullets: [
          'Não compare sua meta com a de outra pessoa sem contexto.',
          'Leve exames anteriores para avaliar tendência.',
          'Mudança de hábitos e medicação podem ser combinadas quando indicado.',
        ],
      },
      {
        heading: 'Tratamento busca reduzir eventos, não apenas números',
        paragraphs: [
          'O objetivo de controlar colesterol é diminuir risco de infarto, AVC e progressão de placas. Por isso, a decisão envolve idade, pressão, diabetes, tabagismo, histórico familiar e exames.',
          'Essa interpretação personalizada é mais útil do que olhar apenas se o resultado está dentro da referência do laboratório.',
        ],
      },
    ],
  },
  {
    slug: 'diabetes-e-coracao-por-que-o-risco-cardiovascular-aumenta',
    title: 'Diabetes e coração: por que o risco cardiovascular aumenta',
    excerpt:
      'Diabetes pode afetar vasos, rins, nervos e coração, exigindo prevenção cardiovascular ativa mesmo quando não há sintomas.',
    category: 'Prevenção cardiovascular',
    tags: ['diabetes e coração', 'risco cardiovascular', 'infarto', 'prevenção'],
    publishedAt: '2026-07-08',
    updatedAt: '2026-07-21',
    readingTime: '7 min',
    author: {
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo revisado pela clínica',
    },
    seoTitle: 'Diabetes e coração: risco cardiovascular | Nogueira',
    seoDescription:
      'Saiba por que diabetes aumenta risco cardiovascular e quais cuidados ajudam a prevenir infarto, AVC e complicações.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/diabetes-e-coracao-por-que-o-risco-cardiovascular-aumenta.svg',
    featured: false,
    sections: [
      {
        heading: 'Diabetes muda a prevenção cardiovascular',
        paragraphs: [
          'Diabetes aumenta risco de doença arterial, infarto, AVC, insuficiência cardíaca e doença renal. Mesmo sem sintomas, pode haver dano vascular progressivo ao longo do tempo.',
          'Por isso, o cuidado não se limita à glicose. Pressão, colesterol, peso, rim, atividade física, sono e tabagismo precisam entrar no plano.',
        ],
        bullets: [
          'Acompanhe hemoglobina glicada, colesterol e função renal.',
          'Controle de pressão é tão importante quanto controle glicêmico.',
          'Sintomas aos esforços devem ser avaliados com cuidado.',
        ],
      },
      {
        heading: 'Cuidado integrado reduz risco',
        paragraphs: [
          'A prevenção cardiovascular no diabetes envolve decisões conjuntas, metas individualizadas e acompanhamento consistente.',
          'Quando cardiologia e cuidado metabólico caminham juntos, o paciente ganha clareza sobre prioridades e segurança para agir.',
        ],
      },
    ],
  },
  {
    slug: 'check-up-cardiologico-para-executivos-e-profissionais-com-rotina-intensa',
    title: 'Check-up cardiológico para executivos e profissionais com rotina intensa',
    excerpt:
      'Rotina acelerada, estresse, poucas horas de sono e sedentarismo podem aumentar o risco cardiovascular. Veja como organizar a prevenção.',
    category: 'Check-up cardiológico',
    tags: ['check-up cardiológico', 'executivos', 'estresse', 'prevenção cardiovascular'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '7 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Check-up cardiológico para executivos | Nogueira Cardiologia',
    seoDescription:
      'Entenda como o check-up cardiológico ajuda profissionais com rotina intensa a mapear pressão, colesterol, estresse e risco cardiovascular.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/check-up-cardiologico-para-executivos-e-profissionais-com-rotina-intensa.svg',
    featured: false,
    sections: [
      {
        heading: 'Rotina intensa também entra na avaliação cardiovascular',
        paragraphs: [
          'Agenda cheia, alimentação irregular, sono insuficiente, sedentarismo e estresse frequente podem influenciar pressão arterial, peso, glicemia e colesterol. O check-up cardiológico ajuda a transformar essa rotina em dados objetivos.',
          'A consulta organiza histórico familiar, sintomas, exames prévios, hábitos e metas de prevenção para orientar decisões proporcionais ao risco real.',
        ],
        bullets: [
          'Leve exames recentes e lista de medicamentos.',
          'Informe padrão de sono, estresse e atividade física.',
          'Não espere dor no peito para iniciar prevenção.',
        ],
      },
      {
        heading: 'Prevenção precisa caber na vida real',
        paragraphs: [
          'Planos muito complexos tendem a ser abandonados. Por isso, a orientação cardiovascular deve considerar agenda, trabalho, viagens, alimentação disponível e preferências do paciente.',
          'A meta é reduzir risco com medidas sustentáveis, acompanhamento adequado e exames indicados pela história clínica.',
        ],
      },
    ],
  },
  {
    slug: 'hipertensao-e-estresse-como-a-rotina-afeta-a-pressao',
    title: 'Hipertensão e estresse: como a rotina pode afetar a pressão arterial',
    excerpt:
      'Estresse não explica tudo, mas pode piorar medidas de pressão e dificultar o controle cardiovascular quando a rotina está desorganizada.',
    category: 'Hipertensão arterial',
    tags: ['hipertensão', 'estresse', 'pressão arterial', 'cardiologista'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '7 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Hipertensão e estresse: relação com a pressão | Nogueira',
    seoDescription:
      'Saiba como estresse, sono, alimentação e rotina influenciam a hipertensão arterial e quando procurar avaliação cardiológica.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/hipertensao-e-estresse-como-a-rotina-afeta-a-pressao.svg',
    featured: false,
    sections: [
      {
        heading: 'Pressão alta precisa de contexto',
        paragraphs: [
          'Uma medida isolada de pressão pode variar por dor, ansiedade, esforço, café, noites mal dormidas ou técnica incorreta. Mesmo assim, valores repetidamente elevados não devem ser normalizados.',
          'A avaliação cardiológica diferencia oscilações ocasionais de hipertensão persistente e define se é necessário acompanhar em casa, solicitar MAPA ou ajustar tratamento.',
        ],
        bullets: [
          'Registre pressão, horário e condição do momento.',
          'Evite medir logo após exercício, café ou discussão.',
          'Procure orientação se os valores altos se repetirem.',
        ],
      },
      {
        heading: 'Controlar pressão é reduzir risco',
        paragraphs: [
          'A hipertensão sem controle aumenta risco de infarto, AVC, insuficiência cardíaca e doença renal. O tratamento pode envolver hábitos, sono, atividade física e medicamentos.',
          'O plano ideal precisa ser individualizado, revisado e acompanhado com metas claras.',
        ],
      },
    ],
  },
  {
    slug: 'dor-no-peito-em-mulheres-sinais-que-merecem-atencao',
    title: 'Dor no peito em mulheres: sinais que merecem atenção cardiológica',
    excerpt:
      'Sintomas cardiovasculares em mulheres podem aparecer de forma menos típica. Entenda quando buscar avaliação e quando procurar urgência.',
    category: 'Sintomas cardíacos',
    tags: ['dor no peito', 'mulheres', 'infarto', 'cardiologista'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '7 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Dor no peito em mulheres: quando avaliar | Nogueira',
    seoDescription:
      'Conheça sinais de alerta de dor no peito em mulheres e a importância da avaliação cardiológica individualizada.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/dor-no-peito-em-mulheres-sinais-que-merecem-atencao.svg',
    featured: false,
    sections: [
      {
        heading: 'Nem sempre o sintoma é clássico',
        paragraphs: [
          'Dor, pressão ou aperto no peito podem ocorrer, mas algumas mulheres também relatam falta de ar, náusea, suor frio, cansaço fora do padrão, dor nas costas, mandíbula ou braço.',
          'Sintomas intensos, progressivos ou associados a mal-estar importante exigem atendimento de urgência, especialmente quando existem fatores de risco.',
        ],
        bullets: [
          'Não ignore dor nova ou diferente do habitual.',
          'Diabetes pode alterar a percepção de sintomas.',
          'Histórico familiar aumenta a necessidade de atenção.',
        ],
      },
      {
        heading: 'A consulta organiza risco e investigação',
        paragraphs: [
          'O cardiologista avalia história, exame físico, pressão, fatores de risco e exames necessários para entender a origem do sintoma.',
          'Essa abordagem evita tanto atraso no diagnóstico quanto investigação sem critério.',
        ],
      },
    ],
  },
  {
    slug: 'arritmia-cardiaca-quando-palpitacoes-precisam-de-avaliacao',
    title: 'Arritmia cardíaca: quando palpitações precisam de avaliação',
    excerpt:
      'Palpitações podem ser benignas ou sinalizar arritmias que merecem investigação, principalmente quando vêm com tontura, falta de ar ou desmaio.',
    category: 'Sintomas cardíacos',
    tags: ['arritmia cardíaca', 'palpitações', 'Holter', 'eletrocardiograma'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '7 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Arritmia cardíaca e palpitações | Nogueira Cardiologia',
    seoDescription:
      'Entenda quando palpitações podem indicar arritmia cardíaca e quais exames o cardiologista pode solicitar.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/arritmia-cardiaca-quando-palpitacoes-precisam-de-avaliacao.svg',
    featured: false,
    sections: [
      {
        heading: 'Palpitação é uma queixa que precisa ser descrita',
        paragraphs: [
          'O paciente pode sentir batimento acelerado, falhas, pausas, tremor no peito ou sensação de coração descompassado. A frequência, duração e sintomas associados ajudam muito na investigação.',
          'Palpitações com desmaio, dor no peito, falta de ar ou queda de pressão merecem avaliação mais rápida.',
        ],
        bullets: [
          'Anote horário, duração e situação em que ocorreu.',
          'Informe uso de cafeína, energéticos e medicamentos.',
          'Leve exames e eletrocardiogramas anteriores.',
        ],
      },
      {
        heading: 'Holter e eletrocardiograma podem ajudar',
        paragraphs: [
          'Dependendo do caso, o cardiologista pode solicitar eletrocardiograma, Holter, exames laboratoriais, ecocardiograma ou outros métodos.',
          'O objetivo é registrar o ritmo durante o sintoma e separar palpitações benignas de arritmias que exigem tratamento.',
        ],
      },
    ],
  },
  {
    slug: 'ecocardiograma-quando-o-cardiologista-pode-solicitar',
    title: 'Ecocardiograma: quando o cardiologista pode solicitar o exame',
    excerpt:
      'O ecocardiograma avalia estrutura e funcionamento do coração, ajudando na investigação de sopros, falta de ar, hipertensão e outras condições.',
    category: 'Exames cardiológicos',
    tags: ['ecocardiograma', 'exames cardiológicos', 'sopro cardíaco', 'falta de ar'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '6 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Ecocardiograma: quando fazer | Nogueira Cardiologia',
    seoDescription:
      'Saiba para que serve o ecocardiograma e quando o cardiologista pode solicitar esse exame na avaliação do coração.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/ecocardiograma-quando-o-cardiologista-pode-solicitar.svg',
    featured: false,
    sections: [
      {
        heading: 'O exame mostra estrutura e função',
        paragraphs: [
          'O ecocardiograma usa ultrassom para avaliar cavidades, válvulas, força de contração e alterações estruturais do coração.',
          'Ele pode ser solicitado em casos de sopro, falta de ar, hipertensão, dor no peito, arritmias, acompanhamento de doenças cardíacas ou alteração em outros exames.',
        ],
      },
      {
        heading: 'Indicação depende da pergunta clínica',
        paragraphs: [
          'Nem todo paciente precisa fazer ecocardiograma em toda consulta. O exame é mais útil quando existe uma dúvida clínica clara.',
          'Levar exames anteriores ajuda o cardiologista a comparar evolução e evitar repetições desnecessárias.',
        ],
      },
    ],
  },
  {
    slug: 'teste-ergometrico-para-que-serve-e-quando-fazer',
    title: 'Teste ergométrico: para que serve e quando fazer',
    excerpt:
      'O teste ergométrico avalia resposta do coração ao esforço e pode auxiliar na investigação de sintomas, pressão e capacidade funcional.',
    category: 'Exames cardiológicos',
    tags: ['teste ergométrico', 'exame de esforço', 'dor no peito', 'cardiologia'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '6 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Teste ergométrico: indicação e preparo | Nogueira',
    seoDescription:
      'Entenda para que serve o teste ergométrico, quando ele pode ser indicado e quais cuidados observar antes do exame.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/teste-ergometrico-para-que-serve-e-quando-fazer.svg',
    featured: false,
    sections: [
      {
        heading: 'O coração é observado durante o esforço',
        paragraphs: [
          'Durante o teste ergométrico, o paciente realiza esforço progressivo enquanto são monitorados sintomas, pressão arterial, frequência cardíaca e eletrocardiograma.',
          'O exame pode ajudar na investigação de dor no peito, avaliação funcional, resposta pressórica e orientação para atividade física.',
        ],
      },
      {
        heading: 'Preparo e segurança importam',
        paragraphs: [
          'O paciente deve informar medicamentos em uso, limitações físicas e sintomas recentes. Em alguns casos, outro exame pode ser mais adequado.',
          'A indicação correta aumenta a utilidade do teste e reduz riscos desnecessários.',
        ],
      },
    ],
  },
  {
    slug: 'holter-24-horas-investigacao-de-palpitacoes-e-arritmias',
    title: 'Holter 24 horas: investigação de palpitações e arritmias',
    excerpt:
      'O Holter registra o ritmo cardíaco ao longo do dia e ajuda a relacionar sintomas com alterações elétricas do coração.',
    category: 'Exames cardiológicos',
    tags: ['Holter 24 horas', 'arritmia', 'palpitações', 'ritmo cardíaco'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '6 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Holter 24 horas para palpitações | Nogueira Cardiologia',
    seoDescription:
      'Veja como o Holter 24 horas auxilia na investigação de palpitações, arritmias, tonturas e alterações do ritmo cardíaco.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/holter-24-horas-investigacao-de-palpitacoes-e-arritmias.svg',
    featured: false,
    sections: [
      {
        heading: 'Registro contínuo do ritmo cardíaco',
        paragraphs: [
          'O Holter monitora os batimentos durante atividades habituais, sono e momentos em que o paciente pode sentir sintomas.',
          'Ele é útil quando o eletrocardiograma do consultório não captura a alteração que ocorre em horários imprevisíveis.',
        ],
      },
      {
        heading: 'Diário de sintomas melhora a interpretação',
        paragraphs: [
          'Anotar horário de palpitações, tontura, falta de ar, exercício, sono e medicamentos ajuda a relacionar sintomas ao traçado registrado.',
          'O resultado deve ser interpretado junto com a história clínica, e não como um número isolado.',
        ],
      },
    ],
  },
  {
    slug: 'mapa-24-horas-monitorizacao-da-pressao-arterial',
    title: 'MAPA 24 horas: monitorização da pressão arterial fora do consultório',
    excerpt:
      'O MAPA acompanha a pressão durante o dia e a noite, ajudando a confirmar hipertensão e avaliar controle do tratamento.',
    category: 'Hipertensão arterial',
    tags: ['MAPA 24 horas', 'pressão arterial', 'hipertensão', 'cardiologista'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '6 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'MAPA 24 horas e pressão arterial | Nogueira',
    seoDescription:
      'Entenda para que serve o MAPA 24 horas e como ele ajuda no diagnóstico e controle da hipertensão arterial.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/mapa-24-horas-monitorizacao-da-pressao-arterial.svg',
    featured: false,
    sections: [
      {
        heading: 'A pressão muda ao longo do dia',
        paragraphs: [
          'O MAPA mede a pressão em intervalos programados durante 24 horas, incluindo período de sono e atividades habituais.',
          'Ele pode ajudar a identificar hipertensão, efeito do consultório, pressão noturna alterada e resposta ao tratamento.',
        ],
      },
      {
        heading: 'O resultado orienta decisões práticas',
        paragraphs: [
          'A interpretação considera médias, padrão noturno, sintomas e medicamentos em uso. Com isso, o cardiologista ajusta condutas com mais segurança.',
          'O exame deve ser solicitado quando há uma pergunta clínica clara sobre diagnóstico ou controle pressórico.',
        ],
      },
    ],
  },
  {
    slug: 'cardiologista-para-idosos-cuidados-com-pressao-e-coracao',
    title: 'Cardiologista para idosos: cuidados com pressão, ritmo e coração',
    excerpt:
      'Na terceira idade, acompanhar pressão, arritmias, sintomas e medicamentos ajuda a preservar autonomia e prevenir complicações.',
    category: 'Cardiologia clínica',
    tags: ['cardiologista para idosos', 'pressão arterial', 'arritmia', 'prevenção'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '7 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Cardiologista para idosos | Nogueira Cardiologia',
    seoDescription:
      'Veja por que idosos precisam de acompanhamento cardiológico individualizado para pressão, ritmo, medicamentos e sintomas.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/cardiologista-para-idosos-cuidados-com-pressao-e-coracao.svg',
    featured: false,
    sections: [
      {
        heading: 'O cuidado deve equilibrar proteção e segurança',
        paragraphs: [
          'Idosos podem apresentar hipertensão, arritmias, doença coronariana, alterações valvares e uso de vários medicamentos. O acompanhamento ajuda a reduzir risco sem aumentar efeitos indesejados.',
          'A avaliação considera autonomia, quedas, tonturas, rim, memória, rotina familiar e objetivos do paciente.',
        ],
      },
      {
        heading: 'Sintomas merecem investigação proporcional',
        paragraphs: [
          'Falta de ar, cansaço progressivo, palpitações, dor no peito, inchaço e desmaios não devem ser atribuídos apenas à idade.',
          'Com exames e conduta adequados, é possível melhorar segurança e qualidade de vida.',
        ],
      },
    ],
  },
  {
    slug: 'telemedicina-em-cardiologia-quando-a-consulta-online-ajuda',
    title: 'Telemedicina em cardiologia: quando a consulta online pode ajudar',
    excerpt:
      'A consulta cardiológica online pode facilitar acompanhamento, retorno de exames e orientação inicial quando o caso permite segurança clínica.',
    category: 'Telemedicina cardiológica',
    tags: ['telemedicina', 'consulta online', 'cardiologia', 'retorno cardiológico'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '7 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Telemedicina em cardiologia | Nogueira Cardiologia',
    seoDescription:
      'Entenda quando a telemedicina em cardiologia pode ser útil para acompanhamento, retorno de exames e orientação cardiovascular.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/telemedicina-em-cardiologia-quando-a-consulta-online-ajuda.svg',
    featured: false,
    sections: [
      {
        heading: 'A telemedicina amplia acesso e continuidade',
        paragraphs: [
          'A consulta online pode ajudar em retornos, revisão de exames, acompanhamento de pressão, dúvidas sobre medicamentos e orientação de prevenção quando não há sinais de urgência.',
          'Ela não substitui atendimento presencial em todos os casos, mas pode tornar a jornada mais rápida e organizada.',
        ],
        bullets: [
          'Tenha exames e medicamentos à mão.',
          'Use ambiente silencioso e conexão estável.',
          'Procure urgência se houver dor no peito intensa ou falta de ar importante.',
        ],
      },
      {
        heading: 'Segurança depende de indicação adequada',
        paragraphs: [
          'O cardiologista avalia se a consulta online é suficiente ou se há necessidade de exame físico, eletrocardiograma ou avaliação presencial.',
          'Com triagem correta, a telemedicina reduz barreiras sem perder responsabilidade clínica.',
        ],
      },
    ],
  },
  {
    slug: 'retorno-cardiologico-por-que-acompanhar-exames-e-sintomas',
    title: 'Retorno cardiológico: por que acompanhar exames e sintomas',
    excerpt:
      'O retorno não é apenas uma revisão. Ele confirma evolução, ajusta metas e transforma exames em decisões para a rotina do paciente.',
    category: 'Cardiologia clínica',
    tags: ['retorno cardiológico', 'exames', 'sintomas', 'acompanhamento'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '6 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Retorno cardiológico: importância | Nogueira',
    seoDescription:
      'Saiba por que o retorno cardiológico é importante para revisar exames, sintomas, medicamentos e metas de prevenção.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/retorno-cardiologico-por-que-acompanhar-exames-e-sintomas.svg',
    featured: false,
    sections: [
      {
        heading: 'Exame precisa virar decisão',
        paragraphs: [
          'Resultados laboratoriais, eletrocardiograma, ecocardiograma ou outros exames ganham sentido quando comparados com sintomas, histórico e risco cardiovascular.',
          'O retorno permite ajustar medicações, reforçar metas e decidir próximos passos com base em evolução real.',
        ],
      },
      {
        heading: 'Chegar organizado melhora a consulta',
        paragraphs: [
          'Leve lista de medicamentos, medidas de pressão, sintomas anotados e dúvidas principais. Isso evita decisões incompletas e melhora a comunicação.',
          'A continuidade do cuidado é uma das formas mais eficazes de prevenir complicações.',
        ],
      },
    ],
  },
  {
    slug: 'risco-cardiovascular-familiar-quando-historico-pesa',
    title: 'Risco cardiovascular familiar: quando o histórico pesa na prevenção',
    excerpt:
      'Infarto, AVC e colesterol alto em familiares podem mudar a estratégia de prevenção cardiovascular mesmo antes dos sintomas.',
    category: 'Prevenção cardiovascular',
    tags: ['histórico familiar', 'risco cardiovascular', 'infarto', 'AVC'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '7 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Histórico familiar e risco cardiovascular | Nogueira',
    seoDescription:
      'Entenda como histórico familiar de infarto, AVC e colesterol alto influencia a prevenção cardiovascular.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/risco-cardiovascular-familiar-quando-historico-pesa.svg',
    featured: false,
    sections: [
      {
        heading: 'Família ajuda a estimar risco',
        paragraphs: [
          'Histórico de infarto, AVC, morte súbita ou colesterol muito alto em familiares próximos pode indicar maior risco cardiovascular.',
          'Esse dado não determina o futuro, mas ajuda o cardiologista a definir intensidade de prevenção, metas de colesterol e necessidade de investigação.',
        ],
      },
      {
        heading: 'Genética não elimina escolhas de prevenção',
        paragraphs: [
          'Mesmo com histórico familiar importante, controlar pressão, colesterol, glicemia, peso, sono e tabagismo continua sendo decisivo.',
          'A consulta transforma preocupação familiar em plano clínico organizado.',
        ],
      },
    ],
  },
  {
    slug: 'colesterol-ldl-alto-entenda-metas-e-prevencao',
    title: 'Colesterol LDL alto: entenda metas e prevenção cardiovascular',
    excerpt:
      'O LDL precisa ser interpretado junto com o risco cardiovascular total, e não apenas como número isolado no exame.',
    category: 'Prevenção cardiovascular',
    tags: ['colesterol LDL', 'prevenção', 'risco cardiovascular', 'cardiologia'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '7 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Colesterol LDL alto e prevenção | Nogueira',
    seoDescription:
      'Saiba por que metas de LDL dependem do risco cardiovascular e como o cardiologista orienta prevenção de infarto e AVC.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/colesterol-ldl-alto-entenda-metas-e-prevencao.svg',
    featured: false,
    sections: [
      {
        heading: 'LDL é uma peça do risco total',
        paragraphs: [
          'O colesterol LDL está associado à formação de placas nas artérias, mas a meta ideal muda conforme idade, pressão, diabetes, tabagismo e histórico de doença cardiovascular.',
          'Por isso, duas pessoas com LDL parecido podem receber orientações diferentes.',
        ],
      },
      {
        heading: 'Tratamento busca prevenir eventos',
        paragraphs: [
          'Mudanças de alimentação, atividade física, controle de peso e medicamentos podem ser combinados quando indicados.',
          'A decisão correta considera benefício, segurança, exames prévios e acompanhamento ao longo do tempo.',
        ],
      },
    ],
  },
  {
    slug: 'falta-de-ar-aos-esforcos-quando-investigar-o-coracao',
    title: 'Falta de ar aos esforços: quando investigar o coração',
    excerpt:
      'Cansaço e falta de ar ao subir escadas ou caminhar podem ter várias causas, incluindo alterações cardiovasculares que merecem avaliação.',
    category: 'Sintomas cardíacos',
    tags: ['falta de ar', 'cansaço', 'insuficiência cardíaca', 'cardiologista'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '7 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Falta de ar aos esforços: coração ou pulmão? | Nogueira',
    seoDescription:
      'Entenda quando falta de ar aos esforços pode indicar necessidade de avaliação cardiológica e quais sinais pedem atenção.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/falta-de-ar-aos-esforcos-quando-investigar-o-coracao.svg',
    featured: false,
    sections: [
      {
        heading: 'Mudança de padrão merece atenção',
        paragraphs: [
          'Falta de ar que surge em esforços antes bem tolerados, piora progressiva, vem com dor no peito, inchaço ou palpitações deve ser investigada.',
          'As causas podem envolver coração, pulmão, anemia, condicionamento, peso e outros fatores. A história clínica orienta o caminho correto.',
        ],
      },
      {
        heading: 'Avaliação evita atrasos',
        paragraphs: [
          'O cardiologista pode solicitar exames conforme suspeita, como eletrocardiograma, ecocardiograma, teste ergométrico ou exames laboratoriais.',
          'Quanto mais cedo o padrão é entendido, mais seguro fica o plano de tratamento e prevenção.',
        ],
      },
    ],
  },
  {
    slug: 'consulta-cardiologica-em-sao-jose-do-rio-preto-como-se-preparar',
    title: 'Consulta cardiológica em São José do Rio Preto: como se preparar',
    excerpt:
      'Chegar à consulta com exames, medicamentos, sintomas e dúvidas organizados ajuda o cardiologista a tomar decisões melhores.',
    category: 'Cardiologia clínica',
    tags: ['consulta cardiológica', 'São José do Rio Preto', 'cardiologista', 'preparo'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '6 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Consulta cardiológica em São José do Rio Preto | Nogueira',
    seoDescription:
      'Veja como se preparar para uma consulta cardiológica em São José do Rio Preto e quais informações levar ao cardiologista.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/consulta-cardiologica-em-sao-jose-do-rio-preto-como-se-preparar.svg',
    featured: false,
    sections: [
      {
        heading: 'Informação organizada economiza tempo clínico',
        paragraphs: [
          'Leve exames recentes, lista de medicamentos com dose, medidas de pressão, sintomas anotados e histórico familiar relevante.',
          'Esses dados ajudam o cardiologista a entender risco, priorizar problemas e evitar repetição desnecessária de exames.',
        ],
        bullets: [
          'Anote quando os sintomas começaram.',
          'Inclua alergias e cirurgias prévias.',
          'Informe hábitos, sono, atividade física e tabagismo.',
        ],
      },
      {
        heading: 'A consulta é parte de uma jornada',
        paragraphs: [
          'Depois da avaliação, pode haver exames, retorno, ajustes de tratamento ou acompanhamento por telemedicina quando adequado.',
          'O objetivo é criar um plano claro para cuidado do coração, prevenção e qualidade de vida.',
        ],
      },
    ],
  },
  {
    slug: 'pos-consulta-cardiologica-como-seguir-o-plano-com-seguranca',
    title: 'Pós-consulta cardiológica: como seguir o plano com segurança',
    excerpt:
      'Depois da consulta, organizar receitas, exames solicitados, retornos e sinais de alerta ajuda o paciente a manter continuidade no cuidado.',
    category: 'Cardiologia clínica',
    tags: ['pós-consulta', 'cardiologia', 'medicamentos', 'acompanhamento'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    readingTime: '6 min',
    author: { name: 'Nogueira Cardiologia', role: 'Conteúdo educativo revisado pela clínica' },
    seoTitle: 'Pós-consulta cardiológica: próximos passos | Nogueira',
    seoDescription:
      'Entenda como organizar medicamentos, exames, retorno e sinais de alerta depois da consulta cardiológica.',
    coverImage: '/uploads-imagens-nogueira/educativo-covers/pos-consulta-cardiologica-como-seguir-o-plano-com-seguranca.svg',
    featured: false,
    sections: [
      {
        heading: 'O cuidado continua depois da consulta',
        paragraphs: [
          'Receitas, pedidos de exame e orientações precisam entrar na rotina do paciente. Organização reduz esquecimentos e melhora adesão ao plano.',
          'Também é importante entender quando retornar, quando enviar exames e quais sinais exigem atendimento imediato.',
        ],
      },
      {
        heading: 'Dúvidas devem ser levadas ao retorno',
        paragraphs: [
          'Anote efeitos colaterais, dificuldades com medicação, medidas de pressão e sintomas. Esses registros ajudam o cardiologista a ajustar a conduta.',
          'A continuidade bem feita transforma orientação em resultado prático para a saúde cardiovascular.',
        ],
      },
    ],
  },
];

export const getFeaturedPosts = () => blogPosts.filter((post) => post.featured);
export const getPostBySlug = (slug: string) => blogPosts.find((post) => post.slug === slug);
export const getRecentPosts = () =>
  [...blogPosts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
export const getBlogCategorySummaries = () => {
  const categoryCounts = blogPosts.reduce<Map<string, number>>((counts, post) => {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
    return counts;
  }, new Map());

  return [...categoryCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([name, count]) => ({
      name,
      slug: getBlogCategorySlug(name),
      count,
    }));
};
export const getBlogCategories = () => getBlogCategorySummaries().map((category) => category.name);
export const getRelatedPosts = (slug: string, category: string) =>
  [
    ...blogPosts.filter((post) => post.slug !== slug && post.category === category),
    ...getRecentPosts().filter((post) => post.slug !== slug && post.category !== category),
  ].slice(0, 3);
