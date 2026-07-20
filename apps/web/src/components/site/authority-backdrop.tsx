import Image from 'next/image';

type AuthorityBackdropProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

const backdropImages = [
  '/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris3.png',
  '/uploads-imagens-nogueira/paulo-socesp4.jpeg',
  '/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris1.png',
] as const;

export function AuthorityBackdrop({
  eyebrow = 'Nogueira Cardiologia Digital',
  title = 'Tecnologia, experiência médica e organização para uma jornada cardiovascular mais clara.',
  description = 'Portal do paciente, conteúdos educativos, central de exames e painel interno conectam atendimento, informação e gestão clínica em um ambiente seguro.',
}: AuthorityBackdropProps) {
  return (
    <section className="relative overflow-hidden bg-[#0A2C4D] text-white">
      <div className="absolute inset-0" aria-hidden="true">
        {backdropImages.map((image) => (
          <div key={image} className="authority-backdrop-image absolute inset-0">
            <Image
              src={image}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[50%_22%]"
              priority={image === backdropImages[0]}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,44,77,0.94)_0%,rgba(10,44,77,0.82)_42%,rgba(10,44,77,0.54)_100%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9FE6FF]">{eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 sm:text-base">{description}</p>
        </div>
      </div>
    </section>
  );
}
