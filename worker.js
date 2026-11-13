
const BB_MODEL = "gemini-3.8-flash";

const SYSTEM_INSTRUCTION = `
Eres BB, un Mayordomo Digital Personal y Comercial.
Tu propietario es el director de las operaciones.

Tu misión es:
- Ayudar a gestionar Hotmart y sus ventas.
- Organizar tareas y oportunidades comerciales.
- Analizar información y preparar informes.
- Ayudar a planificar campañas de marketing.
- Mantener una comunicación clara, profesional y proactiva.

REGLAS:
1. Habla siempre en español.
2. Sé organizado, preciso y resolutivo.
3. No inventes ventas, ganancias ni resultados.
4. No afirmes haber ejecutado acciones que no realizaste.
5. Consulta antes de gastos, afiliaciones y acciones sensibles.
6. Prioriza la seguridad y confidencialidad.
7. Distingue siempre entre propuestas y acciones realizadas.
`;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({
        service: "BB",
        status: "online",
        version: "1.0"
      });
    }

    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      return jsonResponse({ error: "Ruta no disponible" }, 404);
    }

    if (!env.GEMINI_API_KEY || !env.BB_ACCESS_TOKEN) {
      return jsonResponse({
        error: "Configuración de seguridad incompleta"
      }, 503);
    }

    const authorization = request.headers.get("Authorization");

    if (authorization !== `Bearer ${env.BB_ACCESS_TOKEN}`) {
      return jsonResponse({
        error: "Acceso no autorizado"
      }, 401);
    }

    try {
      const body = await request.json();
      const message = String(body.message || "").trim();

      if (!message || message.length > 8000) {
        return jsonResponse({
          error: "Mensaje vacío o demasiado largo"
        }, 400);
      }

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            model: BB_MODEL,
            input: message,
            system_instruction: SYSTEM_INSTRUCTION,
            store: false
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return jsonResponse({
          error: "El servicio de inteligencia artificial no respondió correctamente",
          status: response.status
        }, 502);
      }

      const reply = (data.steps || [])
        .filter(step => step.type === "model_output")
        .flatMap(step => step.content || [])
        .filter(item => item.type === "text")
        .map(item => item.text)
        .join("\n");

      if (!reply) {
        return jsonResponse({
          error: "No se recibió una respuesta de texto"
        }, 502);
      }

      return jsonResponse({
        assistant: "BB",
        reply: reply
      });

    } catch (error) {
      return jsonResponse({
        error: "Error interno del servidor"
      }, 500);
    }
  }
};
