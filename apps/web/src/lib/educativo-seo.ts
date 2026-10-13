import type { EditorialContent } from './educativo-types';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const text=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|quot|lt|gt);/g,' ').replace(/\s+/g,' ').trim();
export function analyzeSeo(post:EditorialContent) {
  const body=text(post.content_html), words=body.split(/\s+/).filter(Boolean);
  const keyword=normalize(post.primary_keyword.trim()), has=(s:string)=>Boolean(keyword)&&normalize(s).includes(keyword);
  const paragraphs=[...post.content_html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>text(m[1])).filter(Boolean);
  const headings=[...post.content_html.matchAll(/<h([123])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const links=[...post.content_html.matchAll(/<a\b[^>]*href="([^"]*)"/gi)].map(m=>m[1]);
  const images=[...post.content_html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0].match(/alt="([^"]*)"/i)?.[1]||'');
  if(post.cover_image_url)images.push(post.cover_alt);
  for(const detail of Object.values(post.material_details)) if(detail.alt !== undefined && detail.caption !== undefined) images.push(detail.alt);
  const occurrences=keyword?normalize(body).split(keyword).length-1:0;
  const density=words.length?occurrences*keyword.split(/\s+/).length/words.length:0;
  const sentences=body.split(/[.!?]+/).filter(s=>s.trim());
  const checks=[
    {label:'Título claro',ok:post.title.length>=15&&post.title.length<=100,tip:'Use um título descritivo, preferencialmente entre 15 e 100 caracteres.'},
    {label:'Palavra-chave principal definida',ok:Boolean(keyword),tip:'Escolha o tema central do conteúdo.'},
    {label:'Palavra-chave no título',ok:has(post.title),tip:'Inclua o tema no título quando fizer sentido.'},
    {label:'URL curta e descritiva',ok:post.slug.length<=80&&!post.slug.startsWith('rascunho-'),tip:'Prefira uma URL legível. URLs já publicadas são preservadas.'},
    {label:'Tema presente na URL',ok:has(post.slug.replaceAll('-',' ')),tip:'A URL pode refletir o assunto, sem mudar endereços já publicados.'},
    {label:'Título SEO',ok:post.seo_title.length>=30&&post.seo_title.length<=65,tip:'Sugestão: 30 a 65 caracteres para o título SEO.'},
    {label:'Meta description',ok:post.seo_description.length>=100&&post.seo_description.length<=160,tip:'Resuma o conteúdo em aproximadamente 100 a 160 caracteres.'},
    {label:'Tema na descrição',ok:has(post.seo_description),tip:'Apresente o tema principal na descrição de forma natural.'},
    {label:'Tema no início do texto',ok:has(paragraphs[0]||''),tip:'Explique o assunto logo no primeiro parágrafo.'},
    {label:'Tema em subtítulo H2',ok:headings.some(m=>m[1]==='2'&&has(text(m[2]))),tip:'Um subtítulo descritivo ajuda a orientar a leitura.'},
    {label:'Uso natural do tema',ok:occurrences>0&&density<=0.06,tip:density>0.06?'O termo aparece com muita frequência. Revise repetições e priorize clareza.':'Desenvolva o tema naturalmente, sem repetir palavras para aumentar a nota.'},
    {label:'Conteúdo desenvolvido',ok:words.length>=250,tip:'Avalie se o texto responde às dúvidas do leitor. A extensão necessária depende do assunto.'},
    {label:'Link interno',ok:links.some(l=>l.startsWith('/')||/^https:\/\/(?:www\.)?nogueiracardiologia.com.br\//.test(l)),tip:'Quando útil, conecte a outros conteúdos da clínica.'},
    {label:'Referência externa',ok:links.some(l=>/^https?:/.test(l)&&!l.includes('nogueiracardiologia.com.br')),tip:'Quando aplicável, inclua fontes confiáveis. Links externos não são obrigatórios em todos os materiais.'},
    {label:'Imagem de apoio',ok:images.length>0,tip:'Uma imagem relevante pode ajudar a compreensão.'},
    {label:'Imagens com ALT',ok:images.length>0&&images.every(a=>a.trim()),tip:'Descreva cada imagem para quem usa leitor de tela.'},
    {label:'ALT relacionado ao tema',ok:images.some(has),tip:'Descreva a imagem com precisão; cite o tema somente se ele estiver representado.'},
    {label:'Hierarquia de títulos',ok:headings.some(m=>m[1]==='2')&&!headings.some(m=>m[1]==='1')&&!headings.some((m,i)=>m[1]==='3'&&(i===0||headings[i-1][1]==='1')),tip:'O título da página já é H1. Organize o corpo com H2 e H3.'},
    {label:'Parágrafos fáceis de acompanhar',ok:paragraphs.length>0&&paragraphs.every(p=>p.split(/\s+/).length<=120),tip:'Divida parágrafos muito longos, mantendo as ideias conectadas.'},
    {label:'Frases claras',ok:sentences.length>0&&words.length/sentences.length<=30,tip:'A média de palavras por frase é um sinal simples de legibilidade, sem avaliar a precisão médica.'},
  ];
  const stop=new Set('para como uma umas uns dos das com que por seu sua seus suas nao sao mais pela pelo pelos pelas entre sobre este esta esse essa isso isto artigo aula muito quando onde pode podem deve deve ser ter sem nos nas aos ao em de do da e o a os as um no na se ou mas também tem com voce'.split(' '));
  const frequency=new Map<string,{term:string;count:number}>();
  for(const w of (body+' '+post.title).match(/[\p{L}]{4,}/gu)||[]) {const key=normalize(w);if(stop.has(key))continue;const prior=frequency.get(key);frequency.set(key,{term:w.toLowerCase(),count:(prior?.count||0)+1});}
  const suggestions=[...frequency.values()].sort((a,b)=>b.count-a.count).slice(0,8).map(v=>v.term);
  return {score:Math.round(checks.filter(c=>c.ok).length/checks.length*100),checks,words:words.length,suggestions};
}
