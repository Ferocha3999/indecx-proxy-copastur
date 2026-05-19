const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/nps', async (req, res) => {
  const { startDate, endDate, limit, page } = req.query;
  const companyKey = req.headers['company-key'];

  if (!companyKey) return res.status(400).json({ error: 'company-key header ausente' });

  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate)   params.append('endDate', endDate);
  params.append('limit', limit || '1000');
  if (page)      params.append('page', page);

  // Tenta v3 primeiro, depois v2 se falhar
  const urls = [
    `https://indecx.com/v3/integrations/get-answers/all?${params}`,
    `https://indecx.com/v2/answers-info/all?${params}`
  ];

  for (const url of urls) {
    try {
      console.log('Tentando URL:', url);
      const response = await fetch(url, {
        headers: {
          'company-integration-key': companyKey,
          'company-key': companyKey,
          'Content-Type': 'application/json'
        }
      });

      const text = await response.text();
      console.log('Status:', response.status, '| Preview:', text.substring(0, 300));

      if (response.status === 404 || response.status === 401) {
        // tenta proxima URL
        continue;
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.log('Resposta nao e JSON, tentando proxima URL...');
        continue;
      }

      // Normaliza o formato da resposta para o painel
      const dados = json.answers || json.invites || json.data || json.dados || json || [];
      return res.json({ dados: Array.isArray(dados) ? dados : [], total: json.total || dados.length });

    } catch (err) {
      console.log('Erro na URL', url, ':', err.message);
      continue;
    }
  }

  return res.status(500).json({ error: 'Nao foi possivel conectar com a Indecx. Verifique a company key.' });
});

app.get('/actions', async (req, res) => {
  const companyKey = req.headers['company-key'];
  if (!companyKey) return res.status(400).json({ error: 'company-key header ausente' });

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
      try {
        return res.status(response.status).json(JSON.parse(text));
      } catch { continue; }
    } catch (err) { continue; }
  }

  return res.status(500).json({ error: 'Nao foi possivel buscar as acoes.' });
});

app.listen(PORT, () => console.log(`Proxy rodando na porta ${PORT}`));
