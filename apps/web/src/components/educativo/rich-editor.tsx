'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { useState, useRef } from 'react';
import type { Material } from '@/lib/educativo-types';
import { materialUrl } from '@/lib/educativo-types';

const Callout=Node.create({name:'callout',group:'block',content:'block+',parseHTML:()=>[{tag:'div.educativo-callout'}],renderHTML:()=>['div',{class:'educativo-callout'},0]});
const ImageWithCaption=ImageExtension.extend({
  addAttributes(){return {
    ...Object.fromEntries(['src','alt','title'].map(name=>[name,{default:null,parseHTML:(element:HTMLElement)=>(element.tagName==='FIGURE'?element.querySelector('img'):element)?.getAttribute(name)}])),
    caption:{default:'',parseHTML:element=>element.closest('figure')?.querySelector('figcaption')?.textContent||'',renderHTML:()=>({})},
  };},
  parseHTML(){return [{tag:'figure',getAttrs:element=>element.querySelector('img')?null:false},{tag:'img[src]'}];},
  renderHTML({HTMLAttributes,node}){return ['figure',{},['img',mergeAttributes(this.options.HTMLAttributes,HTMLAttributes)],...(node.attrs.caption?[['figcaption',{},node.attrs.caption]]:[])];},
});
export function RichEditor({html,onChange,onUpload,disabled=false}:{html:string;onChange:(html:string)=>void;onUpload:(file:File,purpose:Material['purpose'])=>Promise<Material>;disabled?:boolean}) {
  const uploadRef=useRef<HTMLInputElement>(null);
  const [image,setImage]=useState({alt:'',caption:''}), [showImage,setShowImage]=useState(false), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  const editor=useEditor({extensions:[StarterKit.configure({heading:{levels:[1,2,3]},codeBlock:false,code:false,link:{openOnClick:false}}),ImageWithCaption,TextAlign.configure({types:['heading','paragraph']}),Callout],
    content:html,immediatelyRender:false,shouldRerenderOnTransaction:true,
    editorProps:{attributes:{class:'educativo-prose min-h-80 p-5 outline-none',role:'textbox','aria-label':'Conteúdo do artigo','aria-multiline':'true'}},onUpdate:({editor})=>onChange(editor.getHTML()),
  });
  if(!editor)return <p className="p-5 text-sm text-slate-500">Carregando editor…</p>;
  const button=(label:string,run:()=>void,active=false)=><button type="button" key={label} title={label} aria-label={label} aria-pressed={active} disabled={disabled||busy} onMouseDown={e=>e.preventDefault()} onClick={run} className={`rounded-lg border px-2.5 py-2 text-sm ${active?'border-[#14508B] bg-[#14508B] text-white':'border-slate-200 bg-white text-[#103E6A] hover:bg-blue-50'}`}>{label}</button>;
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="flex flex-wrap gap-1.5 border-b border-slate-200 bg-slate-50 p-3" role="toolbar" aria-label="Formatação do texto">
      {button('Negrito',()=>editor.chain().focus().toggleBold().run(),editor.isActive('bold'))}
      {button('Itálico',()=>editor.chain().focus().toggleItalic().run(),editor.isActive('italic'))}
      {button('Sublinhado',()=>editor.chain().focus().toggleUnderline().run(),editor.isActive('underline'))}
      {button('Tachado',()=>editor.chain().focus().toggleStrike().run(),editor.isActive('strike'))}
      {([1,2,3] as const).map(level=>button(`H${level}`,()=>editor.chain().focus().toggleHeading({level}).run(),editor.isActive('heading',{level})))}
      {button('Parágrafo',()=>editor.chain().focus().setParagraph().run())}
      {button('Lista',()=>editor.chain().focus().toggleBulletList().run(),editor.isActive('bulletList'))}
      {button('Lista numerada',()=>editor.chain().focus().toggleOrderedList().run(),editor.isActive('orderedList'))}
      {button('Citação',()=>editor.chain().focus().toggleBlockquote().run(),editor.isActive('blockquote'))}
      {button('Destaque',()=>editor.chain().focus().toggleWrap('callout').run(),editor.isActive('callout'))}
      {button('Separador',()=>editor.chain().focus().setHorizontalRule().run())}
      {button('Link',()=>{const href=window.prompt('Endereço do link (https:// ou /blog/…) ',editor.getAttributes('link').href||'');if(href===null)return;if(!href){editor.chain().focus().unsetLink().run();return;}if(!/^(https?:\/\/|mailto:|tel:|\/(?!\/))/.test(href)){setError('Use um link https://, e-mail, telefone ou caminho interno.');return;}editor.chain().focus().extendMarkRange('link').setLink({href}).run();})}
      {(['left','center','right','justify'] as const).map((a,i)=>button(['À esquerda','Centralizar','À direita','Justificar'][i],()=>editor.chain().focus().setTextAlign(a).run(),editor.isActive({textAlign:a})))}
      {button('Emoji 💙',()=>editor.chain().focus().insertContent('💙').run())}
      {button('Imagem',()=>{setImage({alt:editor.getAttributes('image').alt||'',caption:editor.getAttributes('image').caption||''});setShowImage(!showImage);})}
      {button('Materiais da aula',()=>document.getElementById('materiais-editor')?.scrollIntoView({behavior:'smooth'}))}
      {button('Desfazer',()=>editor.chain().focus().undo().run())}{button('Refazer',()=>editor.chain().focus().redo().run())}
    </div>
    {showImage&&<div className="grid gap-3 border-b border-blue-100 bg-blue-50 p-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">ALT da imagem<input value={image.alt} onChange={e=>setImage({...image,alt:e.target.value})} className="edu-input" maxLength={300}/></label>
      <label className="grid gap-1 text-sm">Legenda da imagem<input value={image.caption} onChange={e=>setImage({...image,caption:e.target.value})} className="edu-input" maxLength={500}/></label>
      <input ref={uploadRef} type="file" accept=".jpg,.jpeg,.png,.webp" aria-label="Arquivo da imagem no texto" className="text-sm" disabled={busy} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);setError('');try{const m=await onUpload(file,'INLINE');editor.chain().focus().insertContent({type:'image',attrs:{src:materialUrl(m.id),alt:image.alt,caption:image.caption}}).run();setShowImage(false);}catch(error){setError(error instanceof Error?error.message:'Falha ao enviar imagem.');}finally{setBusy(false);e.target.value='';}}}/>
      {editor.isActive('image')&&<button className="edu-secondary" onClick={()=>{editor.chain().focus().updateAttributes('image',image).run();setShowImage(false);}}>Atualizar ALT e legenda</button>}
    </div>}
    {error&&<p role="alert" className="p-3 text-sm text-red-700">{error}</p>}
    <EditorContent editor={editor}/>
    <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Selecione o texto para formatar. Para editar ALT e legenda, selecione a imagem e clique em Imagem.</p>
  </div>;
}
