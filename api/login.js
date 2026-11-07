// POST /api/login  { password }  →  { token }
import { handle, send, readBody, checkPassword, issueToken, HttpError } from "../lib/db.js";

export default handle(async (req, res) => {
  if (req.method !== "POST") throw new HttpError(405, "Método não permitido.");
  const { password } = readBody(req);
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600));
    throw new HttpError(401, "Senha incorreta.");
  }
  send(res, 200, { token: issueToken(30) });
});
