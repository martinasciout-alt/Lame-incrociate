 console.log("SCRIPT CARICATO");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* FIREBASE */
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

/* STATE */
let roomCode = null;
let playerNumber = null;
let roomData = null;
let roundActive = false;

/* ================= RULES ================= */
function openRules(){
  document.getElementById("rulesModal").classList.add("show");
}

function closeRules(){
  document.getElementById("rulesModal").classList.remove("show");
}

function initRules(){
  const openBtn = document.getElementById("openRules");
  const closeBtn = document.getElementById("closeRules");

  openBtn?.addEventListener("click", openRules);
  closeBtn?.addEventListener("click", closeRules);

  openRules(); // APERTURA AUTOMATICA
}

/* ================= LOBBY -> GAME ================= */
function startGame(){
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  listen();
  renderHand();

  initRules();
}

/* CREATE */
window.createRoom = () => {
  roomCode = document.getElementById("roomInput").value;
  playerNumber = 1;

  set(ref(db,"rooms/"+roomCode),{
    score1:0,
    score2:0,
    round:1,
    maxRounds:3,
    player1Choice:null,
    player2Choice:null,
    cpu:null,
    locked:false
  });

  startGame();
};

/* JOIN */
window.joinRoom = () => {
  roomCode = document.getElementById("roomInput").value;
  playerNumber = 2;

  update(ref(db,"rooms/"+roomCode),{
    player2Name:"player"
  });

  startGame();
};

/* HAND */
function renderHand(){
  const hand = document.getElementById("hand");
  hand.innerHTML = "";

  for(let i=1;i<=5;i++){
    const btn = document.createElement("button");
    btn.innerHTML = "Carta " + i;
    btn.onclick = () => choose(i);
    hand.appendChild(btn);
  }
}

/* LISTENER */
function listen(){
  onValue(ref(db,"rooms/"+roomCode),(snap)=>{
    roomData = snap.val();
    if(!roomData) return;

    document.getElementById("score1").innerText = roomData.score1;
    document.getElementById("score2").innerText = roomData.score2;
    document.getElementById("round").innerText = roomData.round;
  });
}

/* CHOOSE */
window.choose = (v)=>{
  if(roomData?.locked) return;

  update(ref(db,"rooms/"+roomCode),{
    [playerNumber===1?"player1Choice":"player2Choice"]:v
  });
};
