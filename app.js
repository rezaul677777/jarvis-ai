const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function add(role, text) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${role}:</b> ${text}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(u);
}

async function send() {
  const message = input.value.trim();
  if (!message) return;

  add("You", message);
  input.value = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    if (!res.ok) {
      add("Jarvis", "Error: " + (data.error || "Failed"));
      return;
    }

    add("Jarvis", data.reply);
    speak(data.reply);
  } catch (err) {
    add("Jarvis", "Network error");
  }
}

sendBtn.onclick = send;
input.addEventListener("keydown", e => {
  if (e.key === "Enter") send();
});
