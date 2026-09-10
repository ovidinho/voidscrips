# VoidScripts — Backend

Backend em Node.js + Express + SQLite para o catálogo de scripts. Serve também os arquivos do site (`public/index.html` e `public/admin.html`), então rodando esse servidor você já tem tudo no ar.

## Estrutura

```
voidscripts-backend/
├── server.js           # servidor Express, serve API + arquivos estáticos
├── db.js               # conexão e schema do SQLite (arquivo criado em data/)
├── routes/scripts.js    # rotas da API (públicas e de admin)
├── middleware/auth.js   # checa o token de admin
├── public/
│   ├── index.html       # site público
│   └── admin.html       # painel de administração
├── data/                # onde o arquivo .db é criado (não precisa mexer)
└── .env.example          # modelo de configuração
```

## Rodando localmente

```bash
npm install
cp .env.example .env
```

Abra o `.env` e troque `ADMIN_TOKEN` por um valor longo e aleatório (pode gerar um com `openssl rand -hex 24`).

```bash
npm start
```

O site abre em `http://localhost:3000`. O painel fica em `http://localhost:3000/admin.html` — na primeira ação de escrita ele vai pedir o `ADMIN_TOKEN` que você colocou no `.env`.

## Como a autenticação funciona

- **Leitura pública** (`GET /api/public/scripts`): sem autenticação, é o que o site mostra para qualquer visitante. Scripts marcados como "quebrado" não aparecem aqui.
- **Rotas de admin** (`GET/POST/PUT/DELETE /api/scripts...`): exigem o header `Authorization: Bearer SEU_TOKEN`. O painel guarda o token na sessão do navegador (`sessionStorage`) depois que você cola ele uma vez.
- Isso é uma autenticação simples, boa para um projeto pessoal com um único administrador. Se mais pessoas forem gerenciar o site, ou se quiser algo mais robusto, o próximo passo seria trocar por login com usuário/senha (ex: com JWT) — posso montar isso se precisar.

## Publicando em um servidor

Qualquer serviço que rode Node.js funciona. Passos gerais:

1. Suba este projeto inteiro (exceto `node_modules`, `.env` e `data/*.db`, que já estão no `.gitignore`) para o serviço escolhido — Render, Railway, Fly.io, um VPS, etc.
2. Configure as variáveis de ambiente no painel do serviço (as mesmas do `.env.example`): `PORT` (geralmente definida automaticamente pelo serviço), `ADMIN_TOKEN`, `ALLOWED_ORIGINS`.
3. Comando de build: `npm install`. Comando de start: `npm start`.
4. **Importante — persistência do banco:** o SQLite grava um arquivo em `data/voidscripts.db`. Em serviços com sistema de arquivos temporário (a maioria dos free tiers), esse arquivo pode ser apagado a cada novo deploy. Procure a opção de "disco persistente" / "volume" do serviço e aponte para a pasta `data/`. Sem isso, seus scripts cadastrados somem quando o servidor reiniciar.
5. Depois de publicado, acesse `https://seu-dominio.com/admin.html` para gerenciar os scripts, e `https://seu-dominio.com` é o site público.

Se preferir hospedar o front-end (`public/`) separado do backend (ex: front num Vercel/Netlify e API em outro lugar), edite a constante `API_BASE` no topo do `<script>` de `index.html` e `admin.html` para a URL completa da API, e ajuste `ALLOWED_ORIGINS` no `.env` para o domínio do front-end.

## Endpoints da API

| Método | Rota                     | Autenticação | Descrição                                  |
|--------|--------------------------|---------------|---------------------------------------------|
| GET    | `/api/public/scripts`    | não           | Lista scripts visíveis no site              |
| GET    | `/api/scripts`           | sim           | Lista completa (inclui quebrados e notas)   |
| POST   | `/api/scripts`           | sim           | Cria um script                              |
| PUT    | `/api/scripts/:id`       | sim           | Atualiza um script                          |
| DELETE | `/api/scripts/:id`       | sim           | Remove um script                            |

Corpo esperado em POST/PUT:
```json
{
  "game": "Blox Fruits",
  "category": "RPG & Aventura",
  "image": "",
  "source": "",
  "code": "loadstring(...)()",
  "free": true,
  "updatedFlag": true,
  "broken": false,
  "notes": ""
}
```

## Sobre o conteúdo dos scripts

Este backend só armazena e serve o que você cadastrar — ele não busca, valida ou verifica a segurança de nenhum script automaticamente. Continua sendo responsabilidade de quem administra o site revisar cada código antes de publicar.
