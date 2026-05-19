const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rota principal do proxy — repassa para a API da Indecx
app.get('/v3/integrations/get-answers/:identifier', async (req, res) => {
  const { identifier } = req.params;
  const { startDate, endDate, page, limit } = req.query;

  const companyKey = req.headers['company-integration-key'];
  if (!companyKey) {
    return res.status(400).json({ error: 'company-integration-key header ausente' });
  }

  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate)   params.append('endDate', endDate);
  if (page)      params.append('page', page);
  if (limit)     params.append('limit', limit);

  const url = `https://indecx.com/v3/integrations/get-answers/${identifier}?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        'company-integration-key': companyKey,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Erro ao chamar Indecx:', err);
    res.status(500).json({ error: 'Erro interno no proxy', details: err.message });
  }
});

// Rota para listar ações disponíveis
app.get('/v3/integrations/actions', async (req, res) => {
  const companyKey = req.headers['company-integration-key'];
  if (!companyKey) {
    return res.status(400).json({ error: 'company-integration-key header ausente' });
  }

  try {
    const response = await fetch('https://indecx.com/v3/integrations/actions', {
      headers: {
        'company-integration-key': companyKey,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no proxy', details: err.message });
  }
});

app.listen(PORT, () => console.log(`Proxy rodando na porta ${PORT}`));
