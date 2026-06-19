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
// AUDIO
// =========================
const clickSound = new Audio("carta.wav");
const victorySound = new Audio("vittoria.mp3");
const drawSound = new Audio("pareggio.mp3");
const countdownSound = new Audio("countdown.mp3");

const bgMusic = new Audio("sottofondo.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;

let musicStarted = false;

// =========================
// STATE
// =========================
let roomCode = null;
let playerNumber = null;
let roomData = null;

let revealLock = false;

// =========================
// MUSIC
// =========================
window.startMusic = async function () {
  if (musicStarted) return;

  try {
    await bgMusic.play();
    musicStarted = true;
  } catch (e) {
    console.log(e);
  }
};

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
// HAND
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
    document.getElementById("cardP1").innerHTML =
      data.player1Choice ? `<img src="retro-carta.webp">` : "";

    document.getElementById("cardP2").innerHTML =
      data.player2Choice ? `<img src="retro-carta.webp">` : "";

    // REVEAL SAFE
    if (
      data.player1Choice &&
      data.player2Choice &&
      !data.locked &&
      !revealLock
    ) {
      reveal(data);
    }
  });
}

// =========================
// CHOOSE
// =========================
window.choose = function (value) {
  if (!roomData || roomData.locked) return;

  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});

  const path =
    playerNumber === 1 ? "player1Choice" : "player2Choice";

  update(ref(db, "rooms/" + roomCode), {
    [path]: value
  });
};

// =========================
// REVEAL STABILE
// =========================
function reveal(data) {

  revealLock = true;

  update(ref(db, "rooms/" + roomCode), {
    locked: true
  });

  // COUNTDOWN
  countdownSound.currentTime = 0;
  countdownSound.play().catch(() => {});

  const countdown = document.getElementById("countdown");

  countdown.innerText = "3";
  setTimeout(() => countdown.innerText = "2", 1000);
  setTimeout(() => countdown.innerText = "1", 2000);

  setTimeout(() => {

    countdown.innerText = "";

    const c1 = data.player1Choice;
    const c2 = data.player2Choice;

    document.getElementById("cardP1").innerHTML =
      `<img src="carta-${c1}.webp">`;

    document.getElementById("cardP2").innerHTML =
      `<img src="carta-${c2}.webp">`;

    let s1 = data.score1;
    let s2 = data.score2;

    const result = document.getElementById("result");

    if (c1 > c2) {
      s1++;
      result.innerText = "Player 1 vince!";
      victorySound.play().catch(() => {});
    } else if (c2 > c1) {
      s2++;
      result.innerText = "Player 2 vince!";
      victorySound.play().catch(() => {});
    } else {
      result.innerText = "Pareggio!";
      drawSound.play().catch(() => {});
    }

    update(ref(db, "rooms/" + roomCode), {
      score1: s1,
      score2: s2,
      player1Choice: null,
      player2Choice: null,
      round: data.round + 1,
      locked: false
    });

    // RESET VISIVO
    setTimeout(() => {
      document.getElementById("cardP1").innerHTML = "";
      document.getElementById("cardP2").innerHTML = "";
      document.getElementById("result").innerText = "";

    }, 2000);

    // RESET LOCK SICURO
    setTimeout(() => {
      revealLock = false;
    }, 2100);

  }, 3000);
}

// =========================
// RESET
// =========================
window.restartGame = function () {
  roomCode = null;
  playerNumber = null;
  roomData = null;
};
