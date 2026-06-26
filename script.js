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
  projectId: "gioco-della-lama-alta"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let roomCode, playerNumber, roomData;
let locked = false;

/* POPUP */
window.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popupRegole");
  const close = document.getElementById("chiudiPopup");
  const help = document.getElementById("helpButton");

  popup.classList.remove("hidden");

  close.onclick = () => popup.classList.add("hidden");
  help.onclick = () => popup.classList.remove("hidden");
});

/* ROOM */
window.createRoom = () => {
  roomCode = roomInput.value;
  playerNumber = 1;

  set(ref(db,"rooms/"+roomCode),{
    p1:0,p2:0,
    score1:0,score2:0,
    round:1,
    state:"waiting",
    cpu:0
  });

  start();
};

window.joinRoom = () => {
  roomCode = roomInput.value;
  playerNumber = 2;

  update(ref(db,"rooms/"+roomCode),{state:"playing"});
  start();
};

function start(){
  lobby.classList.add("hidden");
  game.classList.remove("hidden");

  roomCodeEl.textContent = roomCode;

  listen();
  renderHand();
}

/* HAND */
function renderHand(){
  hand.innerHTML = "";
  for(let i=1;i<=5;i++){
    let img = document.createElement("img");
    img.src = `carta-${i}.webp`;
    img.className = "card-hand";
    img.onclick = () => choose(i);
    hand.appendChild(img);
  }
}

/* CHOOSE */
window.choose = (v)=>{
  if(roomData?.state !== "choose") return;

  update(ref(db,"rooms/"+roomCode),{
    [playerNumber===1?"p1":"p2"]:v
  });
};

/* LISTEN */
function listen(){
  onValue(ref(db,"rooms/"+roomCode),(snap)=>{
    roomData = snap.val();
    if(!roomData) return;

    score1.textContent = roomData.score1;
    score2.textContent = roomData.score2;
    round.textContent = roomData.round;

    if(roomData.state==="playing" && !locked){
      locked = true;
      roundStart();
    }

    render(roomData);
  });
}

/* ROUND */
function roundStart(){

  update(ref(db,"rooms/"+roomCode),{
    cpu: Math.floor(Math.random()*5)+1,
    p1:0,p2:0,
    state:"choose"
  });

  countdown(5);
}

/* COUNTDOWN */
function countdown(t){
  let cd = setInterval(()=>{
    countdownEl.textContent = t;
    t--;

    if(t<0){
      clearInterval(cd);
      reveal();
    }
  },1000);
}

/* SCORE */
function calc(c,cpu){
  if(c===cpu) return 2;
  if(Math.abs(c-cpu)===1) return 1;
  return 0;
}

/* REVEAL */
function reveal(){
  let s1 = roomData.score1;
  let s2 = roomData.score2;

  let a = calc(roomData.p1,roomData.cpu);
  let b = calc(roomData.p2,roomData.cpu);

  if(a>b) s1+=a;
  if(b>a) s2+=b;

  update(ref(db,"rooms/"+roomCode),{
    score1:s1,
    score2:s2,
    state:"playing",
    round:roomData.round+1
  });

  locked = false;
}

/* RENDER */
function render(d){
  cardCPU.innerHTML = d.cpu ? `<img src="carta-${d.cpu}.webp">` : `<img src="retro-carta.webp">`;
  cardP1.innerHTML = d.p1 ? `<img src="retro-carta.webp">` : `<img src="retro-carta.webp">`;
  cardP2.innerHTML = d.p2 ? `<img src="retro-carta.webp">` : `<img src="retro-carta.webp">`;
}
