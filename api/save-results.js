// api/save-results.js
export default async function handler(req, res) {
  // --- CORS allowlist (GitHub Pages) ---
  const allowedOrigins = new Set([
    "https://lokatus-boop.github.io",
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
    const BASE_BRANCH = process.env.GH_BRANCH || "main";
    const WORK_BRANCH = process.env.WORK_BRANCH || "results-updates";
    const FILE_PATH = process.env.FILE_PATH || "results/resultados_pozo.json";

    if (!GH_TOKEN) return res.status(500).json({ error: "Falta GH_TOKEN" });

    const gh = (url, opts={}) =>
      fetch(url, {
        ...opts,
        headers: {
          "Authorization": `Bearer ${GH_TOKEN}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          ...(opts.headers || {}),
        },
      });

    // 0) get base branch SHA
    const baseRefUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/git/ref/heads/${BASE_BRANCH}`;
    const baseRefRes = await gh(baseRefUrl);
    if (!baseRefRes.ok) {
      const txt = await baseRefRes.text();
      return res.status(500).json({ error: "No se pudo leer la rama base", details: txt });
    }
    const baseRef = await baseRefRes.json();
    const baseSha = baseRef.object.sha;

    // 1) ensure work branch exists (create from base if missing)
    const workRefUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/git/ref/heads/${WORK_BRANCH}`;
    let workSha = baseSha;
    const workRefCheck = await gh(workRefUrl);
    if (workRefCheck.status === 404) {
      // create branch
      const createRef = await gh(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/git/refs`, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${WORK_BRANCH}`, sha: baseSha }),
      });
      if (!createRef.ok) {
        const txt = await createRef.text();
        return res.status(500).json({ error: "No se pudo crear la rama de trabajo", details: txt });
      }
    } else if (!workRefCheck.ok) {
      const txt = await workRefCheck.text();
      return res.status(500).json({ error: "No se pudo comprobar la rama de trabajo", details: txt });
    } else {
      const w = await workRefCheck.json();
      workSha = w.object.sha;
    }

    // 2) get existing file sha on work branch (if any)
    const contentUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(FILE_PATH)}?ref=${encodeURIComponent(WORK_BRANCH)}`;
    let existingSha;
    {
      const r = await gh(contentUrl);
      if (r.status === 200) {
        const info = await r.json();
        existingSha = info.sha;
      } else if (r.status !== 404) {
        const txt = await r.text();
        return res.status(500).json({ error: "No se pudo leer el archivo en la rama de trabajo", details: txt });
      }
    }

    // 3) put content on work branch
    const body = req.body || {};
    const contentJson = JSON.stringify(body, null, 2);
    const contentB64 = Buffer.from(contentJson, "utf8").toString("base64");
    const message = `chore(results): actualizar resultados ${new Date().toISOString()}`;
    const putRes = await gh(contentUrl, {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: contentB64,
        branch: WORK_BRANCH,
        sha: existingSha,
      }),
    });
    if (!putRes.ok) {
      const txt = await putRes.text();
      return res.status(500).json({ error: "No se pudo subir el archivo a la rama de trabajo", details: txt });
    }

    // 4) ensure PR exists from work -> base
    const prsUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/pulls?head=${GH_OWNER}:${WORK_BRANCH}&base=${BASE_BRANCH}&state=open`;
    const prsRes = await gh(prsUrl);
    if (!prsRes.ok) {
      const txt = await prsRes.text();
      return res.status(500).json({ error: "No se pudo listar PRs", details: txt });
    }
    const prs = await prsRes.json();
    let pr = prs[0];
    if (!pr) {
      const createPrRes = await gh(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/pulls`, {
        method: "POST",
        body: JSON.stringify({
          title: "Actualizar resultados del Pozo",
          head: WORK_BRANCH,
          base: BASE_BRANCH,
          body: "Actualización automática desde la web (endpoint Vercel).",
        }),
      });
      if (!createPrRes.ok) {
        const txt = await createPrRes.text();
        return res.status(500).json({ error: "No se pudo crear el Pull Request", details: txt });
      }
      pr = await createPrRes.json();
    }

    return res.status(200).json({ ok: true, branch: WORK_BRANCH, prNumber: pr.number });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Excepción servidor", details: String(err) });
  }
}
