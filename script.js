import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
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
let roundStarted = false;

/* ================= ROOM CREATE ================= */

window.createRoom = () => {
  roomCode = document.getElementById("roomInput").value;
  playerNumber = 1;

  set(ref(db,"rooms/"+roomCode),{
    score1:0,
    score2:0,
    round:1,
    cpu:null,
    p1:null,
    p2:null,
    state:"waiting",
    players:1
  });

  startGame();
};

/* ================= ROOM JOIN ================= */

window.joinRoom = () => {
  roomCode = document.getElementById("roomInput").value;
  playerNumber = 2;

  const roomRef = ref(db,"rooms/"+roomCode);

  onValue(roomRef,(snap)=>{
    const data = snap.val();
    if(!data) return;

    if(data.players === 1){
      update(roomRef,{
        players:2,
        state:"playing"
      });
    }
  },{onlyOnce:true});

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
    const btn = document.createElement("button");
    btn.innerText = "Carta " + i;
    btn.onclick = () => choose(i);
    hand.appendChild(btn);
  }
}

window.choose = (value)=>{
  if(!roomData || roomData.state !== "choosing") return;

  update(ref(db,"rooms/"+roomCode),{
    [playerNumber === 1 ? "p1" : "p2"]: value
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

    renderCards(
      roomData.p1,
      roomData.p2,
      roomData.cpu,
      roomData.state
    );

    // start round SOLO una volta
    if(roomData.state === "playing" && !roundStarted){
      roundStarted = true;
      startRound();
    }
  });
}

/* ================= ROUND ================= */

function startRound(){
  if(roomData.players < 2) return;

  update(ref(db,"rooms/"+roomCode),{
    cpu: Math.floor(Math.random()*5)+1,
    p1:null,
    p2:null,
    state:"choosing"
  });

  countdown(5);
}

/* ================= COUNTDOWN ================= */

function countdown(sec){
  let t = sec;
  const cd = document.getElementById("countdown");

  const int = setInterval(()=>{
    cd.innerText = t;
    t--;

    if(t < 0){
      clearInterval(int);
      reveal();
    }
  },1000);
}

/* ================= SCORE ================= */

function score(card, cpu){
  if(card === cpu) return 2;
  if(Math.abs(card - cpu) === 1) return 1;
  return 0;
}

/* ================= REVEAL ================= */

function reveal(){
  const r = roomData;

  let cpu = r.cpu;
  let p1 = r.p1;
  let p2 = r.p2;

  let s1 = r.score1;
  let s2 = r.score2;

  let sc1 = score(p1,cpu);
  let sc2 = score(p2,cpu);

  // CASE SPECIALE
  if(p1 === p2){
    document.getElementById("result").innerText =
      "Stessa carta → Madama Queen domina il round!";
  }
  else if(sc1 > sc2){
    s1 += sc1;
  }
  else if(sc2 > sc1){
    s2 += sc2;
  }
  else{
    document.getElementById("result").innerText =
      "Pareggio → Madama Queen vince il round!";
  }

  update(ref(db,"rooms/"+roomCode),{
    score1:s1,
    score2:s2,
    round:r.round + 1,
    state:"reveal"
  });

  setTimeout(()=>{
    roundStarted = false;
    startRound();
  },2000);
}

/* ================= CARDS DISPLAY ================= */

function renderCards(p1,p2,cpu,state){
  const back = `<img src="retro-carta.webp">`;

  if(state === "choosing"){
    document.getElementById("cardP1").innerHTML = back;
    document.getElementById("cardP2").innerHTML = back;
    document.getElementById("cardCPU").innerHTML = back;
    return;
  }

  document.getElementById("cardP1").innerHTML =
    p1 ? `<img src="carta-${p1}.webp">` : back;

  document.getElementById("cardP2").innerHTML =
    p2 ? `<img src="carta-${p2}.webp">` : back;

  document.getElementById("cardCPU").innerHTML =
    cpu ? `<img src="carta-${cpu}.webp">` : back;
}

/* ================= POPUP ================= */

const popup = document.getElementById("popupRegole");
const closeBtn = document.getElementById("chiudiPopup");
const helpBtn = document.getElementById("helpButton");

window.addEventListener("load",()=>{
  popup.style.display = "flex";
});

closeBtn.onclick = () => popup.style.display = "none";
helpBtn.onclick = () => popup.style.display = "flex";
