 console.log("SCRIPT CARICATO");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= FIREBASE =================
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

// ================= STATE =================
let roomCode = null;
let playerNumber = null;
let roomData = null;

let roundActive = false;

// ================= RULES =================
window.showRules = () => {
  document.getElementById("rulesPopup").classList.remove("hidden");
};

window.closeRules = () => {
  document.getElementById("rulesPopup").classList.add("hidden");
};

// ================= ENTER GAME =================
window.enterGame = () => {
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
};

// ================= ROOM =================
window.createRoom = (code) => {
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

window.joinRoom = (code) => {
  roomCode = code;
  playerNumber = 2;

  listen();
  renderHand();
};

// ================= HAND =================
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

// ================= LISTENER =================
function listen() {
  onValue(ref(db, "rooms/" + roomCode), (snap) => {
    const data = snap.val();
    if (!data) return;

    roomData = data;

    document.getElementById("score1").innerText = data.score1;
    document.getElementById("score2").innerText = data.score2;
    document.getElementById("round").innerText = data.round;
    document.getElementById("roomCode").innerText = roomCode;

    // CARDS BACK
    document.getElementById("cardCPU").innerHTML =
      data.cpu ? `<img src="retro-carta.webp">` : "";

    document.getElementById("cardP1").innerHTML =
      data.player1Choice != null ? `<img src="retro-carta.webp">` : "";

    document.getElementById("cardP2").innerHTML =
      data.player2Choice != null ? `<img src="retro-carta.webp">` : "";

    // START ROUND SAFE
    if (
      !roundActive &&
      data.round <= data.maxRounds &&
      data.cpu === null &&
      data.player1Choice != null &&
      data.player2Choice != null
    ) {
      startRound();
    }

    // END GAME
    if (data.round > data.maxRounds) {
      showFinal(data);
    }
  });
}

// ================= CHOOSE =================
window.choose = (value) => {
  if (!roomData || roomData.locked) return;

  update(ref(db, "rooms/" + roomCode), {
    [playerNumber === 1 ? "player1Choice" : "player2Choice"]: value
  });
};

// ================= ROUND =================
function startRound() {

  roundActive = true;

  const cpu = Math.floor(Math.random() * 5) + 1;

  update(ref(db, "rooms/" + roomCode), {
    cpu,
    locked: true
  });

  let t = 3;
  document.getElementById("countdown").innerText = t;

  const interval = setInterval(() => {
    t--;
    document.getElementById("countdown").innerText = t;

    if (t <= 0) {
      clearInterval(interval);
      document.getElementById("countdown").innerText = "";
      reveal(cpu);
    }
  }, 1000);
}

// ================= REVEAL =================
function reveal(cpu) {

  const c1 = roomData.player1Choice || 0;
  const c2 = roomData.player2Choice || 0;

  let s1 = roomData.score1;
  let s2 = roomData.score2;

  const d1 = Math.abs(c1 - cpu);
  const d2 = Math.abs(c2 - cpu);

  if (d1 < d2) s1++;
  else if (d2 < d1) s2++;

  document.getElementById("cardCPU").innerHTML = `<img src="carta-${cpu}.webp">`;
  document.getElementById("cardP1").innerHTML = `<img src="carta-${c1}.webp">`;
  document.getElementById("cardP2").innerHTML = `<img src="carta-${c2}.webp">`;

  document.getElementById("result").innerText =
    d1 < d2 ? "P1 VINCE" : d2 < d1 ? "P2 VINCE" : "PAREGGIO";

  update(ref(db, "rooms/" + roomCode), {
    score1: s1,
    score2: s2,
    player1Choice: null,
    player2Choice: null,
    cpu: null,
    locked: false,
    round: roomData.round + 1
  });

  roundActive = false;
}

// ================= FINAL =================
function showFinal(data) {

  let msg =
    data.score1 > data.score2 ? "HAI VINTO" :
    data.score2 > data.score1 ? "HAI PERSO" :
    "PAREGGIO";

  document.getElementById("result").innerText = msg;
}
