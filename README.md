# 🏓 Pozo Americano - Torneo 2025/2026

Gestión completa de un **torneo tipo Pozo Americano sin parejas fijas**, con calendario equilibrado, resultados al mejor de 3 sets y guardado automático en GitHub.

---

## 📅 Calendario

- **Inicio:** Jueves **09/10/2025**
- **Final:** Julio **2026**
- **Frecuencia:** 1 jornada por semana (jueves)
- **Formato:** Partidos **al mejor de 3 sets**
- **Rotaciones:** Equilibradas (todos juegan con y contra todos)
- **Festivos evitados:** 25/12/2025, 01/01/2026

Cada jornada está definida en el archivo principal `index.html`.

---

## 🌐 Web del Torneo

La aplicación está publicada en **GitHub Pages**:

🔗 [https://lokatus-boop.github.io/torneo/](https://lokatus-boop.github.io/torneo/)

### Funcionalidades
- 🧾 Ver el calendario completo.
- ✍️ Introducir resultados por jornada.
- 📊 Clasificación automática (victorias, derrotas y %).
- 🔒 Edición protegida por **código secreto `101010`**.
- 🔁 Reset de resultados (también con código `101010`).
- 💾 Guardado automático en GitHub (ver más abajo).

---

## 💾 Guardado de resultados en GitHub

Cada vez que pulsas **“Guardar en GitHub”** en la web:

1. Se genera un fichero JSON con todos los resultados:
results/resultados_pozo.json
2. El archivo se sube al repositorio **lokatus-boop/torneo** usando una **función serverless** alojada en **Vercel**.
3. Los cambios se aplican sobre la **rama `results-updates`**.
4. Se crea o actualiza un **Pull Request** hacia `main`.

Puedes revisar el archivo aquí:  
🔗 [Rama `results-updates`](https://github.com/lokatus-boop/torneo/tree/results-updates/results)

Y el Pull Request aquí:  
🔗 [Pull Requests](https://github.com/lokatus-boop/torneo/pulls)

Para consolidar los resultados, solo tienes que hacer **Merge** del PR.

---

## ⚙️ Backend (Vercel)

El guardado en GitHub lo realiza una **API Serverless** en el proyecto:

🔗 [https://torneo-green.vercel.app/api/save-results](https://torneo-green.vercel.app/api/save-results)

**Archivo:** `api/save-results.js`

### 🔐 Variables de entorno en Vercel

| Variable      | Valor                            |
|---------------|----------------------------------|
| `GH_TOKEN`    | Token Fine-grained con permisos  |
| `GH_OWNER`    | `lokatus-boop`                   |
| `GH_REPO`     | `torneo`                         |
| `GH_BRANCH`   | `main`                           |
| `FILE_PATH`   | `results/resultados_pozo.json`   |

### 🔑 Token (GH_TOKEN)
Creado desde la cuenta **lokatus-boop**, con permisos:
- **Repository contents:** ✅ *Read and Write*
- **Pull requests:** ✅ *Read and Write*
- **Metadata:** ✅ *Read*

Asignado únicamente al repositorio `lokatus-boop/torneo`.

---

## 🧱 Estructura del repositorio

torneo/
├─ index.html # Aplicación principal (frontend)
├─ results/
│ ├─ .gitkeep # Carpeta de resultados
│ └─ resultados_pozo.json # Archivo con los resultados (rama results-updates)
├─ api/
│ └─ save-results.js # Función serverless para Vercel
├─ README.md # Este documento

---

## 🚀 Flujo de uso

1. Ir a la web: [https://lokatus-boop.github.io/torneo/](https://lokatus-boop.github.io/torneo/)
2. Introducir resultados de las jornadas.
3. Pulsar **Guardar en GitHub** → aparecerá ✅ *Commit OK*.
4. Verificar el commit en la rama `results-updates`.
5. Hacer **Merge** del Pull Request para consolidar en `main`.

---

## 🛠️ Tecnología utilizada

- **Frontend:** HTML + JavaScript + LocalStorage  
- **Backend:** Serverless Function (Vercel)  
- **Almacenamiento:** GitHub (`resultados_pozo.json`)  
- **Hosting:** GitHub Pages  
- **Seguridad:** Código secreto `101010` para edición y reset  

---

## 📜 Licencia

Este proyecto está diseñado para uso personal / educativo.  
Puedes adaptarlo libremente para tus propios torneos.

---
