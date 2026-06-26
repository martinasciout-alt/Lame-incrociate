 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSy....",
  authDomain: "gioco-della-lama-alta.firebaseapp.com",
  databaseURL: "https://gioco-della-lama-alta-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gioco-della-lama-alta"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* STATE */
let roomCode, playerNumber, roomData;
let locked = false;
let timer = null;

/* DOM (lobby NON toccata) */
const lobby = document.getElementById("lobby");
const game = document.getElementById("game");

const hand = document.getElementById("hand");
const score1 = document.getElementById("score1");
const score2 = document.getElementById("score2");
const round = document.getElementById("round");
const countdownEl = document.getElementById("countdown");

const cardCPU = document.getElementById("cardCPU");
const cardP1 = document.getElementById("cardP1");
const cardP2 = document.getElementById("cardP2");

const roomCodeEl = document.getElementById("roomCode");

/* POPUP (invariato) */
window.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popupRegole");
  const close = document.getElementById("chiudiPopup");
  const help = document.getElementById("helpButton");

  if (popup) popup.classList.remove("hidden");

  if (close) close.onclick = () => popup.classList.add("hidden");
  if (help) help.onclick = () => popup.classList.remove("hidden");
});

/* ROOM */
window.createRoom = () => {
  roomCode = document.getElementById("roomInput").value;
  playerNumber = 1;

  set(ref(db, "rooms/" + roomCode), {
    p1: null,
    p2: null,
    score1: 0,
    score2: 0,
    round: 1,
    state: "waiting",
    cpu: null
  });

  start();
};

window.joinRoom = () => {
  roomCode = document.getElementById("roomInput").value;
  playerNumber = 2;

  update(ref(db, "rooms/" + roomCode), {
    state: "playing"
  });

  start();
};

/* START */
function start() {
  lobby.classList.add("hidden");
  game.classList.remove("hidden");

  roomCodeEl.textContent = roomCode;

  listen();
  renderHand();
}

/* HAND */
function renderHand() {
  hand.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const img = document.createElement("img");
    img.src = `carta-${i}.webp`;
    img.className = "card-hand";

    img.onclick = () => choose(i);
    hand.appendChild(img);
  }
}

/* CHOOSE (FIX FONDAMENTALE) */
window.choose = (v) => {
  if (!roomData) return;
  if (roomData.state !== "choose") return;

  const field = playerNumber === 1 ? "p1" : "p2";

  update(ref(db, "rooms/" + roomCode), {
    [field]: v
  });
};

/* LISTEN */
function listen() {
  onValue(ref(db, "rooms/" + roomCode), (snap) => {
    roomData = snap.val();
    if (!roomData) return;

    score1.textContent = roomData.score1;
    score2.textContent = roomData.score2;
    round.textContent = roomData.round;

    render(roomData);

    /* PARTENZA ROUND SOLO UNA VOLTA */
    if (roomData.state === "playing" && !locked) {
      locked = true;
      startRound();
    }

    /* SE ENTRAMBI HANNO SCELTO -> REVEAL AUTOMATICO */
    if (
      roomData.state === "choose" &&
      roomData.p1 != null &&
      roomData.p2 != null &&
      !timer
    ) {
      clearInterval(timer);
      reveal();
    }
  });
}

/* ROUND START */
function startRound() {
  update(ref(db, "rooms/" + roomCode), {
    cpu: Math.floor(Math.random() * 5) + 1,
    p1: null,
    p2: null,
    state: "choose"
  });

  countdown(5);
}

/* TIMER */
function countdown(t) {
  clearInterval(timer);

  timer = setInterval(() => {
    countdownEl.textContent = t;
    t--;

    if (t < 0) {
      clearInterval(timer);
      timer = null;
      reveal();
    }
  }, 1000);
}

/* SCORE */
function calc(c, cpu) {
  if (!c || !cpu) return 0;
  if (c === cpu) return 2;
  if (Math.abs(c - cpu) === 1) return 1;
  return 0;
}

/* REVEAL */
function reveal() {
  if (!roomData) return;

  let s1 = roomData.score1;
  let s2 = roomData.score2;

  const a = calc(roomData.p1, roomData.cpu);
  const b = calc(roomData.p2, roomData.cpu);

  if (a > b) s1 += a;
  if (b > a) s2 += b;

  update(ref(db, "rooms/" + roomCode), {
    score1: s1,
    score2: s2,
    round: roomData.round + 1,
    state: "playing"
  });

  locked = false;
  timer = null;
}

/* RENDER (TAVOLO SEMPRE PULITO + NO BUG) */
function render(d) {
  const back = `<img src="retro-carta.webp">`;

  cardCPU.innerHTML = d.cpu ? `<img src="carta-${d.cpu}.webp">` : back;
  cardP1.innerHTML = back;
  cardP2.innerHTML = back;
}
