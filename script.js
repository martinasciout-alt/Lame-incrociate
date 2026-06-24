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

// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSy....",
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

let nickname = "";
let color = "";

let roundActive = false;

// ================= CREATE / JOIN =================
window.createRoom = () => {

  roomCode = document.getElementById("roomInput").value;
  nickname = document.getElementById("nickInput").value;
  color = document.getElementById("colorInput").value;

  playerNumber = 1;

  set(ref(db, "rooms/" + roomCode), {
    score1: 0,
    score2: 0,
    round: 1,
    player1Name: nickname,
    player2Name: "",
    player1Color: color,
    player2Color: "",
    player1Choice: null,
    player2Choice: null,
    cpu: null,
    locked: false
  });

  startGame();
};

window.joinRoom = () => {

  roomCode = document.getElementById("roomInput").value;
  nickname = document.getElementById("nickInput").value;
  color = document.getElementById("colorInput").value;

  playerNumber = 2;

  update(ref(db, "rooms/" + roomCode), {
    player2Name: nickname,
    player2Color: color
  });

  startGame();
};

// ================= START =================
function startGame() {
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  listen();
  renderHand();
}

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

    const d = snap.val();
    if (!d) return;

    roomData = d;

    document.getElementById("score1").innerText = d.score1;
    document.getElementById("score2").innerText = d.score2;
    document.getElementById("round").innerText = d.round;

    // ===== DISPLAY CARDS =====
    document.getElementById("cardP1").innerHTML =
      d.player1Choice ? `<img src="retro-carta.webp">` : "";

    document.getElementById("cardP2").innerHTML =
      d.player2Choice ? `<img src="retro-carta.webp">` : "";

    document.getElementById("cardCPU").innerHTML =
      d.cpu ? `<img src="retro-carta.webp">` : "";

    // START ROUND AUTOMATIC
    if (
      !roundActive &&
      d.player1Choice != null &&
      d.player2Choice != null &&
      d.cpu == null
    ) {
      startRound();
    }
  });
}

// ================= CHOOSE =================
window.choose = (v) => {

  if (!roomData || roomData.locked) return;

  update(ref(db, "rooms/" + roomCode), {
    [playerNumber === 1 ? "player1Choice" : "player2Choice"]: v
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

  const c1 = roomData.player1Choice;
  const c2 = roomData.player2Choice;

  let s1 = roomData.score1;
  let s2 = roomData.score2;

  const d1 = Math.abs(c1 - cpu);
  const d2 = Math.abs(c2 - cpu);

  // ===== LOGICA NUOVA =====

  if (c1 === cpu) s1 += 2;
  if (c2 === cpu) s2 += 2;

  if (c1 !== cpu && c2 !== cpu) {

    if (d1 < d2) s1++;
    else if (d2 < d1) s2++;
    else {
      // PAREGGIO (stessa distanza)
    }
  }

  let winner =
    s1 > roomData.score1 ? roomData.player1Name :
    s2 > roomData.score2 ? roomData.player2Name :
    null;

  // ===== SHOW CARDS =====
  document.getElementById("cardCPU").innerHTML = `<img src="carta-${cpu}.webp">`;
  document.getElementById("cardP1").innerHTML = `<img src="carta-${c1}.webp">`;
  document.getElementById("cardP2").innerHTML = `<img src="carta-${c2}.webp">`;

  document.getElementById("result").innerText =
    winner ? `${winner} VINCE` : "PAREGGIO";

  // ===== RESET ROUND =====
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

// ================= LEADERBOARD =================
function updateLeaderboard() {}
