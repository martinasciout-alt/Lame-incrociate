console.log("SCRIPT CARICATO");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// FIREBASE
const firebaseConfig = {
  apiKey: "XXX",
  authDomain: "XXX",
  databaseURL: "XXX",
  projectId: "XXX",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// STATE
let roomCode = null;
let playerNumber = null;
let roomData = null;

let roundActive = false;
let countdownInterval = null;

// START
window.enterGame = function () {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

 console.log("ENTRATO NEL GIOCO");
 
};

// ROOM
window.createRoom = function (code) {
  if (!code) return alert("Inserisci codice stanza");

  roomCode = code;
  playerNumber = 1;

  set(ref(db, "rooms/" + code), {
    score1: 0,
    score2: 0,
    round: 1,
    player1Choice: null,
    player2Choice: null,
    cpu: null,
    locked: false
  });

  listen();
  renderHand();
};

window.joinRoom = function (code) {
  if (!code) return alert("Inserisci codice stanza");

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

    // SEMPRE COPERTE SUL TAVOLO
    document.getElementById("cardP1").innerHTML =
      data.player1Choice ? `<img src="retro-carta.webp">` : "";

    document.getElementById("cardP2").innerHTML =
      data.player2Choice ? `<img src="retro-carta.webp">` : "";

    document.getElementById("cardCPU").innerHTML =
      data.cpu ? `<img src="retro-carta.webp">` : "";

    // START ROUND SOLO UNA VOLTA
    if (
      !roundActive &&
      data.player1Choice !== null &&
      data.player2Choice !== null &&
      data.locked === false
    ) {
      startRound(data);
    }
  });
}

// CHOOSE
window.choose = function (value) {
  if (!roomData || roomData.locked) return;

  const path =
    playerNumber === 1 ? "player1Choice" : "player2Choice";

  update(ref(db, "rooms/" + roomCode), {
    [path]: value
  });
};

// ROUND START
function startRound(data) {

  roundActive = true;

  const cpu = Math.floor(Math.random() * 5) + 1;

  update(ref(db, "rooms/" + roomCode), {
    cpu: cpu,
    locked: true
  });

  // TIMER VISIVO
  let countdown = 3;
  const el = document.getElementById("countdown");
  el.innerText = countdown;

  countdownInterval = setInterval(() => {
    countdown--;
    el.innerText = countdown;

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      reveal(cpu);
    }
  }, 1000);

  // TIMEOUT SCELTA (chi non sceglie = 0)
  setTimeout(() => {

    const updates = {};

    if (!roomData.player1Choice) updates.player1Choice = 0;
    if (!roomData.player2Choice) updates.player2Choice = 0;

    if (Object.keys(updates).length > 0) {
      update(ref(db, "rooms/" + roomCode), updates);
    }

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
    locked: false,
    round: roomData.round + 1
  });

  roundActive = false;
}
