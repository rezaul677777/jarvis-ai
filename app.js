// app.js

// ---------- CONFIG ----------
const API_URL = "/api/chat"; // Vercel serverless function

// ---------- ELEMENTS (make sure these IDs exist in index.html) ----------
const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const micBtn = document.getElementById("micBtn");     // optional
const stopBtn = document.getElementById("stopBtn");   // optional
const speakToggle = document.getElementById("speakToggle"); // optional checkbox

// ---------- STATE ----------
let autoSpeak = true;

// If you have a checkbox toggle in HTML, sync it
if (speakToggle) {
  autoSpeak = !!speakToggle.checked;
  speakToggle.addEventListener("change", () => {
    autoSpeak = !!speakToggle.checked;
  });
}

// ---------- HELPERS: UI ----------
function addMessage(role, text) {
  if (!chatEl) return;

  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`; // style with CSS: .msg.user, .msg.jarvis, etc.

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrap.appendChild(bubble);
  chatEl.appendChild(wrap);

  // scroll to bottom
  chatEl.scrollTop = chatEl.scrollHeight;
}

function setBusy(isBusy) {
  if (sendBtn) sendBtn.disabled = isBusy;
  if (micBtn) micBtn.disabled = isBusy;
}

// ---------- HELPERS: API ----------
async function callJarvis(message) {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = data?.error || `Request failed (${r.status})`;
    throw new Error(err);
  }
  return (data.reply || "").toString();
}

// ---------- VOICE: Text-to-Speech ----------
function canSpeak() {
  return "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

function jarvisSpeak(text) {
  if (!autoSpeak) return;
  if (!canSpeak()) return;

  // Some mobile browsers require user interaction first (button click).
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  // You can tweak these:
  u.rate = 1;     // 0.1 - 10
  u.pitch = 1;    // 0 - 2
  u.volume = 1;   // 0 - 1
  // u.lang = "en-US"; // set if you want fixed language

  window.speechSynthesis.speak(u);
}

function stopSpeaking() {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
}

if (stopBtn) {
  stopBtn.addEventListener("click", stopSpeaking);
}

// ---------- VOICE: Speech-to-Text ----------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;
let listening = false;

function canListen() {
  return !!SpeechRecognition;
}

function startListening() {
  if (!canListen()) {
    alert("Voice input is not supported in this browser.");
    return;
  }
  if (listening) return;

  recognizer = new SpeechRecognition();
  recognizer.lang = "en-US";        // change if needed
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;

  listening = true;
  if (micBtn) micBtn.textContent = "🎙 Listening...";

  recognizer.onresult = (e) => {
    const text = e.results?.[0]?.[0]?.transcript || "";
    if (inputEl) inputEl.value = text;
    // auto-send after voice recognition:
    if (text.trim()) sendMessage(text.trim());
  };

  recognizer.onerror = (e) => {
    console.log("Speech recognition error:", e.error);
    // Common: "not-allowed" if mic permission denied
    listening = false;
    if (micBtn) micBtn.textContent = "🎤 Mic";
  };

  recognizer.onend = () => {
    listening = false;
    if (micBtn) micBtn.textContent = "🎤 Mic";
  };

  recognizer.start();
}

function stopListening() {
  if (recognizer && listening) {
    recognizer.stop();
  }
}

if (micBtn) {
  // Click to start; click again to stop
  micBtn.addEventListener("click", () => {
    if (!listening) startListening();
    else stopListening();
  });

  // If not supported, disable mic button
  if (!canListen()) {
    micBtn.disabled = true;
    micBtn.title = "Speech recognition not supported in this browser";
  }
}

// ---------- MAIN: Send message ----------
async function sendMessage(forcedText) {
  const text = (forcedText ?? inputEl?.value ?? "").trim();
  if (!text) return;

  stopSpeaking(); // stop any ongoing speech when user sends a new message

  addMessage("user", text);
  if (inputEl) inputEl.value = "";

  setBusy(true);
  try {
    addMessage("jarvis", "Thinking...");

    const reply = await callJarvis(text);

    // Replace the last "Thinking..." message
    if (chatEl && chatEl.lastElementChild) {
      const last = chatEl.lastElementChild;
      if (last.classList.contains("jarvis")) {
        const bubble = last.querySelector(".bubble");
        if (bubble) bubble.textContent = reply;
      } else {
        addMessage("jarvis", reply);
      }
    } else {
      addMessage("jarvis", reply);
    }

    jarvisSpeak(reply);
  } catch (err) {
    // Replace "Thinking..." with error
    const msg = err?.message || "Something went wrong";
    if (chatEl && chatEl.lastElementChild) {
      const last = chatEl.lastElementChild;
      if (last.classList.contains("jarvis")) {
        const bubble = last.querySelector(".bubble");
        if (bubble) bubble.textContent = `Error: ${msg}`;
      } else {
        addMessage("jarvis", `Error: ${msg}`);
      }
    } else {
      addMessage("jarvis", `Error: ${msg}`);
    }
  } finally {
    setBusy(false);
  }
}

// Send button
if (sendBtn) {
  sendBtn.addEventListener("click", () => sendMessage());
}

// Enter key to send
if (inputEl) {
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}