/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const dns = require('dns').promises;

const configPath = '/etc/easypanel/traefik/config/main.yaml';
const targetServiceUrl = 'http://172.16.1.1:3002';
const bt = String.fromCharCode(96);
const rule = `Host(${bt}www.nogueiracardiologia.com.br${bt}) || Host(${bt}nogueiracardiologia.com.br${bt})`;

async function main() {
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const panelHost = 'painel.nogueiracardiologia.com.br';
  const marker = '/etc/easypanel/traefik/nogueira-panel-tls-ready';
  let tlsReady = fs.existsSync(marker);
  if (!tlsReady) {
    try {
      // Passive DNS verification only: no DNS writes or certificate requests before propagation.
      const addresses = await dns.resolve4(panelHost);
      if (addresses.includes('2.24.215.163')) {
        fs.writeFileSync(marker, new Date().toISOString(), {mode:0o600});
        tlsReady = true;
      }
    } catch { /* DNS is intentionally pending; local Host routing is still configured. */ }
  }
  const panelRule = `Host(${bt}${panelHost}${bt})`;
  const panelHttp = {rule:panelRule,entryPoints:['http'],middlewares:['redirect-to-https'],service:'nogueira-web'};
  const panelHttps = {rule:panelRule,entryPoints:['https'],service:'nogueira-web',tls:tlsReady?{certResolver:'letsencrypt'}:{}};

  cfg.http = cfg.http || {};
  cfg.http.routers = cfg.http.routers || {};
  cfg.http.services = cfg.http.services || {};

  const expectedHttpRouter = {
    rule,
    entryPoints: ['http'],
    middlewares: ['redirect-to-https'],
    service: 'nogueira-web',
  };
  const expectedHttpsRouter = {
    rule,
    entryPoints: ['https'],
    service: 'nogueira-web',
    tls: { certResolver: 'letsencrypt' },
  };
  const expectedService = {
    loadBalancer: {
      servers: [{ url: targetServiceUrl }],
      passHostHeader: true,
    },
  };

  const before = JSON.stringify({
    http: cfg.http.routers['http-nogueira-web'],
    https: cfg.http.routers['https-nogueira-web'],
    service: cfg.http.services['nogueira-web'],
    panelHttp:cfg.http.routers['http-nogueira-panel'],
    panelHttps:cfg.http.routers['https-nogueira-panel'],
  });

  cfg.http.routers['http-nogueira-web'] = expectedHttpRouter;
  cfg.http.routers['https-nogueira-web'] = expectedHttpsRouter;
  cfg.http.services['nogueira-web'] = expectedService;
  cfg.http.routers['http-nogueira-panel'] = panelHttp;
  cfg.http.routers['https-nogueira-panel'] = panelHttps;

  const after = JSON.stringify({
    http: cfg.http.routers['http-nogueira-web'],
    https: cfg.http.routers['https-nogueira-web'],
    service: cfg.http.services['nogueira-web'],
    panelHttp:cfg.http.routers['http-nogueira-panel'],
    panelHttps:cfg.http.routers['https-nogueira-panel'],
  });

  if (before !== after) {
    const temporary = '/etc/easypanel/traefik/nogueira-route.tmp';
    fs.writeFileSync(temporary, JSON.stringify(cfg, null, 2));
    fs.renameSync(temporary,configPath);
    console.log(`[${new Date().toISOString()}] restored nogueira-web Traefik route`);
  }
}

main().catch(() => { console.error('nogueira_proxy_configuration_failed'); process.exitCode=1; });
