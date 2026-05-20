const express = require('express');
const app = express();
app.use(express.json());

const TOKEN = process.env.TINY_TOKEN || '3a966654cbe9444cad10260c7a7902ae3c7eddbbd0c0d70a7e0d418b74debf49';
const BASE = 'https://api.tiny.com.br/api2';
const PORT = process.env.PORT || 3033;

async function tiny(endpoint, params, method) {
  const fetch = (await import('node-fetch')).default;
  const base = { token: TOKEN, formato: 'json' };
  const all = Object.assign({}, base, params || {});
  if (method === 'POST') {
    const body = new URLSearchParams(all);
    const r = await fetch(BASE + '/' + endpoint, {
      method: 'POST', body,
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

app.post('/mcp', async (req, res) => {
  const { method, params } = req.body;

  if (method === 'tools/list') {
    return res.json({
      tools: [
        { name: 'pedidos_hoje', description: 'Busca todos os pedidos de hoje no Tiny ERP', inputSchema: { type: 'object', properties: {} } },
        { name: 'pedidos_semana', description: 'Busca pedidos da ultima semana', inputSchema: { type: 'object', properties: {} } },
        { name: 'buscar_produtos', description: 'Busca produtos no estoque do Tiny', inputSchema: { type: 'object', properties: { pesquisa: { type: 'string', description: 'Nome ou codigo do produto' } } } },
        { name: 'entrada_estoque', description: 'Da entrada de estoque no Tiny ERP', inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'ID do produto no Tiny' }, qtd: { type: 'string', description: 'Quantidade a adicionar' }, custo: { type: 'string', description: 'Custo unitario' } }, required: ['id', 'qtd', 'custo'] } },
        { name: 'saida_estoque', description: 'Da saida de estoque no Tiny ERP', inputSchema: { type: 'object', properties: { id: { type: 'string' }, qtd: { type: 'string' } }, required: ['id', 'qtd'] } },
        { name: 'contas_receber', description: 'Lista contas a receber dos ultimos 30 dias', inputSchema: { type: 'object', properties: {} } },
        { name: 'contas_pagar', description: 'Lista contas a pagar dos ultimos 30 dias', inputSchema: { type: 'object', properties: {} } },
        { name: 'notas_fiscais', description: 'Lista notas fiscais dos ultimos 30 dias', inputSchema: { type: 'object', properties: {} } },
        { name: 'buscar_clientes', description: 'Busca clientes no Tiny', inputSchema: { type: 'object', properties: { pesquisa: { type: 'string' } } } },
        { name: 'vendas_periodo', description: 'Busca vendas em um periodo', inputSchema: { type: 'object', properties: { data_ini: { type: 'string', description: 'dd/mm/aaaa' }, data_fim: { type: 'string', description: 'dd/mm/aaaa' } }, required: ['data_ini', 'data_fim'] } }
      ]
    });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    let result;
    try {
      if (name === 'pedidos_hoje') {
        result = await tiny('pedidos.pesquisa.php', { dataInicial: hoje(), dataFinal: hoje() });
      } else if (name === 'pedidos_semana') {
        result = await tiny('pedidos.pesquisa.php', { dataInicial: diasAtras(7), dataFinal: hoje() });
      } else if (name === 'buscar_produtos') {
        result = await tiny('produtos.pesquisa.php', { pesquisa: args.pesquisa || '' });
      } else if (name === 'entrada_estoque') {
        result = await tiny('produto.alterar.estoque.php', { id: args.id, quantidade: args.qtd, preco: args.custo, tipo: 'E' }, 'POST');
      } else if (name === 'saida_estoque') {
        result = await tiny('produto.alterar.estoque.php', { id: args.id, quantidade: args.qtd, tipo: 'S' }, 'POST');
      } else if (name === 'contas_receber') {
        result = await tiny('contas.receber.pesquisa.php', { dataInicial: diasAtras(30), dataFinal: hoje() });
      } else if (name === 'contas_pagar') {
        result = await tiny('contas.pagar.pesquisa.php', { dataInicial: diasAtras(30), dataFinal: hoje() });
      } else if (name === 'notas_fiscais') {
        result = await tiny('notas.fiscais.pesquisa.php', { dataInicial: diasAtras(30), dataFinal: hoje() });
      } else if (name === 'buscar_clientes') {
        result = await tiny('contatos.pesquisa.php', { pesquisa: args.pesquisa || '' });
      } else if (name === 'vendas_periodo') {
        result = await tiny('pedidos.pesquisa.php', { dataInicial: args.data_ini, dataFinal: args.data_fim });
      } else {
        result = { erro: 'Tool nao encontrada' };
      }
    } catch (e) {
      result = { erro: e.message };
    }
    return res.json({
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    });
  }

  res.json({ error: 'Method not found' });
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'NATI Tiny MCP' }));

app.listen(PORT, () => console.log('NATI Tiny MCP rodando na porta ' + PORT));