 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* ================= FIREBASE ================= */

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

/* ================= STATE ================= */

let roomCode = null;
let playerNumber = null;
let roomData = null;

let roundRunning = false;
let countdownInterval = null;

/* ================= UTIL ================= */

const CARD_BACK = "retro-carta.webp";

function cardImg(v){
  if(!v || v < 1 || v > 5) return CARD_BACK;
  return `carta-${v}.webp`;
}

/* ================= POPUP ================= */

window.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popupRegole");
  const closeBtn = document.getElementById("chiudiPopup");
  const helpBtn = document.getElementById("helpButton");

  closeBtn.onclick = () => popup.classList.add("hidden");
  helpBtn.onclick = () => popup.classList.remove("hidden");

  popup.classList.remove("hidden"); // sempre visibile all’inizio
});

/* ================= LOBBY ================= */

window.createRoom = async () => {
  roomCode = document.getElementById("roomInput").value;
  const name = document.getElementById("nickInput").value;

  playerNumber = 1;

  await set(ref(db, "rooms/" + roomCode), {
    players: 1,
    p1Name: name,
    p2Name: "",

    score1: 0,
    score2: 0,

    round: 1,
    maxRound: 3,

    cpu: 0,
    p1: 0,
    p2: 0,

    state: "waiting"
  });

  startGame();
};

window.joinRoom = async () => {
  roomCode = document.getElementById("roomInput").value;
  const name = document.getElementById("nickInput").value;

  playerNumber = 2;

  await update(ref(db, "rooms/" + roomCode), {
    players: 2,
    p2Name: name,
    state: "ready"
  });

  startGame();
};

/* ================= START GAME ================= */

function startGame(){
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  document.getElementById("roomCode").innerText = roomCode;

  listen();
  renderHand();
}

/* ================= HAND ================= */

function renderHand(){
  const hand = document.getElementById("hand");
  hand.innerHTML = "";

  for(let i=1;i<=5;i++){
    const img = document.createElement("img");
    img.src = `carta-${i}.webp`;
    img.className = "card-hand";

    img.onclick = () => choose(i);
    hand.appendChild(img);
  }
}

window.choose = async (v) => {
  if(!roomData || roomData.state !== "playing") return;

  await update(ref(db,"rooms/"+roomCode), {
    [playerNumber === 1 ? "p1" : "p2"]: v
  });
};

/* ================= LISTENER ================= */

function listen(){
  onValue(ref(db,"rooms/"+roomCode),(snap)=>{
    roomData = snap.val();
    if(!roomData) return;

    document.getElementById("score1").innerText = roomData.score1;
    document.getElementById("score2").innerText = roomData.score2;
    document.getElementById("round").innerText = roomData.round;

    renderTable(false);

    if(!roundRunning && roomData.players === 2 && roomData.state !== "round"){
      startRound();
    }
  });
}

/* ================= ROUND ================= */

function startRound(){
  if(roundRunning) return;
  roundRunning = true;

  update(ref(db,"rooms/"+roomCode), {
    cpu: Math.floor(Math.random()*5)+1,
    p1: 0,
    p2: 0,
    state: "playing"
  });

  countdown(5);
}

/* ================= COUNTDOWN ================= */

function countdown(t){
  const el = document.getElementById("countdown");
  let time = t;

  countdownInterval = setInterval(()=>{
    el.innerText = time;
    time--;

    if(time < 0){
      clearInterval(countdownInterval);
      reveal();
    }
  },1000);
}

/* ================= SCORE ================= */

function calc(p, cpu){
  if(p === cpu) return 2;
  if(Math.abs(p - cpu) === 1) return 1;
  return 0;
}

/* ================= REVEAL ================= */

async function reveal(){
  const r = roomData;

  let s1 = r.score1;
  let s2 = r.score2;

  const sc1 = calc(r.p1, r.cpu);
  const sc2 = calc(r.p2, r.cpu);

  if(sc1 > sc2) s1 += sc1;
  if(sc2 > sc1) s2 += sc2;

  const nextRound = r.round + 1;

  const finished = nextRound > r.maxRound;

  await update(ref(db,"rooms/"+roomCode), {
    score1: s1,
    score2: s2,
    round: nextRound,
    state: finished ? "finished" : "ready"
  });

  renderTable(true);

  if(finished){
    showWinner(s1, s2);
    return;
  }

  document.getElementById("result").innerHTML =
    `<button onclick="nextRound()">Nuovo Round</button>`;

  roundRunning = false;
}

/* ================= NEXT ROUND ================= */

window.nextRound = async () => {
  document.getElementById("result").innerHTML = "";
  startRound();
};

/* ================= WINNER ================= */

function showWinner(s1, s2){
  let msg = "";

  if(s1 > s2) msg = "Player 1 vince!";
  else if(s2 > s1) msg = "Player 2 vince!";
  else msg = "Pareggio! Madama Queen domina 👑";

  document.getElementById("result").innerHTML = `
    <h2>${msg}</h2>
    <button onclick="location.reload()">Torna alla lobby</button>
  `;
}

/* ================= TABLE ================= */

function renderTable(hidden){
  const cpu = hidden ? CARD_BACK : cardImg(roomData.cpu);
  const p1 = hidden ? CARD_BACK : cardImg(roomData.p1);
  const p2 = hidden ? CARD_BACK : cardImg(roomData.p2);

  document.getElementById("cardCPU").innerHTML = `<img src="${cpu}">`;
  document.getElementById("cardP1").innerHTML = `<img src="${p1}">`;
  document.getElementById("cardP2").innerHTML = `<img src="${p2}">`;
}
