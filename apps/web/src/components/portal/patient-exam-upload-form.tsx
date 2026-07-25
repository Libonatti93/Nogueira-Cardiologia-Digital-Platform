'use client';

import { useState } from 'react';
import Link from 'next/link';

const examTypes = [
  'Eletrocardiograma',
  'Ecocardiograma',
  'Holter',
  'MAPA',
  'Teste ergométrico',
  'Tomografia',
  'Ressonância',
  'Exames laboratoriais',
  'Relatório médico',
  'Outro exame',
] as const;

type LocationState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export function PatientExamUploadForm({ fullName, email }: { fullName: string; email: string }) {
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [coordinates, setCoordinates] = useState({ latitude: '', longitude: '', accuracy: '' });

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationState('unavailable');
      return;
    }

    setLocationState('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
          accuracy: String(Math.round(position.coords.accuracy)),
        });
        setLocationState('granted');
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <form action="/api/exams" method="post" encType="multipart/form-data" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-[#0F3760]">Enviar novo exame</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Selecione o tipo, a data e o arquivo. Ao concluir, você permanecerá nesta página e verá a confirmação do recebimento.
      </p>

      <input type="hidden" name="locationLatitude" value={coordinates.latitude} />
      <input type="hidden" name="locationLongitude" value={coordinates.longitude} />
      <input type="hidden" name="locationAccuracy" value={coordinates.accuracy} />
      <input type="hidden" name="privacyNoticeVersion" value="2026-07-25" />

      <div className="mt-5 grid gap-4">
        <Field label="Nome do paciente" name="patientFullName" defaultValue={fullName} />
        <Field label="E-mail" name="patientEmail" type="email" defaultValue={email} />
        <Field label="WhatsApp" name="patientPhoneWhatsapp" type="tel" placeholder="(17) 99999-9999" required={false} />
        <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
          Tipo de exame
          <select name="examType" className="rounded-lg border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2">
            {examTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <Field label="Data do exame" name="examDate" type="date" required={false} />
        <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
          Observações
          <textarea
            name="notes"
            rows={4}
            className="rounded-lg border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
            placeholder="Ex.: laudo de ecocardiograma realizado em outro laboratório."
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
          Arquivo do exame
          <input
            name="examFile"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            required
            className="rounded-lg border border-dashed border-[#14508B]/30 bg-[#F4F9FF] px-4 py-4 text-sm font-normal text-slate-700 outline-none ring-[#15A7DD] file:mr-4 file:rounded-lg file:border-0 file:bg-[#14508B] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white focus:ring-2"
          />
          <span className="text-xs font-normal leading-5 text-slate-500">PDF, JPG, PNG ou WEBP, com até 15 MB.</span>
        </label>

        <section className="rounded-2xl border border-[#14508B]/12 bg-[#F8FBFF] p-4">
          <h3 className="text-sm font-bold text-[#0F3760]">Segurança e registro do envio</h3>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Para prevenir fraude e comprovar o envio, registramos data, hora, IP, navegador e tipo de dispositivo. A localização precisa é opcional e só é obtida se você autorizar no navegador.
          </p>
          <button
            type="button"
            onClick={requestLocation}
            disabled={locationState === 'requesting' || locationState === 'granted'}
            className="mt-3 inline-flex rounded-full border border-[#14508B]/20 bg-white px-4 py-2 text-xs font-bold text-[#14508B] disabled:cursor-not-allowed disabled:opacity-65"
          >
            {locationState === 'requesting' ? 'Aguardando autorização…' : locationState === 'granted' ? 'Localização autorizada' : 'Autorizar localização (opcional)'}
          </button>
          {locationState === 'granted' ? <p className="mt-2 text-xs font-semibold text-emerald-700">Permissão registrada para este envio.</p> : null}
          {locationState === 'denied' ? <p className="mt-2 text-xs text-slate-600">Permissão não concedida. Você pode enviar o exame normalmente.</p> : null}
          {locationState === 'unavailable' ? <p className="mt-2 text-xs text-slate-600">Este navegador não oferece geolocalização. O envio continua disponível.</p> : null}
        </section>

        <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
          <input name="lgpdConsent" type="checkbox" value="true" required className="mt-1 h-4 w-4 shrink-0 accent-[#14508B]" />
          <span>
            Confirmo que este exame é meu ou que tenho autorização para enviá-lo e autorizo seu tratamento pelo médico responsável para organização do atendimento e assistência em saúde.
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
          <input name="internationalTransferConsent" type="checkbox" value="true" required className="mt-1 h-4 w-4 shrink-0 accent-[#14508B]" />
          <span>
            Estou ciente e concordo, de forma específica, que os dados e o arquivo poderão ser armazenados em infraestrutura localizada em Boston, Massachusetts, Estados Unidos, caracterizando transferência internacional de dados, com aplicação das proteções previstas na LGPD. Consulte a{' '}
            <Link href="/privacidade#transferencia-internacional" className="font-bold underline">Política de Privacidade</Link>.
          </span>
        </label>
        <button type="submit" className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white hover:bg-[#0F3760]">
          Enviar exame com segurança
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="rounded-lg border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
      />
    </label>
  );
}
