console.log("SCRIPT CARICATO");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ===================== FIREBASE =====================
const firebaseConfig = {
  apiKey: "AIzaSyBzdhurbAi48OoRyw6E3HIkd1q87-43c",
  authDomain: "gioco-della-lama-alta.firebaseapp.com",
  databaseURL: "https://gioco-della-lama-alta-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gioco-della-lama-alta",
  messagingSenderId: "182282784891",
  appId: "1:182282784891:web:0503cff93af07a0ee8d2de"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===================== STATE =====================
let roomCode = null;
let playerNumber = null;
let roomData = null;

let roundActive = false;
let roundStarted = false;

// ===================== POPUP =====================
window.closeRules = function () {
  document.getElementById("rulesPopup").style.display = "none";
};

// ===================== ENTER GAME =====================
window.enterGame = function () {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").classList.remove("hidden");
};

// ===================== ROOM =====================
window.createRoom = function (code) {
  if (!code) return;

  roomCode = code;
  playerNumber = 1;

  set(ref(db, "rooms/" + code), {
    score1: 0,
    score2: 0,
    round: 1,
    maxRounds: 3,
    player1Choice: null,
    player2Choice: null,
    cpu: null,
    locked: false
  });

  listen();
  renderHand();
};

window.joinRoom = function (code) {
  if (!code) return;

  roomCode = code;
  playerNumber = 2;

  listen();
  renderHand();
};

// ===================== HAND =====================
function renderHand() {
  const hand = document.getElementById("hand");
  hand.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement("button");
    btn.innerHTML = `<img src="carta-${i}.webp">`;
    btn.onclick = () => choose(i);
    hand.appendChild(btn);
  }
}

// ===================== LISTENER =====================
function listen() {
  const roomRef = ref(db, "rooms/" + roomCode);

  onValue(roomRef, (snap) => {
    const data = snap.val();
    if (!data) return;

    roomData = data;

    document.getElementById("score1").innerText = data.score1;
    document.getElementById("score2").innerText = data.score2;
    document.getElementById("round").innerText = data.round;
    document.getElementById("roomCode").innerText = roomCode;

    if (data.player1Choice != null)
      document.getElementById("cardP1").innerHTML = `<img src="retro-carta.webp">`;

    if (data.player2Choice != null)
      document.getElementById("cardP2").innerHTML = `<img src="retro-carta.webp">`;

    if (data.cpu != null)
      document.getElementById("cardCPU").innerHTML = `<img src="retro-carta.webp">`;

    if (
      !roundStarted &&
      data.locked === false &&
      data.player1Choice != null &&
      data.player2Choice != null
    ) {
      startRound();
      roundStarted = true;
    }
  });
}

// ===================== CHOOSE =====================
window.choose = function (value) {
  if (!roomData || roomData.locked) return;

  const path = playerNumber === 1 ? "player1Choice" : "player2Choice";

  update(ref(db, "rooms/" + roomCode), {
    [path]: value
  });
};

// ===================== ROUND =====================
function startRound() {

  roundActive = true;

  const cpu = Math.floor(Math.random() * 5) + 1;

  update(ref(db, "rooms/" + roomCode), {
    cpu,
    locked: true
  });

  document.getElementById("cardCPU").innerHTML =
    `<img src="retro-carta.webp">`;

  let countdown = 3;
  const el = document.getElementById("countdown");
  el.innerText = countdown;

  const interval = setInterval(() => {
    countdown--;

    if (countdown <= 0) {
      clearInterval(interval);
      el.innerText = "";
      reveal(cpu);
    } else {
      el.innerText = countdown;
    }
  }, 1000);
}

// ===================== REVEAL =====================
function reveal(cpu) {

  const c1 = roomData.player1Choice || 0;
  const c2 = roomData.player2Choice || 0;

  let s1 = roomData.score1;
  let s2 = roomData.score2;

  let result = "";

  const d1 = Math.abs(c1 - cpu);
  const d2 = Math.abs(c2 - cpu);

  if (d1 < d2) {
    s1++;
    result = "PLAYER 1 VINCE";
  } else if (d2 < d1) {
    s2++;
    result = "PLAYER 2 VINCE";
  } else {
    result = "PAREGGIO";
  }

  document.getElementById("cardP1").innerHTML = `<img src="carta-${c1}.webp">`;
  document.getElementById("cardP2").innerHTML = `<img src="carta-${c2}.webp">`;
  document.getElementById("cardCPU").innerHTML = `<img src="carta-${cpu}.webp">`;

  document.getElementById("result").innerText = result;

  let next = roomData.round + 1;

  update(ref(db, "rooms/" + roomCode), {
    score1: s1,
    score2: s2,
    player1Choice: null,
    player2Choice: null,
    cpu: null,
    locked: false,
    round: next
  });

  roundActive = false;
  roundStarted = false;
}
