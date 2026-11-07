// Conexão com o Postgres, autenticação e utilidades das funções da API.
import pg from "pg";
import crypto from "node:crypto";

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

let pool = null;

// Área (schema) do banco onde ficam as tabelas deste sistema.
export const SCHEMA = (() => {
  const v = String(process.env.DB_SCHEMA || "granmarmore").trim().toLowerCase();
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(v)) throw new Error("DB_SCHEMA inválido");
  return v;
})();
export const T = { quotes: SCHEMA + ".quotes", settings: SCHEMA + ".settings" };
let schemaReady = null;

function connectionConfig() {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!raw) throw new HttpError(500, "Banco de dados não configurado: defina a variável DATABASE_URL na Vercel.");
  let url;
  try { url = new URL(raw); } catch { throw new HttpError(500, "DATABASE_URL inválida."); }
  const sslmode = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");
  const local = /^(localhost|127\.0\.0\.1|::1)$/.test(url.hostname) || url.hostname.endsWith(".local");
  const ssl = local || sslmode === "disable" ? false : { rejectUnauthorized: false };
  return { connectionString: url.toString(), ssl };
}

// O Supabase usa servidores de conexão com nomes "aws-0-…" ou "aws-1-…" conforme o projeto.
// Se o endereço informado não for o do projeto, tentamos a outra variação automaticamente.
function candidates(cfg) {
  const out = [cfg];
  try {
    const u = new URL(cfg.connectionString);
    const m = u.hostname.match(/^aws-(\d)-(.+\.pooler\.supabase\.com)$/);
    if (m) ["0", "1", "2"].filter((n) => n !== m[1]).forEach((n) => {
      const v = new URL(u.toString()); v.hostname = "aws-" + n + "-" + m[2];
      out.push({ ...cfg, connectionString: v.toString() });
    });
  } catch { /* ignora */ }
  return out;
}
function makePool(cfg) {
  const p = new pg.Pool({ ...cfg, max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
  p.on("error", () => { /* conexão ociosa caiu; o pool reconecta sozinho */ });
  return p;
}
let poolReady = null;
export function getPool() {
  if (!poolReady) {
    poolReady = (async () => {
      const list = candidates(connectionConfig());
      let lastErr;
      for (const cfg of list) {
        const p = makePool(cfg);
        try { await p.query("select 1"); pool = p; return p; }
        catch (e) {
          lastErr = e; p.end().catch(() => {});
          if (!/tenant or user not found|ENOTFOUND|EAI_AGAIN/i.test(String(e && e.message))) break;
        }
      }
      throw lastErr;
    })().catch((e) => { poolReady = null; throw e; });
  }
  return poolReady;
}

const SCHEMA_SQL = `
do $$ begin if not exists (select 1 from pg_namespace where nspname = '${SCHEMA}') then execute 'create schema ${SCHEMA}'; end if; end $$;
create table if not exists ${T.settings} (id integer primary key default 1 check (id = 1), data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
create table if not exists ${T.quotes} (id text primary key, numero integer unique, titulo text not null default '', cliente text not null default '', vendedor text not null default '', status text not null default 'aberto' check (status in ('aberto','fechou','perdeu')), motivo text not null default '', total_a numeric(14,2) not null default 0, total_b numeric(14,2), data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists quotes_updated_at_idx on ${T.quotes} (updated_at desc);
create index if not exists quotes_status_idx on ${T.quotes} (status);
insert into ${T.settings} (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;`;

export async function db() {
  const p = await getPool();
  if (!schemaReady) {
    schemaReady = p.query(SCHEMA_SQL).catch((e) => { schemaReady = null; throw e; });
  }
  await schemaReady;
  return p;
}

export async function tx(fn) {
  const client = await (await db()).connect();
  try {
    await client.query("begin");
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (e) {
    try { await client.query("rollback"); } catch { /* ignora */ }
    throw e;
  } finally {
    client.release();
  }
}

/* ---------- Autenticação por senha compartilhada ---------- */
function secret() {
  const pw = process.env.APP_PASSWORD;
  if (!pw) throw new HttpError(500, "Senha de acesso não configurada: defina a variável APP_PASSWORD na Vercel.");
  return process.env.AUTH_SECRET || "granmarmore:" + pw;
}
function hmac(v) { return crypto.createHmac("sha256", secret()).update(String(v)).digest("base64url"); }
function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
export function checkPassword(pw) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) secret();
  return safeEqual(crypto.createHash("sha256").update(String(pw || "")).digest("hex"), crypto.createHash("sha256").update(expected).digest("hex"));
}
export function issueToken(days = 30) {
  const exp = Date.now() + days * 86400000;
  return exp + "." + hmac(exp);
}
export function requireAuth(req) {
  const h = req.headers.authorization || "";
  const token = h.replace(/^Bearer\s+/i, "").trim();
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now()) || !safeEqual(sig, hmac(exp))) {
    throw new HttpError(401, "Sessão expirada. Entre novamente.");
  }
}

/* ---------- Respostas ---------- */
export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
export function readBody(req) {
  const b = req.body;
  if (b == null || b === "") return {};
  if (typeof b === "string") { try { return JSON.parse(b); } catch { throw new HttpError(400, "JSON inválido."); } }
  if (Buffer.isBuffer(b)) { try { return JSON.parse(b.toString("utf8")); } catch { throw new HttpError(400, "JSON inválido."); } }
  return b;
}
export function handle(fn) {
  return async function handler(req, res) {
    try {
      await fn(req, res);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status >= 500) console.error(e);
      const msg = e instanceof HttpError ? e.message :
        /ECONNREFUSED|ENOTFOUND|password authentication|timeout|getaddrinfo|tenant or user not found/i.test(String(e && e.message)) ?
          "Não foi possível conectar ao banco de dados. Confira a DATABASE_URL." : "Erro interno no servidor.";
      send(res, status, { error: msg });
    }
  };
}
