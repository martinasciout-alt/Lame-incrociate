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
  storageBucket: "gioco-della-lama-alta.firebasestorage.app",
  messagingSenderId: "182282784891",
  appId: "1:182282784891:web:0503cff93af07a0ee8d2de"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =========================
// ROOM
// =========================
let roomCode = null;
let playerNumber = null;

// =========================
// GAME STATE
// =========================
let score1 = 0;
let score2 = 0;
let round = 1;
let locked = false;

// =========================
// AUDIO
// =========================
const clickSound = new Audio("carta.wav");
const drawSound = new Audio("pareggio.mp3");

// =========================
// MUSIC
// =========================
let musicStarted = false;

window.startMusic = function () {
  if (musicStarted) return;

  const bg = new Audio("sottofondo.mp3");
  bg.loop = true;
  bg.volume = 0.4;

  bg.play().then(() => {
    musicStarted = true;
  }).catch(() => {});
};

// =========================
// ROOM FUNCTIONS (IMPORTANTI)
// =========================
window.createRoom = function (code) {
  roomCode = code;
  playerNumber = 1;

  set(ref(db, "rooms/" + code), {
    player1Choice: null,
    player2Choice: null,
    score1: 0,
    score2: 0,
    round: 1
  });

  listenRoom();
};

window.joinRoom = function (code) {
  roomCode = code;
  playerNumber = 2;

  listenRoom();
};

// =========================
// FIREBASE LISTENER
// =========================
function listenRoom() {
  const roomRef = ref(db, "rooms/" + roomCode);

  onValue(roomRef, (snap) => {
    const data = snap.val();
    if (!data) return;

    score1 = data.score1 || 0;
    score2 = data.score2 || 0;
    round = data.round || 1;

    document.getElementById("score1").innerText = score1;
    document.getElementById("score2").innerText = score2;
    document.getElementById("round").innerText = round;

    if (data.player1Choice) {
      document.getElementById("cardP1").innerHTML =
        '<img src="retro-carta.webp">';
    }

    if (data.player2Choice) {
      document.getElementById("cardP2").innerHTML =
        '<img src="retro-carta.webp">';
    }

    if (data.player1Choice && data.player2Choice && !locked) {
      reveal(data);
    }
  });
}

// =========================
// CHOOSE CARD (FIX DEFINITIVO)
// =========================
window.choose = function (player, value) {
  if (!roomCode || locked) return;

  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});

  const path = player === 1 ? "player1Choice" : "player2Choice";

  update(ref(db, "rooms/" + roomCode), {
    [path]: value
  });

  if (player === 1) {
    document.getElementById("cardP1").innerHTML =
      '<img src="retro-carta.webp">';
  } else {
    document.getElementById("cardP2").innerHTML =
      '<img src="retro-carta.webp">';
  }
};

// =========================
// REVEAL
// =========================
function reveal(data) {
  locked = true;

  const c1 = data.player1Choice;
  const c2 = data.player2Choice;

  setTimeout(() => {

    document.getElementById("cardP1").innerHTML =
      `<img src="carta-${c1}.webp">`;

    document.getElementById("cardP2").innerHTML =
      `<img src="carta-${c2}.webp">`;

    const result = document.getElementById("result");

    if (c1 > c2) {
      score1++;
      result.innerText = "Player 1 vince!";
    } else if (c2 > c1) {
      score2++;
      result.innerText = "Player 2 vince!";
    } else {
      result.innerText = "Pareggio!";
      drawSound.play().catch(() => {});
    }

    update(ref(db, "rooms/" + roomCode), {
      score1,
      score2,
      player1Choice: null,
      player2Choice: null,
      round: round + 1
    });

    locked = false;

  }, 1000);
}

// =========================
// NEXT ROUND
// =========================
window.nextRound = function () {
  document.getElementById("cardP1").innerHTML = "";
  document.getElementById("cardP2").innerHTML = "";
  document.getElementById("result").innerText = "";
};

// =========================
// RESTART
// =========================
window.restartGame = function () {
  score1 = 0;
  score2 = 0;
  round = 1;
  locked = false;

  roomCode = null;
  playerNumber = null;

  document.getElementById("overlay").classList.add("hidden");
};
