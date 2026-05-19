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
    
    // LOG TEMPORARIO — ver nos logs do Render
    console.log('STATUS INDECX:', response.status);
    console.log('RESPOSTA INDECX:', text.substring(0, 500));

    try {
      res.status(response.status).json(JSON.parse(text));
    } catch {
      res.status(500).json({ 
        error: 'Indecx retornou resposta invalida', 
        status: response.status,
        preview: text.substring(0, 500)  // <-- agora mostra o que veio
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro no proxy', details: err.message });
  }
});
