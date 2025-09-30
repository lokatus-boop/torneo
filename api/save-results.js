// api/save-results.js
export default async function handler(req, res) {
  // --- CORS (allowlist para GitHub Pages) ---
  const allowedOrigins = new Set([
    "https://lokatus-boop.github.io", // Origin de GitHub Pages
    // "http://localhost:5173",        // descomenta para pruebas locales
  ]);
  const origin = req.headers.origin || "";
  if (allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const GH_TOKEN  = process.env.GH_TOKEN;
    const GH_OWNER  = process.env.GH_OWNER || "lokatus-boop";
    const GH_REPO   = process.env.GH_REPO  || "torneo";
    const GH_BRANCH = process.env.GH_BRANCH || "main";
    const FILE_PATH = process.env.FILE_PATH || "results/resultados_pozo.json";

    if (!GH_TOKEN || !GH_OWNER || !GH_REPO) {
      return res.status(500).json({ error: "Config del servidor incompleta" });
    }

    const body = req.body || {};
    const contentJson = JSON.stringify(body, null, 2);
    const contentB64 = Buffer.from(contentJson, "utf8").toString("base64");
    const message = `update(results): guardar resultados ${new Date().toISOString()}`;

    const contentUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(FILE_PATH)}?ref=${encodeURIComponent(GH_BRANCH)}`;

    // ¿Existe ya el archivo? (para obtener SHA)
    let existingSha;
    {
      const r = await fetch(contentUrl, {
        headers: { "Authorization": `Bearer ${GH_TOKEN}`, "Accept": "application/vnd.github+json" }
      });
      if (r.status === 200) {
        const info = await r.json();
        existingSha = info.sha;
      } else if (r.status !== 404) {
        const txt = await r.text();
        return res.status(500).json({ error: "No se pudo leer el archivo", details: txt });
      }
    }

    // Crear/actualizar
    const putRes = await fetch(contentUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${GH_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: contentB64,
        branch: GH_BRANCH,
        sha: existingSha, // requerido si ya existía
      }),
    });

    if (!putRes.ok) {
      const txt = await putRes.text();
      return res.status(500).json({ error: "No se pudo commitear", details: txt });
    }

    const data = await putRes.json();
    return res.status(200).json({ ok: true, commitSha: data.commit?.sha });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Excepción servidor", details: String(err) });
  }
}
