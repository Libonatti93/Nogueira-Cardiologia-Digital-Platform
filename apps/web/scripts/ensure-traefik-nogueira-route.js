/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

const configPath = '/etc/easypanel/traefik/config/main.yaml';
const targetServiceUrl = 'http://172.16.1.1:3002';
const bt = String.fromCharCode(96);
const rule = `Host(${bt}www.nogueiracardiologia.com.br${bt}) || Host(${bt}nogueiracardiologia.com.br${bt})`;

function main() {
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));

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
  });

  cfg.http.routers['http-nogueira-web'] = expectedHttpRouter;
  cfg.http.routers['https-nogueira-web'] = expectedHttpsRouter;
  cfg.http.services['nogueira-web'] = expectedService;

  const after = JSON.stringify({
    http: cfg.http.routers['http-nogueira-web'],
    https: cfg.http.routers['https-nogueira-web'],
    service: cfg.http.services['nogueira-web'],
  });

  if (before !== after) {
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
    console.log(`[${new Date().toISOString()}] restored nogueira-web Traefik route`);
  }
}

main();
