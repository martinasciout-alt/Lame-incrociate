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
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

console.log("🔥 Firebase OK");

// ================= STATE =================
let roomCode = null;
let playerNumber = null;
let roomData = null;

let gameEnded = false;
let revealLock = false;

const MAX_ROUNDS = 3;

// ================= UI HELP =================
function show(el) {
  document.getElementById(el).style.display = "block";
}
function hide(el) {
  document.getElementById(el).style.display = "none";
}

// ================= START =================
window.enterGame = function () {
  hide("startScreen");
  show("game");
};

// ================= ROOM =================
window.createRoom = function (code) {
  if (!code) return alert("Codice stanza mancante");

  roomCode = code;
  playerNumber = 1;

  set(ref(db, "rooms/" + code), {
    player1Choice: null,
    player2Choice: null,
    score1: 0,
    score2: 0,
    round: 1,
    locked: false,
    cpuCard: null
  });

  listenRoom();
  renderHand();
};

window.joinRoom = function (code) {
  if (!code) return alert("Codice stanza mancante");

  roomCode = code;
  playerNumber = 2;

  listenRoom();
  renderHand();
};

// ================= HAND =================
function renderHand() {
  const hand = document.getElementById("hand");
  hand.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement("button");
   btn.innerHTML = `<img src="carta-${i}.webp" alt="carta ${i}">`;
    btn.onclick = () => choose(i);
    hand.appendChild(btn);
  }
}

// ================= LISTENER =================
function listenRoom() {
  if (!roomCode) return;

  const roomRef = ref(db, "rooms/" + roomCode);

  onValue(roomRef, (snap) => {
    const data = snap.val();

    if (!data) {
      console.log("Stanza vuota");
      return;
    }

    roomData = data;

    document.getElementById("score1").innerText = data.score1;
    document.getElementById("score2").innerText = data.score2;
    document.getElementById("round").innerText = data.round;
    document.getElementById("roomCode").innerText = roomCode;

    // reveal cards (simple)
    document.getElementById("cardP1").innerText = data.player1Choice || "";
    document.getElementById("cardP2").innerText = data.player2Choice || "";
    document.getElementById("cardCPU").innerText = data.cpuCard || "";

    if (
      data.player1Choice &&
      data.player2Choice &&
      !data.locked &&
      !gameEnded &&
      !revealLock
    ) {
      reveal(data);
    }
  });
}

// ================= CHOOSE =================
window.choose = function (value) {
  if (!roomData || !roomCode) return;

  const path =
    playerNumber === 1 ? "player1Choice" : "player2Choice";

  update(ref(db, "rooms/" + roomCode), {
    [path]: value
  });
};

// ================= REVEAL =================
function reveal(data) {
  revealLock = true;

  const cpu = Math.floor(Math.random() * 5) + 1;

  update(ref(db, "rooms/" + roomCode), {
    locked: true,
    cpuCard: cpu
  });

  setTimeout(() => {
    let c1 = data.player1Choice;
    let c2 = data.player2Choice;

    let s1 = data.score1;
    let s2 = data.score2;

    const d1 = Math.abs(c1 - cpu);
    const d2 = Math.abs(c2 - cpu);

    if (c1 === cpu) s2++;
    else if (c2 === cpu) s1++;
    else if (d1 < d2) s1++;
    else if (d2 < d1) s2++;

    const nextRound = data.round + 1;

    const end =
      s1 >= 2 || s2 >= 2 || nextRound > MAX_ROUNDS;

    update(ref(db, "rooms/" + roomCode), {
      score1: s1,
      score2: s2,
      round: nextRound,
      player1Choice: null,
      player2Choice: null,
      cpuCard: null,
      locked: false
    });

    revealLock = false;

    if (end) {
      gameEnded = true;
      alert(s1 > s2 ? "HAI VINTO" : "HAI PERSO");
    }

  }, 1200);
}
