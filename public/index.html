const express = require('express');
const axios   = require('axios');
const path    = require('path');
const app     = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, company-key, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use(express.json());

// Serve arquivos estáticos da pasta public/
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', version: 4 }));

// Lista ações ativas
app.get('/actions', async (req, res) => {
  const key = req.headers['company-key'];
  if (!key) return res.status(401).json({ error: 'Header company-key obrigatorio.' });
  try {
    const r = await axios.get('https://indecx.com/v3/integrations/actions', {
      headers: { 'company-key': key }, timeout: 30000
    });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});

// Busca respostas
app.get('/nps', async (req, res) => {
  const key = req.headers['company-key'];
  if (!key) return res.status(401).json({ error: 'Header company-key obrigatorio.' });

  const { action = 'all', startDate = '', endDate = '', limit = 100, page = 1 } = req.query;
  const params = new URLSearchParams({ page, limit });
  if (startDate) params.append('startDate', startDate);
  if (endDate)   params.append('endDate',   endDate);

  const url = `https://indecx.com/v3/integrations/get-answers/${action}?${params}`;

  try {
    const r = await axios.get(url, { headers: { 'company-key': key }, timeout: 30000 });
    const raw = r.data?.answers || r.data || [];

    const dados = raw.map(d => ({
      nome:        d.nome     || d.name     || d.clientName  || '',
      empresa:     d.empresa  || d.company  || d.companyName || '',
      email:       d.email    || '',
      nota:        Number(d.review ?? d.score ?? 0),
      feedback:    d.comment  || d.feedback || '',
      consultor:   (d.indicators||[]).find(i=>/consultor/i.test(i.column))?.value   || '',
      responsavel: (d.indicators||[]).find(i=>/responsavel/i.test(i.column))?.value || '',
      categorias:  d.categories || [],
      data:        d.createdAt  || d.answerDate || '',
      tipo:        calcTipo(Number(d.review ?? d.score ?? 0)),
      email_body:  '',
    })).filter(d => d.nome && d.nota >= 7);

    res.json({
      total:      dados.length,
      totalCount: r.data?.totalCount || raw.length,
      page:       r.data?.page || 1,
      promotores: dados.filter(d => d.tipo === 'Promotor').length,
      neutros:    dados.filter(d => d.tipo === 'Neutro').length,
      dados,
    });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});

function calcTipo(nota) {
  if (nota >= 9) return 'Promotor';
  if (nota >= 7) return 'Neutro';
  return 'Detrator';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy v4 rodando na porta ${PORT}`));
