const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rota /nps — chamada pelo painel para buscar respostas
app.get('/nps', async (req, res) => {
  const { startDate, endDate, limit, page } = req.query;
  const companyKey = req.headers['company-key'];

  if (!companyKey) return res.status(400).json({ error: 'company-key header ausente' });

  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate)   params.append('endDate', endDate);
  if (limit)     params.append('limit', limit);
  if (page)      params.append('page', page);

  try {
    const response = await fetch(
      `https://indecx.com/v3/integrations/get-answers/all?${params}`,
      {
        headers: {
          'company-integration-key': companyKey,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = await response.text();
    try {
      res.status(response.status).json(JSON.parse(text));
    } catch {
      res.status(500).json({ error: 'Indecx retornou resposta invalida', preview: text.substring(0, 300) });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro no proxy', details: err.message });
  }
});

// Rota /actions — chamada pelo botão "Ver ações"
app.get('/actions', async (req, res) => {
  const companyKey = req.headers['company-key'];
  if (!companyKey) return res.status(400).json({ error: 'company-key header ausente' });

  try {
    const response = await fetch('https://indecx.com/v3/integrations/actions', {
      headers: {
        'company-integration-key': companyKey,
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    try {
      res.status(response.status).json(JSON.parse(text));
    } catch {
      res.status(500).json({ error: 'Indecx retornou resposta invalida', preview: text.substring(0, 300) });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro no proxy', details: err.message });
  }
});

app.listen(PORT, () => console.log(`Proxy rodando na porta ${PORT}`));
