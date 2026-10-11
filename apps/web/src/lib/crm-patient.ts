export const patientSexOptions = [
  ['female', 'Feminino'], ['male', 'Masculino'], ['intersex', 'Intersexo'], ['not_informed', 'Não informado'],
] as const;
export const brazilStates = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export function todayInBrazil() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function patientAge(birthDate: string, today = todayInBrazil()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || birthDate > today) return null;
  const parsed = new Date(`${birthDate}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== birthDate) return null;
  const [year, month, day] = birthDate.split('-').map(Number);
  const [currentYear, currentMonth, currentDay] = today.split('-').map(Number);
  return currentYear - year - (currentMonth < month || (currentMonth === month && currentDay < day) ? 1 : 0);
}

export class PatientValidationError extends Error {}

export function patientRegistration(body: Record<string, unknown>) {
  function field(key: string, label: string, max: number, required = true) {
    const value = typeof body[key] === 'string' ? body[key].trim() : '';
    if ((required && !value) || value.length > max) throw new PatientValidationError(`Confira o campo ${label}.`);
    return value;
  }
  const fullName = field('fullName', 'nome completo', 160);
  const birthDate = field('birthDate', 'data de nascimento', 10);
  const sex = field('sex', 'sexo', 20);
  const email = field('email', 'e-mail', 254).toLowerCase();
  const phone = field('phone', 'telefone', 40).replace(/\D/g, '');
  const postalCode = field('postalCode', 'CEP', 10).replace(/\D/g, '');
  const street = field('street', 'logradouro', 160);
  const number = field('number', 'número', 20);
  const complement = field('complement', 'complemento', 120, false);
  const neighborhood = field('neighborhood', 'bairro', 100);
  const city = field('city', 'cidade', 100);
  const state = field('state', 'UF', 2).toUpperCase();
  const medications = field('medications', 'medicamentos em uso', 3000);
  if (fullName.length < 2) throw new PatientValidationError('Informe o nome completo.');
  if (patientAge(birthDate) === null || birthDate < '1900-01-01') throw new PatientValidationError('Informe uma data de nascimento válida, até hoje.');
  if (!patientSexOptions.some(([value]) => value === sex)) throw new PatientValidationError('Selecione o sexo.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PatientValidationError('Informe um e-mail válido.');
  if (!/^\d{10,13}$/.test(phone)) throw new PatientValidationError('Informe o telefone com DDD.');
  if (!/^\d{8}$/.test(postalCode)) throw new PatientValidationError('O CEP deve conter 8 dígitos.');
  if (!brazilStates.includes(state)) throw new PatientValidationError('Selecione uma UF válida.');
  return { fullName, birthDate, sex, email, phone, postalCode, street, number, complement, neighborhood, city, state, medications };
}
