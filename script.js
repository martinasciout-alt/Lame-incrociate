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
  appId: "1:182282784891:web:0503cff93af07a0ee8d2de"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* STATE */
let roomCode=null;
let playerNumber=null;
let data=null;
let running=false;

/* POPUP */
window.addEventListener("DOMContentLoaded",()=>{
  const p=document.getElementById("popupRegole");
  document.getElementById("chiudiPopup").onclick=()=>p.classList.add("hidden");
  document.getElementById("helpButton").onclick=()=>p.classList.remove("hidden");
  p.classList.remove("hidden");
});

/* CREATE */
window.createRoom=()=>{
  roomCode=document.getElementById("roomInput").value;
  playerNumber=1;

  set(ref(db,"rooms/"+roomCode),{
    p1:0,p2:0,cpu:0,
    score1:0,score2:0,
    round:1,max:3,
    state:"wait"
  });

  start();
};

/* JOIN */
window.joinRoom=()=>{
  roomCode=document.getElementById("roomInput").value;
  playerNumber=2;

  update(ref(db,"rooms/"+roomCode),{state:"ready"});
  start();
};

function start(){
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  listen();
  hand();
}

/* HAND */
function hand(){
  const h=document.getElementById("hand");
  h.innerHTML="";
  for(let i=1;i<=5;i++){
    let img=document.createElement("img");
    img.src=`carta-${i}.webp`;
    img.className="card-hand";
    img.onclick=()=>choose(i);
    h.appendChild(img);
  }
}

window.choose=(v)=>{
  update(ref(db,"rooms/"+roomCode),{
    [playerNumber==1?"p1":"p2"]:v
  });
};

/* LISTEN */
function listen(){
  onValue(ref(db,"rooms/"+roomCode),(snap)=>{
    data=snap.val();
    if(!data) return;

    document.getElementById("score1").innerText=data.score1;
    document.getElementById("score2").innerText=data.score2;
    document.getElementById("round").innerText=data.round;

    render(false);

    if(!running && data.p1 && data.p2){
      startRound();
    }
  });
}

/* ROUND */
function startRound(){
  running=true;

  update(ref(db,"rooms/"+roomCode),{
    cpu:Math.floor(Math.random()*5)+1,
    state:"play"
  });

  countdown(5);
}

function countdown(t){
  let el=document.getElementById("countdown");
  let i=t;

  let x=setInterval(()=>{
    el.innerText=i--;
    if(i<0){
      clearInterval(x);
      reveal();
    }
  },1000);
}

/* SCORE */
function s(p,c){
  if(p===c) return 2;
  if(Math.abs(p-c)==1) return 1;
  return 0;
}

/* REVEAL */
function reveal(){
  let s1=data.score1;
  let s2=data.score2;

  let a=s(data.p1,data.cpu);
  let b=s(data.p2,data.cpu);

  if(a>b) s1+=a;
  if(b>a) s2+=b;

  let next=data.round+1;

  update(ref(db,"rooms/"+roomCode),{
    score1:s1,
    score2:s2,
    round:next,
    p1:0,p2:0,
    state:"ready"
  });

  running=false;
}

/* RENDER */
function render(hide){
  const back="retro-carta.webp";

  document.getElementById("cardCPU").innerHTML=
    hide?`<img src="${back}">`:`<img src="carta-${data.cpu}.webp">`;

  document.getElementById("cardP1").innerHTML=
    hide?`<img src="${back}">`:`<img src="carta-${data.p1}.webp">`;

  document.getElementById("cardP2").innerHTML=
    hide?`<img src="${back}">`:`<img src="carta-${data.p2}.webp">`;
}
