import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  get
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
let roomCode=null;
let playerNumber=null;
let roomData=null;
let roundRunning=false;

/* ================= POPUP ================= */

window.addEventListener("load", () => {
  const popup=document.getElementById("popupRegole");
  const close=document.getElementById("chiudiPopup");
  const help=document.getElementById("helpButton");

  popup.classList.remove("hidden");

  close.onclick=()=>popup.classList.add("hidden");
  help.onclick=()=>popup.classList.remove("hidden");
});

/* ================= ROOM ================= */

window.createRoom=()=>{
  roomCode=document.getElementById("roomInput").value;
  playerNumber=1;

  set(ref(db,"rooms/"+roomCode),{
    players:1,
    score1:0,
    score2:0,
    round:1,
    state:"waiting",
    cpu:null,
    p1:null,
    p2:null
  });

  startGame();
};

window.joinRoom=()=>{
  roomCode=document.getElementById("roomInput").value;
  playerNumber=2;

  update(ref(db,"rooms/"+roomCode),{
    players:2,
    state:"playing"
  });

  startGame();
};

/* ================= START ================= */

function startGame(){
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  document.getElementById("roomCode").innerText=roomCode;

  listen();
  renderHand();
}

/* ================= HAND ================= */

function renderHand(){
  const hand=document.getElementById("hand");
  hand.innerHTML="";

  for(let i=1;i<=5;i++){
    const img=document.createElement("img");
    img.src=`carta-${i}.webp`;
    img.className="card-hand";
    img.onclick=()=>choose(i);
    hand.appendChild(img);
  }
}

window.choose=(v)=>{
  if(!roomData || roomData.state!=="choosing") return;

  update(ref(db,"rooms/"+roomCode),{
    [playerNumber===1?"p1":"p2"]:v
  });
};

/* ================= LISTEN ================= */

function listen(){
  onValue(ref(db,"rooms/"+roomCode),(snap)=>{
    roomData=snap.val();
    if(!roomData) return;

    document.getElementById("score1").innerText=roomData.score1;
    document.getElementById("score2").innerText=roomData.score2;
    document.getElementById("round").innerText=roomData.round;

    if(roomData.state==="playing" && !roundRunning){
      roundRunning=true;
      startRound();
    }

    renderTable(roomData,false);
  });
}

/* ================= ROUND ================= */

function startRound(){
  if(roomData.players<2) return;

  update(ref(db,"rooms/"+roomCode),{
    cpu:Math.floor(Math.random()*5)+1,
    p1:null,
    p2:null,
    state:"choosing"
  });

  countdown(5);
}

/* ================= COUNTDOWN ================= */

function countdown(t){
  const cd=document.getElementById("countdown");

  let time=t;
  const int=setInterval(()=>{
    cd.innerText=time;
    time--;

    if(time<0){
      clearInterval(int);
      reveal();
    }
  },1000);
}

/* ================= SCORE ================= */

function score(c,cpu){
  if(c===cpu) return 2;
  if(Math.abs(c-cpu)===1) return 1;
  return 0;
}

/* ================= REVEAL ================= */

function reveal(){
  const r=roomData;

  let s1=r.score1;
  let s2=r.score2;

  if(score(r.p1,r.cpu)>score(r.p2,r.cpu)) s1+=score(r.p1,r.cpu);
  if(score(r.p2,r.cpu)>score(r.p1,r.cpu)) s2+=score(r.p2,r.cpu);

  update(ref(db,"rooms/"+roomCode),{
    score1:s1,
    score2:s2,
    round:r.round+1,
    state:"playing"
  });

  roundRunning=false;
}

/* ================= TABLE ================= */

function renderTable(data){

  const back=`<img src="retro-carta.webp">`;

  document.getElementById("cardCPU").innerHTML =
    data.cpu ? `<img src="carta-${data.cpu}.webp">` : back;

  document.getElementById("cardP1").innerHTML =
    data.p1 ? back : back;

  document.getElementById("cardP2").innerHTML =
    data.p2 ? back : back;
}
