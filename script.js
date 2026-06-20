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
  apiKey: "AIzaSyBzdhurbAi48OoRyw6E3HIkd1q87-43c",
  authDomain: "gioco-della-lama-alta.firebaseapp.com",
  databaseURL: "https://gioco-della-lama-alta-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gioco-della-lama-alta",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =========================
// AUDIO (INVARIATO)
// =========================
const clickSound = new Audio("carta.wav");
const victorySound = new Audio("vittoria.mp3");
const drawSound = new Audio("pareggio.mp3");
const countdownSound = new Audio("countdown.mp3");
const winFinalSound = new Audio("finale.wav");
const loseFinalSound = new Audio("sconfitta (2).mp3");

const bgMusic = new Audio("sottofondo.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;

// =========================
// STATE
// =========================
let roomCode = null;
let playerNumber = null;
let roomData = null;

let revealLock = false;
let gameEnded = false;
let revealInProgress = false;
let lastProcessedRound = 0;

const MAX_ROUNDS = 3;

// =========================
// MUSIC
// =========================
window.startMusic = async function () {
  try {
    await bgMusic.play();
  } catch {}
};

// =========================
// START GAME
// =========================
window.enterGame = function () {
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("game").style.display = "block";
  startMusic();
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
    locked: false,
    cpuCard: null,
    p1Marks: [],
    p2Marks: []
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
// LISTENER
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

    document.getElementById("marks1").innerHTML = (data.p1Marks || []).join(" ");
    document.getElementById("marks2").innerHTML = (data.p2Marks || []).join(" ");

    requestAnimationFrame(() => {
      document.getElementById("cardP1").innerHTML =
        data.player1Choice ? `<img src="retro-carta.webp">` : "";

      document.getElementById("cardP2").innerHTML =
        data.player2Choice ? `<img src="retro-carta.webp">` : "";

      document.getElementById("cardCPU").innerHTML =
        data.cpuCard ? `<img src="retro-carta.webp">` : "";
    });

    if (
      data.player1Choice &&
      data.player2Choice &&
      !data.locked &&
      !gameEnded &&
      !revealInProgress &&
      data.round !== lastProcessedRound
    ) {
      revealInProgress = true;
      lastProcessedRound = data.round;
      reveal(data);
    }
  });
}

// =========================
// CHOOSE
// =========================
window.choose = function (value) {
  if (!roomData || roomData.locked || gameEnded) return;

  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});

  const path = playerNumber === 1 ? "player1Choice" : "player2Choice";

  update(ref(db, "rooms/" + roomCode), {
    [path]: value
  });
};

// =========================
// CPU
// =========================
function generateCPU() {
  return Math.floor(Math.random() * 5) + 1;
}

// =========================
// REVEAL (NUOVO SISTEMA)
// =========================
function reveal(data) {
  if (revealLock) return;

  revealLock = true;
  revealInProgress = true;

  const cpu = generateCPU();

  update(ref(db, "rooms/" + roomCode), {
    locked: true,
    cpuCard: cpu
  });

  const c1 = data.player1Choice;
  const c2 = data.player2Choice;

  document.getElementById("cardP1").innerHTML = `<img src="carta-${c1}.webp">`;
  document.getElementById("cardP2").innerHTML = `<img src="carta-${c2}.webp">`;
  document.getElementById("cardCPU").innerHTML = `<img src="carta-${cpu}.webp">`;

  const countdown = document.getElementById("countdown");

  countdownSound.currentTime = 0;
  countdownSound.play().catch(() => {});

  countdown.innerText = "3";
  setTimeout(() => countdown.innerText = "2", 1000);
  setTimeout(() => countdown.innerText = "1", 2000);

  setTimeout(() => {

    countdown.innerText = "";

    let s1 = data.score1;
    let s2 = data.score2;

    let p1Marks = data.p1Marks || [];
    let p2Marks = data.p2Marks || [];

    let cpuVal = cpu;

    const dist1 = Math.abs(c1 - cpuVal);
    const dist2 = Math.abs(c2 - cpuVal);

    // ❌ regola: stessa carta del CPU = perdita automatica
    let p1Invalid = c1 === cpuVal;
    let p2Invalid = c2 === cpuVal;

    if (p1Invalid && !p2Invalid) {
      s2++;
      p1Marks.push("❌");
    } else if (p2Invalid && !p1Invalid) {
      s1++;
      p2Marks.push("❌");
    } else if (p1Invalid && p2Invalid) {
      p1Marks.push("❌");
      p2Marks.push("❌");
    } else {
      // più vicino vince
      if (dist1 < dist2) {
        s1++;
        p2Marks.push("❌");
        victorySound.play().catch(() => {});
      } else if (dist2 < dist1) {
        s2++;
        p1Marks.push("❌");
        victorySound.play().catch(() => {});
      } else {
        p1Marks.push("❌");
        p2Marks.push("❌");
        drawSound.play().catch(() => {});
      }
    }

    const nextRound = data.round + 1;
    const isGameOver = (s1 >= 2 || s2 >= 2 || data.round >= MAX_ROUNDS);

    update(ref(db, "rooms/" + roomCode), {
      score1: s1,
      score2: s2,
      player1Choice: null,
      player2Choice: null,
      round: nextRound,
      locked: false,
      cpuCard: null,
      p1Marks,
      p2Marks
    });

    setTimeout(() => {

      document.getElementById("cardP1").innerHTML = "";
      document.getElementById("cardP2").innerHTML = "";
      document.getElementById("cardCPU").innerHTML = "";
      document.getElementById("result").innerText = "";

      revealLock = false;
      revealInProgress = false;

      if (isGameOver) {
        endGame(s1, s2);
      }

    }, 4000);

  }, 3000);
}

// =========================
// END GAME
// =========================
function endGame(s1, s2) {
  gameEnded = true;

  const overlay = document.getElementById("overlay");
  const finalText = document.getElementById("finalText");

  overlay.classList.remove("hidden");

  let win =
    (playerNumber === 1 && s1 > s2) ||
    (playerNumber === 2 && s2 > s1);

  finalText.innerText =
    win ? "🏆 HAI VINTO!" :
    "💀 HAI PERSO!";

  bgMusic.pause();

  if (s1 === s2) {
    drawSound.play().catch(() => {});
  } else if (win) {
    winFinalSound.play().catch(() => {});
  } else {
    loseFinalSound.play().catch(() => {});
  }
}

// =========================
// RESTART
// =========================
window.restartGame = function () {

  if (!roomCode) return;

  update(ref(db, "rooms/" + roomCode), {
    player1Choice: null,
    player2Choice: null,
    score1: 0,
    score2: 0,
    round: 1,
    locked: false,
    cpuCard: null,
    p1Marks: [],
    p2Marks: []
  });

  roomData = null;
  revealLock = false;
  gameEnded = false;
  revealInProgress = false;
  lastProcessedRound = 0;

  document.getElementById("overlay").classList.add("hidden");
  document.getElementById("result").innerText = "";
  document.getElementById("cardP1").innerHTML = "";
  document.getElementById("cardP2").innerHTML = "";
  document.getElementById("cardCPU").innerHTML = "";
  document.getElementById("countdown").innerText = "In attesa...";

  renderHand();
};
