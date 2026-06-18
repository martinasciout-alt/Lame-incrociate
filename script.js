import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// =========================
// 🔥 FIREBASE
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// =========================
// 🏠 ROOM
// =========================
let roomCode = null;
let playerNumber = null;

// =========================
// 🎮 GAME STATE
// =========================
let score1 = 0;
let score2 = 0;
let round = 1;
let locked = false;

// =========================
// 🔊 AUDIO
// =========================
const bgMusic = new Audio("sottofondo.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;

const clickSound = new Audio("carta.wav");
clickSound.volume = 1;

const winSound = new Audio("vittoria.mp3");
winSound.volume = 1;

const drawSound = new Audio("pareggio.mp3");
drawSound.volume = 1;

const countdownSound = new Audio("countdown.mp3");
countdownSound.volume = 0.8;

let musicStarted = false;

// =========================
// 🎵 MUSIC
// =========================
window.startMusic = function () {
  if (musicStarted) return;

  bgMusic.play().then(() => {
    musicStarted = true;
  }).catch(() => {});
};

document.addEventListener("click", function firstMusic() {
  if (musicStarted) return;

  bgMusic.play().then(() => {
    musicStarted = true;
  }).catch(() => {});

  document.removeEventListener("click", firstMusic);
});

// =========================
// 🏠 ROOM CREATE / JOIN
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
// 👂 FIREBASE LISTENER
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

    // retro carte mentre si gioca
    if (data.player1Choice) {
      document.getElementById("cardP1").innerHTML =
        '<img src="retro-carta.webp">';
    }

    if (data.player2Choice) {
      document.getElementById("cardP2").innerHTML =
        '<img src="retro-carta.webp">';
    }

    // reveal automatico
    if (data.player1Choice && data.player2Choice && !locked) {
      revealOnline(data);
    }
  });
}

// =========================
// 🃏 CHOOSE CARD
// =========================
window.choose = function (player, value) {
  if (!roomCode || locked) return;

  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});

  const path =
    player === 1 ? "player1Choice" : "player2Choice";

  update(ref(db, "rooms/" + roomCode), {
    [path]: value
  });

  // UI locale
  if (player === 1) {
    document.getElementById("cardP1").innerHTML =
      '<img src="retro-carta.webp">';
  } else {
    document.getElementById("cardP2").innerHTML =
      '<img src="retro-carta.webp">';
  }
};

// =========================
// 🎴 REVEAL
// =========================
function revealOnline(data) {
  locked = true;

  const c1 = data.player1Choice;
  const c2 = data.player2Choice;

  setTimeout(() => {

    document.getElementById("cardP1").innerHTML =
      `<img src="carta-${c1}.webp">`;

    document.getElementById("cardP2").innerHTML =
      `<img src="carta-${c2}.webp">`;

    if (c1 > c2) {
      score1++;
      document.getElementById("result").innerText = "Player 1 vince!";
    } 
    else if (c2 > c1) {
      score2++;
      document.getElementById("result").innerText = "Player 2 vince!";
    } 
    else {
      document.getElementById("result").innerText = "Pareggio!";
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
// 🔄 NEXT ROUND
// =========================
window.nextRound = function () {
  document.getElementById("cardP1").innerHTML = "";
  document.getElementById("cardP2").innerHTML = "";
  document.getElementById("result").innerText = "";
};

// =========================
// 🔁 RESTART
// =========================
window.restartGame = function () {
  score1 = 0;
  score2 = 0;
  round = 1;
  locked = false;

  document.getElementById("overlay").classList.add("hidden");
};
