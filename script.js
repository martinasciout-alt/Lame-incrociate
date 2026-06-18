import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// =========================
// FIREBASE
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyBzdhurbAi48OoRyw6eKJ3HIkd1q87-43c",
  authDomain: "gioco-della-lama-alta.firebaseapp.com",
  databaseURL: "https://gioco-della-lama-alta-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gioco-della-lama-alta",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =========================
// STATE
// =========================
let roomCode = null;
let playerNumber = null;
let roomData = null;

// =========================
// ROOM
// =========================
window.createRoom = function (code) {
  roomCode = code;
  playerNumber = 1;

  set(ref(db, "rooms/" + code), {
    player1Choice: null,
    player2Choice: null,
    score1: 0,
    score2: 0,
    round: 1,
    locked: false
  });

  listenRoom();
  renderHand();
};

window.joinRoom = function (code) {
  roomCode = code;
  playerNumber = 2;

  listenRoom();
  renderHand();
};

// =========================
// HAND (PRIVATA PER PLAYER)
// =========================
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

// =========================
// LISTENER FIREBASE
// =========================
function listenRoom() {
  const roomRef = ref(db, "rooms/" + roomCode);

  onValue(roomRef, (snap) => {
    const data = snap.val();
    if (!data) return;

    roomData = data;

    document.getElementById("score1").innerText = data.score1;
    document.getElementById("score2").innerText = data.score2;
    document.getElementById("round").innerText = data.round;

    document.getElementById("roomCode").innerText = roomCode;

    // COPERTE
    if (data.player1Choice) {
      document.getElementById("cardP1").innerHTML = `<img src="retro-carta.webp">`;
    } else {
      document.getElementById("cardP1").innerHTML = "";
    }

    if (data.player2Choice) {
      document.getElementById("cardP2").innerHTML = `<img src="retro-carta.webp">`;
    } else {
      document.getElementById("cardP2").innerHTML = "";
    }

    // REVEAL
    if (data.player1Choice && data.player2Choice && !data.locked) {
      reveal(data);
    }
  });
}

// =========================
// CHOOSE
// =========================
window.choose = function (value) {
  if (!roomData || roomData.locked) return;

  const path =
    playerNumber === 1 ? "player1Choice" : "player2Choice";

  update(ref(db, "rooms/" + roomCode), {
    [path]: value
  });
};

// =========================
// REVEAL (STABILE)
// =========================
function reveal(data) {

  update(ref(db, "rooms/" + roomCode), {
    locked: true
  });

  setTimeout(() => {

    const c1 = data.player1Choice;
    const c2 = data.player2Choice;

    document.getElementById("cardP1").innerHTML =
      `<img src="carta-${c1}.webp">`;

    document.getElementById("cardP2").innerHTML =
      `<img src="carta-${c2}.webp">`;

    let s1 = data.score1;
    let s2 = data.score2;

    if (c1 > c2) s1++;
    else if (c2 > c1) s2++;

    document.getElementById("result").innerText =
      c1 === c2 ? "Pareggio!" : (c1 > c2 ? "Player 1 vince!" : "Player 2 vince!");

    update(ref(db, "rooms/" + roomCode), {
      score1: s1,
      score2: s2,
      player1Choice: null,
      player2Choice: null,
      round: data.round + 1,
      locked: false
    });

  }, 1200);
}

// =========================
// RESET
// =========================
window.restartGame = function () {
  roomCode = null;
  playerNumber = null;
  roomData = null;
};

const bgMusic = new Audio("sottofondo.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;

let musicStarted = false;

window.startMusic = async function () {
  if (musicStarted) return;

  try {
    await bgMusic.play();
    musicStarted = true;
    console.log("🎵 Musica avviata");
  } catch (e) {
    console.log("❌ Musica bloccata:", e);
  }
};
