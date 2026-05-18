const express = require('express');
const axios   = require('axios');
const app     = express();

// Libera CORS para qualquer origem (necessário para o painel HTML chamar daqui)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, company-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

/**
 * GET /nps
 * Parâmetros opcionais:
 *   ?startDate=01-01-2026&endDate=31-03-2026&limit=1000&page=1&action=all
 *
 * Headers obrigatórios:
 *   company-key: sua chave da Indecx
 */
app.get('/nps', async (req, res) => {
  const companyKey = req.headers['company-key'];

  if (!companyKey) {
    return res.status(401).json({ error: 'Header company-key obrigatório.' });
  }

  const {
    action     = 'all',
    startDate  = '',
    endDate    = '',
    limit      = 1000,
    page       = 1,
    dateType   = 'createdAt',
  } = req.query;

  // Monta URL da Indecx
  const params = new URLSearchParams({ limit, page, dateType });
  if (startDate) params.append('startDate', startDate);
  if (endDate)   params.append('endDate',   endDate);

  const url = `https://indecx.com/v2/answers-info/${action}?${params.toString()}`;

  try {
    const response = await axios.get(url, {
      headers: { 'company-key': companyKey },
      timeout: 30000,
    });

    // Normaliza os dados para o formato que o painel espera
    const raw = response.data?.answers || response.data || [];

    const dados = raw.map(r => ({
      nome:        r.name        || r.clientName  || '',
      empresa:     r.company     || r.companyName || '',
      email:       r.email       || '',
      nota:        r.review      ?? r.score       ?? 0,
      feedback:    r.comment     || r.feedback    || '',
      consultor:   r.indicators?.find(i => i.column === 'consultor')?.value || '',
      responsavel: r.indicators?.find(i => i.column === 'responsavel')?.value || '',
      categorias:  r.categories  || [],
      data:        r.answerDate  || r.createdAt   || '',
      tipo:        calcTipo(r.review ?? r.score ?? 0),
      email_body:  '',
    })).filter(d => d.nome && d.nota >= 7);  // só promotores e neutros

    res.json({
      total:      dados.length,
      promotores: dados.filter(d => d.tipo === 'Promotor').length,
      neutros:    dados.filter(d => d.tipo === 'Neutro').length,
      dados,
    });

  } catch (err) {
    const status  = err.response?.status  || 500;
    const message = err.response?.data    || err.message;
    res.status(status).json({ error: message });
  }
});

function calcTipo(nota) {
  if (nota >= 9) return 'Promotor';
  if (nota >= 7) return 'Neutro';
  return 'Detrator';
}

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', service: 'Indecx Proxy — Copastur NPS' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy rodando na porta ${PORT}`));
