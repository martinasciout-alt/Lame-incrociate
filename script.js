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
let roomCode;
let playerNumber;
let roomData;
let locked = false;

/* POPUP */
window.addEventListener("load", () => {
  const p=document.getElementById("popupRegole");
  const c=document.getElementById("chiudiPopup");
  const h=document.getElementById("helpButton");

  p.classList.remove("hidden");

  c.onclick=()=>p.classList.add("hidden");
  h.onclick=()=>p.classList.remove("hidden");
});

/* CREATE */
window.createRoom=()=>{
  roomCode=document.getElementById("roomInput").value;
  const name=document.getElementById("nickInput").value;
  const color=document.getElementById("colorInput").value;

  playerNumber=1;

  set(ref(db,"rooms/"+roomCode),{
    players:1,
    p1:name,
    p1Color:color,
    p2:null,
    score1:0,
    score2:0,
    round:1,
    state:"waiting",
    cpu:null
  });

  start();
};

/* JOIN */
window.joinRoom=()=>{
  roomCode=document.getElementById("roomInput").value;
  const name=document.getElementById("nickInput").value;
  const color=document.getElementById("colorInput").value;

  playerNumber=2;

  update(ref(db,"rooms/"+roomCode),{
    players:2,
    p2:name,
    p2Color:color,
    state:"playing"
  });

  start();
};

/* START */
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
    img.onclick=()=>pick(i);
    h.appendChild(img);
  }
}

/* PICK */
window.pick=(v)=>{
  if(!roomData || roomData.state!=="choose") return;

  update(ref(db,"rooms/"+roomCode),{
    [playerNumber===1?"p1c":"p2c"]:v
  });
};

/* LISTEN */
function listen(){
  onValue(ref(db,"rooms/"+roomCode),(s)=>{
    roomData=s.val();
    if(!roomData) return;

    document.getElementById("score1").innerText=roomData.score1;
    document.getElementById("score2").innerText=roomData.score2;
    document.getElementById("round").innerText=roomData.round;

    document.getElementById("p1Name").innerText=roomData.p1 || "";
    document.getElementById("p2Name").innerText=roomData.p2 || "";

    document.getElementById("p1Name").style.color=roomData.p1Color || "white";
    document.getElementById("p2Name").style.color=roomData.p2Color || "white";

    if(roomData.state==="playing" && !locked){
      locked=true;
      round();
    }

    render(roomData,true);
  });
}

/* ROUND */
function round(){
  if(roomData.players<2) return;

  update(ref(db,"rooms/"+roomCode),{
    cpu:Math.floor(Math.random()*5)+1,
    p1c:null,
    p2c:null,
    state:"choose"
  });

  countdown(5);
}

/* COUNTDOWN */
function countdown(t){
  let x=t;
  const cd=document.getElementById("countdown");

  const i=setInterval(()=>{
    cd.innerText=x;
    x--;

    if(x<0){
      clearInterval(i);
      reveal();
    }
  },1000);
}

/* SCORE */
function score(c,cpu){
  if(c===cpu) return 2;
  if(Math.abs(c-cpu)===1) return 1;
  return 0;
}

/* REVEAL */
function reveal(){
  let s1=roomData.score1;
  let s2=roomData.score2;

  const a=score(roomData.p1c,roomData.cpu);
  const b=score(roomData.p2c,roomData.cpu);

  if(a>b) s1+=a;
  if(b>a) s2+=b;

  update(ref(db,"rooms/"+roomCode),{
    score1:s1,
    score2:s2,
    round:roomData.round+1,
    state:"playing"
  });

  locked=false;
}

/* TABLE */
function render(d,hidden){

  const back=`<img src="retro-carta.webp">`;

  document.getElementById("cardCPU").innerHTML=
    hidden ? back : `<img src="carta-${d.cpu}.webp">`;

  document.getElementById("cardP1").innerHTML=
    hidden ? back : `<img src="carta-${d.p1c}.webp">`;

  document.getElementById("cardP2").innerHTML=
    hidden ? back : `<img src="carta-${d.p2c}.webp">`;
}
