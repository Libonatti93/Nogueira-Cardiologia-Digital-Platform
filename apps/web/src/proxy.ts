import { NextResponse, type NextRequest } from 'next/server';
import { panelHost } from '@/lib/panel-policy';

// Routing only. Every page/API performs its own database-backed authorization.
export function proxy(request:NextRequest) {
  const host=request.headers.get('host')?.split(':')[0]?.toLowerCase();
  const path=request.nextUrl.pathname;
  if(host!==panelHost)return NextResponse.next();
  let response;
  if(path==='/') {
    const target=request.nextUrl.clone();target.pathname='/acesso';response=NextResponse.rewrite(target);
  } else if(path.startsWith('/portal')||path.startsWith('/blog')||path==='/privacidade'||path==='/exames') {
    response=NextResponse.redirect(new URL(path+request.nextUrl.search,'https://www.nogueiracardiologia.com.br'));
  } else { response=NextResponse.next(); }
  response.headers.set('X-Robots-Tag','noindex, nofollow');
  response.headers.set('Cache-Control','private, no-store');
  return response;
}
export const config={matcher:['/','/acesso/:path*','/dashboard/:path*','/crm/:path*','/governanca/:path*','/auditoria/:path*','/lios/:path*','/configuracoes/:path*','/alterar-senha','/sem-acesso','/portal/:path*','/blog/:path*','/privacidade','/exames']};
