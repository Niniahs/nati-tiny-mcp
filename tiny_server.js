const express = require('express');
const app = express();
app.use(express.json());

const TOKEN = "3a966654cbe9444cad10260c7a7902ae3c7eddbbd0c0d70a7e0d418b74debf49";
const BASE = "https://api.tiny.com.br/api2";

async function tiny(endpoint, params, method) {
  const fetch = (await import('node-fetch')).default;
  const base = { token: TOKEN, formato: 'json' };
  const all = Object.assign({}, base, params || {});
  if (method === 'POST') {
    const body = new URLSearchParams(all);
    const r = await fetch(BASE + '/' + endpoint, {
      method: 'POST',
      body: body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return r.json();
  }
  const url = new URL(BASE + '/' + endpoint);
  Object.keys(all).forEach(k => url.searchParams.set(k, all[k]));
  const r = await fetch(url.toString());
  return r.json();
}

function hoje() {
  return new Date().toLocaleDateString('pt-BR');
}

function diasAtras(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('pt-BR');
}

app.get('/pedidos/hoje', async (req, res) => {
  try {
    const r = await tiny('pedidos.pesquisa.php', { dataInicial: hoje(), dataFinal: hoje() });
    res.json(r);
  } catch(e) { res.json({ erro: e.message }); }
});

app.get('/pedidos', async (req, res) => {
  try {
    const r = await tiny('pedidos.pesquisa.php', { dataInicial: diasAtras(7), dataFinal: hoje() });
    res.json(r);
  } catch(e) { res.json({ erro: e.message }); }
});

app.get('/produtos', async (req, res) => {
  try {
    const r = await tiny('produtos.pesquisa.php', { pesquisa: req.query.q || '' });
    res.json(r);
  } catch(e) { res.json({ erro: e.message }); }
});

app.get('/estoque/:id', async (req, res) => {
  try {
    const r = await tiny('produto.obter.estoque.php', { id: req.params.id });
    res.json(r);
  } catch(e) { res.json({ erro: e.message }); }
});

app.post('/entrada', async (req, res) => {
  try {
    const r = await tiny('produto.alterar.estoque.php', {
      id: req.body.id,
      quantidade: req.body.qtd,
      preco: req.body.custo,
      tipo: 'E'
    }, 'POST');
    res.json(r);
  } catch(e) { res.json({ erro: e.message }); }
});

app.get('/notas', async (req, res) => {
  try {
    const r = await tiny('notas.fiscais.pesquisa.php', { dataInicial: diasAtras(30), dataFinal: hoje() });
    res.json(r);
  } catch(e) { res.json({ erro: e.message }); }
});

app.get('/receber', async (req, res) => {
  try {
    const r = await tiny('contas.receber.pesquisa.php', { dataInicial: diasAtras(30), dataFinal: hoje() });
    res.json(r);
  } catch(e) { res.json({ erro: e.message }); }
});

app.get('/pagar', async (req, res) => {
  try {
    const r = await tiny('contas.pagar.pesquisa.php', { dataInicial: diasAtras(30), dataFinal: hoje() });
    res.json(r);
  } catch(e) { res.json({ erro: e.message }); }
});

app.listen(3033, function() {
  console.log('Tiny MCP Server rodando na porta 3033');
});