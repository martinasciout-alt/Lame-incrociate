import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSy....",
  authDomain: "gioco-della-lama-alta.firebaseapp.com",
  databaseURL: "https://gioco-della-lama-alta-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gioco-della-lama-alta",
  appId: "1:182282784891:web:0503cff93af07a0ee8d2de"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let roomCode, playerNumber, roomData, lock=false;

/* POPUP */
document.addEventListener("DOMContentLoaded",()=>{
  const p=document.getElementById("popupRegole");
  const x=document.getElementById("chiudiPopup");
  const h=document.getElementById("helpButton");

  if(!sessionStorage.getItem("seen")){
    p.classList.remove("hidden");
    sessionStorage.setItem("seen","1");
  }

  x.onclick=()=>p.classList.add("hidden");
  h.onclick=()=>p.classList.remove("hidden");
});

/* CREATE */
window.createRoom=()=>{
  roomCode=document.getElementById("roomInput").value;
  playerNumber=1;

  set(ref(db,"rooms/"+roomCode),{
    p1:0,p2:0,cpu:0,
    score1:0,score2:0,
    round:1,
    state:"waiting",
    players:1
  });

  start();
};

/* JOIN */
window.joinRoom=()=>{
  roomCode=document.getElementById("roomInput").value;
  playerNumber=2;

  update(ref(db,"rooms/"+roomCode),{
    players:2,
    state:"playing"
  });

  start();
};

function start(){
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  document.getElementById("roomCode").innerText=roomCode;

  listen();
  hand();
}

/* HAND */
function hand(){
  const h=document.getElementById("hand");
  h.innerHTML="";

  for(let i=1;i<=5;i++){
    const img=document.createElement("img");
    img.src=`carta-${i}.webp`;
    img.className="card-hand";
    img.onclick=()=>choose(i);
    h.appendChild(img);
  }
}

window.choose=(v)=>{
  if(!roomData||roomData.state!=="choosing")return;

  update(ref(db,"rooms/"+roomCode),{
    [playerNumber===1?"p1":"p2"]:v
  });
};

/* LISTEN */
function listen(){
  onValue(ref(db,"rooms/"+roomCode),(snap)=>{
    roomData=snap.val();
    if(!roomData)return;

    document.getElementById("score1").innerText=roomData.score1;
    document.getElementById("score2").innerText=roomData.score2;
    document.getElementById("round").innerText=roomData.round;

    render(roomData);

    if(roomData.state==="playing"&&!lock){
      lock=true;
      round();
    }
  });
}

/* ROUND */
function round(){
  update(ref(db,"rooms/"+roomCode),{
    cpu:Math.floor(Math.random()*5)+1,
    p1:0,p2:0,
    state:"choosing"
  });

  render(roomData,true);
  countdown(5);
}

/* TIMER */
function countdown(t){
  const c=document.getElementById("countdown");
  let i=t;

  const x=setInterval(()=>{
    c.innerText=i--;
    if(i<0){
      clearInterval(x);
      reveal();
    }
  },1000);
}

/* SCORE */
function score(p,c){
  if(p===c)return 2;
  if(Math.abs(p-c)===1)return 1;
  return 0;
}

/* REVEAL */
function reveal(){
  let s1=roomData.score1;
  let s2=roomData.score2;

  let a=score(roomData.p1,roomData.cpu);
  let b=score(roomData.p2,roomData.cpu);

  if(a>b)s1+=a;
  if(b>a)s2+=b;

  const next=roomData.round+1;

  update(ref(db,"rooms/"+roomCode),{
    score1:s1,
    score2:s2,
    round:roomData.round,
    state:"waiting_next"
  });

  render(roomData,false);

  const r=document.getElementById("result");

  if(next>3){
    r.innerText = s1>s2 ? "Hai vinto!" : "Madama Queen vince!";
    return;
  }

  r.innerHTML=`<button id="next">Prossimo round</button>`;

  document.getElementById("next").onclick=()=>{
    update(ref(db,"rooms/"+roomCode),{
      round:next,
      state:"playing"
    });
    lock=false;
  };
}

/* RENDER SAFE */
function render(d,hide=false){
  const back=`<img src="retro-carta.webp">`;

  document.getElementById("cardCPU").innerHTML=
    hide?back:`<img src="carta-${d.cpu}.webp">`;

  document.getElementById("cardP1").innerHTML=
    hide?back:`<img src="carta-${d.p1}.webp">`;

  document.getElementById("cardP2").innerHTML=
    hide?back:`<img src="carta-${d.p2}.webp">`;
}
