export const pipelineStages = [
  {
    id: 'new',
    title: 'Novo lead',
    leads: [
      { name: 'Mariana Alves', phone: '(17) 99911-2233', source: 'Educativo', note: 'Leu conteúdo sobre pressão alta.' },
      { name: 'Roberto Lima', phone: '(17) 98822-1144', source: 'WhatsApp', note: 'Quer consulta com Dr. Paulo.' },
    ],
  },
  {
    id: 'contact_started',
    title: 'Contato iniciado',
    leads: [
      { name: 'Carla Mendes', phone: '(17) 99122-7788', source: 'Portal', note: 'Aguardando confirmação de horário.' },
    ],
  },
  {
    id: 'awaiting_payment',
    title: 'Aguardando pagamento',
    leads: [
      { name: 'Eduardo Prado', phone: '(17) 99777-4433', source: 'Marcar Consulta', note: 'Checkout Asaas enviado.' },
    ],
  },
  {
    id: 'confirmed',
    title: 'Consulta confirmada',
    leads: [
      { name: 'Patricia Souza', phone: '(17) 99666-2200', source: 'Indicação', note: 'Consulta confirmada para sexta.' },
    ],
  },
] as const;

export const doctorMetrics = [
  ['Leads capturados', '128', '+18% na semana'],
  ['Consultas solicitadas', '42', '16 aguardando pagamento'],
  ['Pagamentos confirmados', '27', 'R$ 9.450,00 previsto'],
  ['Conteúdos acessados', '814', 'Pressão alta lidera buscas'],
] as const;

export const todayAppointments = [
  { time: '09:00', patient: 'Ana Carolina', doctor: 'Dr. Paulo', status: 'Confirmada' },
  { time: '10:30', patient: 'João Pedro', doctor: 'Dra. Cristiani', status: 'Aguardando pagamento' },
  { time: '14:00', patient: 'Maria Helena', doctor: 'Dr. Paulo', status: 'Confirmada' },
] as const;

export const riskSummary = [
  ['Hipertensão/pressão alta', '38 pacientes'],
  ['Diabetes', '14 pacientes'],
  ['Colesterol alto', '31 pacientes'],
  ['Tabagismo', '9 pacientes'],
] as const;
