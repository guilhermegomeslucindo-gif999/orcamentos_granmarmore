// GET /api/settings  →  ajustes da marmoraria
// PUT /api/settings  { ...ajustes }  →  ajustes salvos
import { handle, send, readBody, requireAuth, db, HttpError, T } from "../lib/db.js";

export default handle(async (req, res) => {
  requireAuth(req);
  const pool = await db();

  if (req.method === "GET") {
    const { rows } = await pool.query(`select data from ${T.settings} where id = 1`);
    return send(res, 200, rows[0] ? rows[0].data : {});
  }

  if (req.method === "PUT") {
    const body = readBody(req);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Ajustes inválidos.");
    // O próximo número nunca pode ficar abaixo de um número já usado.
    const { rows: m } = await pool.query(`select coalesce(max(numero), 0) as m from ${T.quotes}`);
    body.proximoNumero = Math.max(parseInt(body.proximoNumero, 10) || 1, Number(m[0].m) + 1);
    const { rows } = await pool.query(
      `insert into ${T.settings} (id, data, updated_at) values (1, $1::jsonb, now())
       on conflict (id) do update set data = excluded.data, updated_at = now()
       returning data`,
      [JSON.stringify(body)]
    );
    return send(res, 200, rows[0].data);
  }

  throw new HttpError(405, "Método não permitido.");
});
