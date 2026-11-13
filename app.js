
const BB_CONFIG = {
  API_URL: "",
  ASSISTANT_NAME: "BB"
};

const statusElement = document.getElementById("status");
const messagesElement = document.getElementById("messages");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("user-message");

function addMessage(text, sender = "bb") {
  const message = document.createElement("p");
  message.className = "message";
  message.textContent =
    (sender === "user" ? "Tú: " : "BB: ") + text;

  messagesElement.appendChild(message);
  messagesElement.scrollTop = messagesElement.scrollHeight;
}

function setStatus(text) {
  statusElement.textContent = text;
}

async function sendMessage(text) {
  if (!BB_CONFIG.API_URL) {
    addMessage(
      "Todavía estoy esperando la conexión con mi cerebro central. La interfaz está preparada."
    );
    return;
  }

  try {
    setStatus("Conectando...");

    const response = await fetch(BB_CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text
      })
    });

    if (!response.ok) {
      throw new Error("Error del servidor: " + response.status);
    }

    const data = await response.json();

    addMessage(
      data.reply || "He recibido una respuesta sin contenido."
    );

    setStatus("Conectado");
  } catch (error) {
    addMessage(
      "No pude comunicarme con el servidor. " + error.message
    );
    setStatus("Sin conexión");
  }
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();

  if (!text) return;

  addMessage(text, "user");
  messageInput.value = "";

  await sendMessage(text);
});

setStatus("Interfaz preparada");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .catch(() => {
        console.log("Service Worker pendiente de configuración.");
      });
  });
}
