console.log("SCRIPT CARICATO");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// STATE
let roomCode = null;
let playerNumber = null;
let roomData = null;

let roundActive = false;
let roundStarted = false;

// START
window.enterGame = function () {
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("game").classList.remove("hidden");
};

// ROOM
window.createRoom = function (code) {
  roomCode = code;
  playerNumber = 1;

  set(ref(db, "rooms/" + code), {
    score1: 0,
    score2: 0,
    round: 1,
    player1Choice: null,
    player2Choice: null,
    cpu: null,
    locked: false,
    phase: "idle"
  });

  listen();
  renderHand();
};

window.joinRoom = function (code) {
  roomCode = code;
  playerNumber = 2;

  listen();
  renderHand();
};

// HAND
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

// LISTENER
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

    // CPU SEMPRE VISIBILE (COPERTA)
    if (data.cpu != null) {
      document.getElementById("cardCPU").innerHTML =
        `<img src="retro-carta.webp">`;
    }

    document.getElementById("cardP1").innerHTML =
      data.player1Choice != null ? `<img src="retro-carta.webp">` : "";

    document.getElementById("cardP2").innerHTML =
      data.player2Choice != null ? `<img src="retro-carta.webp">` : "";

    // START ROUND SOLO UNA VOLTA
    if (
      !roundStarted &&
      data.phase === "idle"
    ) {
      roundStarted = true;
      startRound();
    }
  });
}

// CHOOSE
window.choose = function (value) {
  if (!roomData || roomData.locked) return;

  const path = playerNumber === 1 ? "player1Choice" : "player2Choice";

  update(ref(db, "rooms/" + roomCode), {
    [path]: value
  });
};

// ROUND FLOW
function startRound() {

  roundActive = true;

  const cpu = Math.floor(Math.random() * 5) + 1;

  // CPU PRIMA
  update(ref(db, "rooms/" + roomCode), {
    cpu: cpu,
    phase: "waiting"
  });

  // countdown
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

  // timeout auto 0
  setTimeout(() => {
    const updates = {};

    if (roomData.player1Choice == null) updates.player1Choice = 0;
    if (roomData.player2Choice == null) updates.player2Choice = 0;

    update(ref(db, "rooms/" + roomCode), updates);
  }, 3000);
}

// REVEAL
function reveal(cpu) {

  const c1 = roomData.player1Choice || 0;
  const c2 = roomData.player2Choice || 0;

  document.getElementById("cardP1").innerHTML =
    `<img src="carta-${c1}.webp">`;

  document.getElementById("cardP2").innerHTML =
    `<img src="carta-${c2}.webp">`;

  document.getElementById("cardCPU").innerHTML =
    `<img src="carta-${cpu}.webp">`;

  let s1 = roomData.score1;
  let s2 = roomData.score2;

  const d1 = Math.abs(c1 - cpu);
  const d2 = Math.abs(c2 - cpu);

  if (c1 === cpu) s2++;
  else if (c2 === cpu) s1++;
  else if (d1 < d2) s1++;
  else if (d2 < d1) s2++;

  update(ref(db, "rooms/" + roomCode), {
    score1: s1,
    score2: s2,
    player1Choice: null,
    player2Choice: null,
    cpu: null,
    phase: "idle",
    round: roomData.round + 1
  });

  roundActive = false;
  roundStarted = false;
}
