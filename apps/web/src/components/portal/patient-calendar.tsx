'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type CalendarAppointment = {
  id: string;
  scheduledFor: string;
  doctorName: string;
  status: string;
};

const doctorColors = {
  Paulo: 'bg-sky-100 text-sky-800',
  Cristiani: 'bg-violet-100 text-violet-800',
};

export function PatientCalendar({ appointments }: { appointments: CalendarAppointment[] }) {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const days = useMemo(() => buildMonth(visibleMonth), [visibleMonth]);
  const holidays = useMemo(() => getBrazilianHolidays(visibleMonth.getFullYear()), [visibleMonth]);

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#15A7DD]">Agenda dos cardiologistas</p>
          <h2 className="mt-1 text-2xl font-semibold capitalize text-[#0F3760]">
            {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(visibleMonth)}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-xl text-slate-600 hover:bg-slate-50">‹</button>
          <button type="button" onClick={() => setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-[#14508B] hover:bg-[#EAF4FF]">Hoje</button>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-xl text-slate-600 hover:bg-slate-50">›</button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((weekday) => (
          <div key={weekday} className="px-1 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">{weekday}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date) => {
          const key = dateKey(date);
          const inMonth = date.getMonth() === visibleMonth.getMonth();
          const weekend = date.getDay() === 0 || date.getDay() === 6;
          const holiday = holidays.get(key);
          const dayAppointments = appointments.filter((appointment) => dateKey(new Date(appointment.scheduledFor)) === key);
          const isToday = dateKey(today) === key;

          return (
            <div
              key={key}
              className={`min-h-24 border-b border-r border-slate-100 p-1.5 sm:min-h-32 sm:p-2 ${
                !inMonth ? 'bg-slate-50/70 text-slate-300' : weekend || holiday ? 'bg-amber-50/45' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${isToday ? 'bg-[#14508B] text-white' : ''}`}>
                  {date.getDate()}
                </span>
                {holiday ? <span className="hidden max-w-20 text-right text-[9px] font-bold leading-3 text-amber-700 sm:block">{holiday}</span> : null}
              </div>

              {inMonth && !weekend && !holiday ? (
                <div className="mt-1 grid gap-1">
                  <Link href="/portal/paciente/agendar" className={`truncate rounded px-1.5 py-1 text-[9px] font-bold sm:text-[10px] ${doctorColors.Paulo}`}>
                    Paulo · horários
                  </Link>
                  <Link href="/portal/paciente/agendar" className={`truncate rounded px-1.5 py-1 text-[9px] font-bold sm:text-[10px] ${doctorColors.Cristiani}`}>
                    Cristiani · horários
                  </Link>
                </div>
              ) : null}

              {dayAppointments.map((appointment) => (
                <div key={appointment.id} className="mt-1 rounded bg-emerald-600 px-1.5 py-1 text-[9px] font-bold leading-3 text-white sm:text-[10px]">
                  Minha consulta · {formatTime(appointment.scheduledFor)}
                  <span className="block truncate font-medium text-white/85">{shortDoctorName(appointment.doctorName)}</span>
                </div>
              ))}
              {holiday && inMonth ? <span className="mt-1 block text-[9px] font-bold leading-3 text-amber-700 sm:hidden">Feriado</span> : null}
            </div>
          );
        })}
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-sky-400" />Dr. Paulo</span>
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-violet-400" />Dra. Cristiani</span>
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />Minha consulta</span>
        </div>
        <Link href="/portal/paciente/agendar" className="font-bold text-[#14508B]">Abrir agenda e escolher horário →</Link>
      </footer>
    </section>
  );
}

function buildMonth(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

function shortDoctorName(name: string) {
  if (name.includes('Cristiani')) return 'Dra. Cristiani';
  if (name.includes('Paulo')) return 'Dr. Paulo';
  return name;
}

function getBrazilianHolidays(year: number) {
  const holidays = new Map<string, string>();
  const add = (month: number, day: number, name: string) => holidays.set(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, name);
  add(1, 1, 'Confraternização Universal');
  add(3, 19, 'Aniversário de Rio Preto');
  add(4, 21, 'Tiradentes');
  add(5, 1, 'Dia do Trabalho');
  add(7, 9, 'Revolução Constitucionalista');
  add(9, 7, 'Independência do Brasil');
  add(10, 12, 'Nossa Senhora Aparecida');
  add(11, 2, 'Finados');
  add(11, 15, 'Proclamação da República');
  add(11, 20, 'Consciência Negra');
  add(12, 25, 'Natal');

  const easter = calculateEaster(year);
  addRelativeHoliday(holidays, easter, -48, 'Carnaval');
  addRelativeHoliday(holidays, easter, -47, 'Carnaval');
  addRelativeHoliday(holidays, easter, -2, 'Paixão de Cristo');
  addRelativeHoliday(holidays, easter, 60, 'Corpus Christi');
  return holidays;
}

function addRelativeHoliday(holidays: Map<string, string>, easter: Date, offset: number, name: string) {
  const date = new Date(easter);
  date.setDate(date.getDate() + offset);
  holidays.set(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, name);
}

function calculateEaster(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12);
}
