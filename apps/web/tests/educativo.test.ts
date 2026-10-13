import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeContent, sectionsToHtml, contentTeaser, safeImageUrl } from '../src/lib/educativo-html';
import { validateEducationalFile, validateUploadName } from '../src/lib/educativo-upload';
import { analyzeSeo } from '../src/lib/educativo-seo';
import type { EditorialContent } from '../src/lib/educativo-types';
import sharp from 'sharp';
import * as CFB from 'cfb';
import { watermarkEducationalImage } from '../src/lib/educativo-render';

test('rich HTML keeps semantic formatting while stripping active content and unsafe URLs',()=>{
  const safe=sanitizeContent('<h2>Título 💙</h2><p><b>forte</b><i>ênfase</i><u>sublinhado</u><strike>antigo</strike></p><script>alert(1)</script><iframe src="https://evil.test">hidden</iframe><a href="javascript:alert(1)" onclick="bad()">link</a><img src="https://evil.test/track" onerror="bad()"><div class="educativo-callout" style="text-align:center; background:url(javascript:bad)">nota</div>');
  assert.match(safe,/<strong>forte<\/strong>/);assert.match(safe,/<em>ênfase<\/em>/);assert.match(safe,/<s>antigo<\/s>/);
  assert.doesNotMatch(safe,/script|iframe|javascript:|onclick|onerror|evil\.test|background/i);
  assert.match(safe,/class="educativo-callout"/);assert.match(safe,/text-align:center/);
  assert.equal(sanitizeContent(safe),safe);
  assert.equal(safeImageUrl('/uploads-imagens-nogueira/%2e%2e/secrets'),false);
  assert.equal(safeImageUrl('/uploads-imagens-nogueira/../secrets'),false);
  assert.match(sectionsToHtml([{heading:'A < B',paragraphs:['<script>text</script>']}]),/&lt;script&gt;/);
  assert.equal(contentTeaser('<p>Início</p><p>CONTEÚDO RESTRITO</p>'),'Início');
});
test('educational upload rejects executables, path traversal, forged MIME and broken formats',async()=>{
  for(const name of ['../a.pdf','a.exe','a.svg','a.html','a.pptm'])assert.throws(()=>validateUploadName(name,''));
  assert.throws(()=>validateUploadName('a.pdf','image/png'));
  await assert.rejects(validateEducationalFile(Buffer.from('MZbad executable'),'a.pdf','application/pdf'));
  await assert.rejects(validateEducationalFile(Buffer.from('%PDF-1.4\ntruncated'),'a.pdf','application/pdf'));
  await assert.rejects(validateEducationalFile(Buffer.from('PK\x03\x04arbitrary zip'),'a.pptx',''));
  await assert.rejects(validateEducationalFile(Buffer.from('not a presentation'),'a.ppt',''));
  for(const format of ['jpeg','png','webp'] as const){const bytes=await sharp({create:{width:40,height:30,channels:3,background:'#14508b'}}).toFormat(format).toBuffer();const result=await validateEducationalFile(bytes,`fixture.${format}`,`image/${format}`);assert.equal(result.type,'IMAGE');assert.equal((await sharp(result.preview).metadata()).format,'png');}
  const compound=CFB.utils.cfb_new();CFB.utils.cfb_add(compound,'Workbook',Buffer.from('wrong application'));
  await assert.rejects(validateEducationalFile(CFB.write(compound,{type:'buffer'}),'wrong.ppt',''));
});
test('watermarks are rasterized and differ by subscriber, including escaped names',async()=>{
  const original=await sharp({create:{width:1200,height:800,channels:3,background:'white'}}).jpeg().toBuffer();
  const first=await watermarkEducationalImage(original,'Aluno A · 123456789abc');
  const second=await watermarkEducationalImage(original,'Aluno B <script> · abcdef123456');
  assert.ok(!first.equals(original));assert.ok(!first.equals(second));
  const {data,info}=await sharp(first).raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,1200);assert.equal(info.height,800);
  assert.ok(data.some(byte=>byte<220),'watermark must change the actual pixels, not only metadata');
});
test('SEO checks missing ALT, keyword stuffing, hierarchy and long paragraphs without ranking promises',()=>{
  const post:EditorialContent={title:'Insuficiência cardíaca: cuidados e prevenção',slug:'insuficiencia-cardiaca',excerpt:'Resumo',category:'Cardiologia',tags:[],content_html:'<h2>Insuficiência cardíaca</h2><p>Insuficiência cardíaca e cuidados.</p>',content_type:'ARTICLE',requires_registration:true,cover_image_url:'/brand/image.png',cover_alt:'',cover_caption:'',primary_keyword:'insuficiência cardíaca',secondary_keywords:[],seo_title:'Insuficiência cardíaca: cuidados e prevenção',seo_description:'',author_profile_slug:null,attachment_ids:[],material_details:{}};
  const result=analyzeSeo(post);assert.ok(result.score>=0&&result.score<=100);
  assert.equal(result.checks.find(c=>c.label==='Palavra-chave no título')?.ok,true);
  assert.equal(result.checks.find(c=>c.label==='Imagens com ALT')?.ok,false);
  const repeated=analyzeSeo({...post,content_html:`<h1>Título duplicado</h1><p>${'insuficiência cardíaca '.repeat(160)}</p>`});
  assert.equal(repeated.checks.find(c=>c.label==='Uso natural do tema')?.ok,false);
  assert.equal(repeated.checks.find(c=>c.label==='Hierarquia de títulos')?.ok,false);
  assert.equal(repeated.checks.find(c=>c.label==='Parágrafos fáceis de acompanhar')?.ok,false);
  assert.ok(result.suggestions.includes('cardíaca'));
});
