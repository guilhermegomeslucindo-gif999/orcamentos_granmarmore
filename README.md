# Gerador de Orçamentos · Marmoraria Granmármore

Sistema para a equipe da Marmoraria Granmármore criar, salvar, editar, renomear e baixar orçamentos em PDF. Os orçamentos ficam num banco de dados Postgres, então a equipe toda vê a mesma lista no computador, no tablet e no celular.

## O que tem no projeto

```
public/          o site (HTML, CSS, JavaScript, logo)
api/             funções da Vercel (login, orçamentos, ajustes)
lib/db.js        conexão com o banco e verificação de senha
schema.sql       estrutura do banco (criada sozinha no primeiro acesso)
dev-server.mjs   servidor para testar no computador (opcional)
```

## Publicar (passo a passo)

### 1. Criar o banco de dados (grátis)

Escolha uma das opções:

**Supabase** (supabase.com)
1. Crie um projeto novo. Anote a senha do banco.
2. Clique em **Connect** e copie a connection string do **Transaction pooler** (porta 6543).
3. Troque `[YOUR-PASSWORD]` pela senha do banco.

**Neon** (neon.tech)
1. Crie um projeto novo.
2. Copie a connection string mostrada no painel.

As tabelas são criadas automaticamente no primeiro acesso. Se preferir criar manualmente, rode o `schema.sql` no SQL Editor do Supabase ou do Neon.

### 2. Subir no GitHub

1. Crie um repositório novo (de preferência **privado**).
2. Envie todos os arquivos desta pasta. O `.gitignore` já impede o envio da pasta `node_modules` e do arquivo `.env`.

### 3. Publicar na Vercel

1. Em vercel.com, clique em **Add New › Project** e importe o repositório.
2. Framework Preset: **Other**. Não mexa em Build Command nem em Output Directory: o `vercel.json` já cuida disso.
3. Em **Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a connection string do passo 1 |
| `APP_PASSWORD` | a senha que a equipe vai usar para entrar |

4. Clique em **Deploy**. Para usar um domínio próprio, vá em **Settings › Domains**.

Se mudar alguma variável depois, faça um **Redeploy** para ela valer.

## Como usar

- **Novo:** preencha cliente, ambientes, peças e condições e toque em **Gerar orçamento**. O número (0001, 0002…) é dado automaticamente.
- **Orçamentos:** lista com todos os orçamentos da equipe. Dá para abrir, **editar**, **renomear**, **baixar o PDF de novo**, duplicar, excluir e marcar se fechou ou perdeu (com o motivo).
- **Ajustes:** dados da marmoraria, vendedores e textos padrão. Valem para toda a equipe.

O botão **Baixar PDF** abre a janela de impressão do navegador. Escolha **Salvar como PDF**. No celular, use **Compartilhar › Salvar em Arquivos** ou **Imprimir › Salvar PDF**.

## Testar no computador (opcional)

```bash
cp .env.example .env    # preencha DATABASE_URL e APP_PASSWORD
npm install
npm run dev             # abre em http://localhost:3000
```
