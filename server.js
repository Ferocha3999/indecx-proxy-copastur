const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Busca TODAS as respostas sem filtro de data
app.get('/nps', async (req, res) => {
  const companyKey = req.headers['company-key'];
  if (!companyKey) return res.status(400).json({ error: 'company-key ausente' });

  const { limit, page } = req.query;
  const params = new URLSearchParams();
  params.append('limit', limit || '10000');
  if (page) params.append('page', page);

  const urls = [
    `https://indecx.com/v3/integrations/get-answers/all?${params}`,
    `https://indecx.com/v2/answers-info/all?${params}`
  ];

  for (const url of urls) {
    try {
      console.log('GET', url);
      const response = await fetch(url, {
        headers: {
          'company-integration-key': companyKey,
          'company-key': companyKey,
          'Content-Type': 'application/json'
        }
      });
      const text = await response.text();
      console.log('Status:', response.status, '| Preview:', text.substring(0, 300));
      if (response.status === 404 || response.status === 401) continue;
      let json;
      try { json = JSON.parse(text); } catch { continue; }
      const dados = json.answers || json.invites || json.data || json.dados || [];
      return res.json({
        dados: Array.isArray(dados) ? dados : [],
        total: json.total || dados.length
      });
    } catch (err) {
      console.log('Erro:', err.message);
      continue;
    }
  }

  return res.status(500).json({ error: 'Nao foi possivel conectar com a Indecx.' });
});

// Busca lista de campanhas/ações
app.get('/actions', async (req, res) => {
  const companyKey = req.headers['company-key'];
  if (!companyKey) return res.status(400).json({ error: 'company-key ausente' });

  const urls = [
    'https://indecx.com/v3/integrations/actions',
    'https://indecx.com/v2/actions'
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'company-integration-key': companyKey,
          'company-key': companyKey,
          'Content-Type': 'application/json'
        }
      });
      const text = await response.text();
      console.log('Actions status:', response.status, '| Preview:', text.substring(0, 200));
      if (response.status === 404) continue;
      try { return res.status(response.status).json(JSON.parse(text)); } catch { continue; }
    } catch (err) { continue; }
  }

  return res.status(500).json({ error: 'Nao foi possivel buscar as acoes.' });
});

app.listen(PORT, () => console.log(`Proxy rodando na porta ${PORT}`));
