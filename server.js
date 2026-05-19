const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const COMPANY_KEY = '$2b$10$wTF2lte07JfAAN90W/TksuP8/8Fw7eCRrC.LrHWetMmZXnlhA5B5u';
const INDECX_URLS = [
  'https://indecx.com/v3/integrations/get-answers/all',
  'https://indecx.com/v2/answers-info/all'
];
const HEADERS = {
  'company-integration-key': COMPANY_KEY,
  'company-key': COMPANY_KEY,
  'Content-Type': 'application/json'
};

app.get('/nps', async (req, res) => {
  for (const baseUrl of INDECX_URLS) {
    try {
      const firstRes = await fetch(baseUrl + '?limit=1000&page=1', { headers: HEADERS });
      const firstText = await firstRes.text();
      console.log('Status:', firstRes.status, '| Preview:', firstText.substring(0, 200));
      if (firstRes.status === 404 || firstRes.status === 401) continue;
      let firstJson;
      try { firstJson = JSON.parse(firstText); } catch { continue; }
      const total = firstJson.total || 0;
      let dados = firstJson.answers || firstJson.invites || firstJson.data || firstJson.dados || [];
      if (!Array.isArray(dados)) dados = [];
      console.log('Total:', total, '| Pag 1:', dados.length);
      const totalPags = Math.ceil(total / 1000);
      if (totalPags > 1) {
        const promises = [];
        for (let p = 2; p <= Math.min(totalPags, 50); p++) {
          promises.push(
            fetch(baseUrl + '?limit=1000&page=' + p, { headers: HEADERS })
              .then(r => r.json())
              .then(j => j.answers || j.invites || j.data || j.dados || [])
              .catch(() => [])
          );
        }
        const pages = await Promise.all(promises);
        pages.forEach(p => { dados = dados.concat(p); });
      }
      console.log('Total carregado:', dados.length);
      return res.json({ dados, total: dados.length });
    } catch (err) {
      console.log('Erro:', err.message);
      continue;
    }
  }
  return res.status(500).json({ error: 'Não foi possível conectar com a Indecx.' });
});

app.get('/actions', async (req, res) => {
  const urls = ['https://indecx.com/v3/integrations/actions', 'https://indecx.com/v2/actions'];
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: HEADERS });
      const text = await r.text();
      if (r.status === 404) continue;
      try { return res.status(r.status).json(JSON.parse(text)); } catch { continue; }
    } catch { continue; }
  }
  return res.status(500).json({ error: 'Não foi possível buscar as ações.' });
});

app.listen(PORT, () => console.log(`Proxy rodando na porta ${PORT}`));
