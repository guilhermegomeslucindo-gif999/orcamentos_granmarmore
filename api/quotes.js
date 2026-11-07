// Orçamentos
// GET    /api/quotes             → lista (sem as imagens)
// GET    /api/quotes?full=1      → lista completa (para exportar)
// GET    /api/quotes?id=ID       → um orçamento completo
// POST   /api/quotes  {orçamento} → cria ou atualiza (gera o número na primeira vez)
// PATCH  /api/quotes?id=ID {titulo?, status?, motivo?} → renomear / mudar status
// DELETE /api/quotes?id=ID       → exclui
import { handle, send, readBody, requireAuth, db, tx, HttpError, T } from "../lib/db.js";

const STATUS = ["aberto", "fechou", "perdeu"];
const COLS = "id, numero, titulo, status, motivo, created_at, updated_at";

function toQuote(row) {
  const q = Object.assign({}, row.data || {});
  q.id = row.id;
  q.numero = row.numero;
  q.titulo = row.titulo;
  q.status = row.status;
  q.motivo = row.motivo;
  q.createdAt = new Date(row.created_at).getTime();
  q.updatedAt = new Date(row.updated_at).getTime();
  if (row.n_imgs != null) q.nImagens = Number(row.n_imgs);
  return q;
}
function str(v, max) { return String(v == null ? "" : v).slice(0, max || 500); }
function money(v) { const n = Number(v); return isFinite(n) ? Math.round(n * 100) / 100 : 0; }

export default handle(async (req, res) => {
  requireAuth(req);
  const pool = await db();
  const id = req.query && req.query.id ? String(req.query.id) : "";

  if (req.method === "GET") {
    if (id) {
      const { rows } = await pool.query(`select ${COLS}, data from ${T.quotes} where id = $1`, [id]);
      if (!rows[0]) throw new HttpError(404, "Orçamento não encontrado.");
      return send(res, 200, toQuote(rows[0]));
    }
    const full = req.query && req.query.full === "1";
    const { rows } = await pool.query(
      `select ${COLS}, ${full ? "data" : "data - 'imagens' as data"},
              jsonb_array_length(coalesce(data->'imagens', '[]'::jsonb)) as n_imgs
         from ${T.quotes} order by numero desc nulls last, created_at desc limit 2000`
    );
    return send(res, 200, rows.map(toQuote));
  }

  if (req.method === "POST") {
    const q = readBody(req);
    if (!q || typeof q !== "object" || !/^[A-Za-z0-9_-]{4,64}$/.test(String(q.id || ""))) throw new HttpError(400, "Orçamento inválido.");
    if (!q.cliente || !str(q.cliente.nome).trim()) throw new HttpError(400, "Preencha o nome do cliente.");
    const saved = await tx(async (c) => {
      const ex = await c.query(`select numero, status, motivo from ${T.quotes} where id = $1 for update`, [q.id]);
      let numero = ex.rows[0] ? ex.rows[0].numero : null;
      if (numero == null) {
        await c.query(`insert into ${T.settings} (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing`);
        const s = await c.query(`select data from ${T.settings} where id = 1 for update`);
        const m = await c.query(`select coalesce(max(numero), 0) as m from ${T.quotes}`);
        numero = Math.max(parseInt(s.rows[0].data.proximoNumero, 10) || 1, Number(m.rows[0].m) + 1);
        await c.query(`update ${T.settings} set data = jsonb_set(data, '{proximoNumero}', to_jsonb($1::int), true), updated_at = now() where id = 1`, [numero + 1]);
      }
      // Status e motivo são alterados pela lista (PATCH); editar o orçamento não mexe neles.
      const status = ex.rows[0] ? ex.rows[0].status : "aberto";
      const motivo = ex.rows[0] ? ex.rows[0].motivo : "";
      const data = Object.assign({}, q);
      ["id", "numero", "status", "motivo", "createdAt", "updatedAt", "nImagens"].forEach((k) => delete data[k]);
      const titulo = str(q.titulo, 160);
      const { rows } = await c.query(
        `insert into ${T.quotes} (id, numero, titulo, cliente, vendedor, status, motivo, total_a, total_b, data)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
         on conflict (id) do update set
           titulo = excluded.titulo, cliente = excluded.cliente, vendedor = excluded.vendedor,
           status = excluded.status, motivo = excluded.motivo, total_a = excluded.total_a, total_b = excluded.total_b,
           data = excluded.data, updated_at = now()
         returning ${COLS}, data`,
        [q.id, numero, titulo, str(q.cliente.nome, 160), str(q.vendedor && q.vendedor.nome, 120), status, motivo,
          money(q.totalA), q.comparar ? money(q.totalB) : null, JSON.stringify(data)]
      );
      return rows[0];
    });
    return send(res, 200, toQuote(saved));
  }

  if (req.method === "PATCH") {
    if (!id) throw new HttpError(400, "Informe o orçamento.");
    const b = readBody(req);
    const sets = [], vals = [id];
    if (b.titulo != null) { vals.push(str(b.titulo, 160)); sets.push("titulo = $" + vals.length); }
    if (b.status != null) {
      if (STATUS.indexOf(b.status) < 0) throw new HttpError(400, "Status inválido.");
      vals.push(b.status); sets.push("status = $" + vals.length);
    }
    if (b.status != null && b.status !== "perdeu") sets.push("motivo = ''");
    else if (b.motivo != null) { vals.push(str(b.motivo, 120)); sets.push("motivo = $" + vals.length); }
    if (!sets.length) throw new HttpError(400, "Nada para alterar.");
    const { rows } = await pool.query(
      `update ${T.quotes} set ${sets.join(", ")}, updated_at = now() where id = $1
       returning ${COLS}, data - 'imagens' as data, jsonb_array_length(coalesce(data->'imagens', '[]'::jsonb)) as n_imgs`, vals);
    if (!rows[0]) throw new HttpError(404, "Orçamento não encontrado.");
    return send(res, 200, toQuote(rows[0]));
  }

  if (req.method === "DELETE") {
    if (!id) throw new HttpError(400, "Informe o orçamento.");
    const { rowCount } = await pool.query(`delete from ${T.quotes} where id = $1`, [id]);
    if (!rowCount) throw new HttpError(404, "Orçamento não encontrado.");
    return send(res, 200, { ok: true });
  }

  throw new HttpError(405, "Método não permitido.");
});
