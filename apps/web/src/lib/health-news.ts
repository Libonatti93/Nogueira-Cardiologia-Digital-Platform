export type HealthNewsItem = {
  title: string;
  url: string;
  source: string;
};

const sourceUrl = 'https://www.gov.br/saude/pt-br/assuntos/noticias';

export async function getHealthNews(): Promise<HealthNewsItem[]> {
  try {
    const response = await fetch(sourceUrl, { next: { revalidate: 1800 } });
    if (!response.ok) throw new Error('Fonte indisponível');
    const html = await response.text();
    const matches = [...html.matchAll(/<a[^>]+href="([^"]*\/assuntos\/noticias\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
    const items = matches
      .map((match) => ({
        url: new URL(decodeHtml(match[1]), sourceUrl).toString(),
        title: stripHtml(decodeHtml(match[2])),
        source: 'Ministério da Saúde',
      }))
      .filter((item) => item.title.length >= 28 && !item.url.includes('b_start'))
      .filter((item, index, all) => all.findIndex((candidate) => candidate.url === item.url) === index)
      .slice(0, 5);
    if (items.length) return items;
  } catch {
    // A lista institucional abaixo mantém a área útil se a fonte estiver temporariamente indisponível.
  }

  return [
    { title: 'Últimas notícias e orientações do Ministério da Saúde', url: sourceUrl, source: 'Ministério da Saúde' },
    { title: 'Informações confiáveis sobre saúde e prevenção', url: 'https://www.fiocruz.br/', source: 'Fiocruz' },
    { title: 'Alertas e orientações de vigilância sanitária', url: 'https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa', source: 'Anvisa' },
  ];
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
