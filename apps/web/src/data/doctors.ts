export type DoctorProfile = {
  slug: string;
  name: string;
  shortName: string;
  crm: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
  introduction: string;
  specialties: string[];
  credentials: string[];
};

export const doctors: DoctorProfile[] = [
  {
    slug: 'dr-paulo-roberto-nogueira',
    name: 'Dr. Paulo Roberto Nogueira',
    shortName: 'Dr. Paulo Nogueira',
    crm: 'CRM 53.790/SP',
    image: '/brand/dr-paulo-roberto-nogueira.jpeg',
    seoTitle: 'Dr. Paulo Roberto Nogueira | Cardiologista em Rio Preto',
    seoDescription:
      'Conheça a trajetória do Dr. Paulo Roberto Nogueira, cardiologista, intensivista e professor em São José do Rio Preto.',
    introduction:
      'Cardiologista e intensivista com atuação em cardiologia clínica, doença coronariana e cardiomiopatias, unindo assistência, ensino médico e acompanhamento cardiovascular.',
    specialties: ['Cardiologia clínica', 'Coronariopatias', 'Cardiomiopatias', 'Prevenção cardiovascular', 'Terapia intensiva'],
    credentials: [
      'Formação pela Faculdade de Ciências Médicas da Santa Casa de São Paulo.',
      'Residência Médica no Instituto de Moléstias Cardiovasculares – IMC.',
      'Doutorado em Cardiologia pela Faculdade de Medicina da Universidade de São Paulo – FMUSP.',
      'Professor Adjunto da FAMERP no Departamento de Cardiologia e Cirurgia Cardiovascular.',
      'Participação ativa em educação médica e eventos científicos da SOCESP.',
    ],
  },
  {
    slug: 'dra-cristiani-nogueira',
    name: 'Dra. Cristiani Monteiro de Oliveira Nogueira',
    shortName: 'Dra. Cristiani Nogueira',
    crm: 'CRM 77.127/SP',
    image: '/brand/dra-cristiani-monteiro-de-oliveira-nogueira.jpeg',
    seoTitle: 'Dra. Cristiani Nogueira | Cardiologista em Rio Preto',
    seoDescription:
      'Conheça a Dra. Cristiani Nogueira, cardiologista clínica com atendimento humanizado em São José do Rio Preto.',
    introduction:
      'Médica cardiologista clínica com atendimento humanizado, acompanhamento preventivo e atenção integrada aos fatores que influenciam a saúde cardiovascular.',
    specialties: ['Cardiologia clínica', 'Cardiologia da mulher', 'Hipertensão arterial', 'Check-up cardiológico', 'Prevenção cardiovascular'],
    credentials: [
      'Médica cardiologista com atuação clínica em São José do Rio Preto.',
      'Acompanhamento individualizado de hipertensão e fatores de risco.',
      'Atuação em prevenção cardiovascular e check-up cardiológico.',
      'Cuidado voltado à escuta, clareza das orientações e continuidade do tratamento.',
      'Integração entre consulta presencial, telemedicina e portal do paciente.',
    ],
  },
];

export const getDoctorBySlug = (slug: string) => doctors.find((doctor) => doctor.slug === slug);
