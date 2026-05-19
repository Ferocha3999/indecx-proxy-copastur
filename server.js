const express = require('express');
const axios   = require('axios');
const app     = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, company-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', service: 'Indecx Proxy v3 — Copastur NPS' }));

// Lista ações ativas — útil para descobrir o identifier correto
app.get('/actions', async (req, res) => {
  const key = req.headers['company-key'];
  if (!key) return res.status(401).json({ error: 'Header company-key obrigatório.' });
  try {
    const r = await axios.get('https://indecx.com/v3/integrations/actions', {
      headers: { 'company-key': key },
      timeout: 30000
    });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});

// Busca respostas — endpoint principal do painel
app.get('/nps', async (req, res) => {
  const key = req.headers['company-key'];
  if (!key) return res.status(401).json({ error: 'Header company-key obrigatório.' });

  const {
    action    = 'all',   // identifier da ação ou 'all'
    startDate = '',      // YYYY-MM-DD
    endDate   = '',      // YYYY-MM-DD
    limit     = 100,     // máx 100 por página conforme doc v3
    page      = 1,
  } = req.query;

  const params = new URLSearchParams({ page, limit });
  if (startDate) params.append('startDate', startDate);
  if (endDate)   params.append('endDate',   endDate);

  // v3 endpoint: /v3/integrations/get-answers/[ID_acao]
  const url = `https://indecx.com/v3/integrations/get-answers/${action}?${params}`;

  try {
    const r = await axios.get(url, {
      headers: { 'company-key': key },
      timeout: 30000
    });

    const raw    = r.data?.answers || r.data || [];
    const total  = r.data?.totalCount || raw.length;
    const pagina = r.data?.page || 1;

    // Normaliza campos para o painel
    const dados = raw.map(d => ({
      nome:        d.nome        || d.name        || d.clientName  || '',
      empresa:     d.empresa     || d.company     || d.companyName || '',
      email:       d.email       || '',
      nota:        Number(d.review ?? d.score ?? 0),
      feedback:    d.comment     || d.feedback    || '',
      consultor:   (d.indicators || []).find(i => /consultor/i.test(i.column))?.value || '',
      responsavel: (d.indicators || []).find(i => /responsavel|responsável/i.test(i.column))?.value || '',
      categorias:  d.categories  || [],
      data:        d.createdAt   || d.answerDate  || '',
      tipo:        calcTipo(Number(d.review ?? d.score ?? 0)),
      email_body:  '',
    })).filter(d => d.nome && d.nota >= 7);

    res.json({
      total:      dados.length,
      totalCount: total,
      page:       pagina,
      promotores: dados.filter(d => d.tipo === 'Promotor').length,
      neutros:    dados.filter(d => d.tipo === 'Neutro').length,
      dados,
    });

  } catch (err) {
    const status = err.response?.status || 500;
    const msg    = err.response?.data   || err.message;
    console.error('Erro Indecx:', status, msg);
    res.status(status).json({ error: msg });
  }
});

function calcTipo(nota) {
  if (nota >= 9) return 'Promotor';
  if (nota >= 7) return 'Neutro';
  return 'Detrator';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy v3 rodando na porta ${PORT}`));
