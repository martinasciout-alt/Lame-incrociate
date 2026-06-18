import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyBzdhurbAi48OoRyw6JHIkd1q87-43c",
  authDomain: "gioco-della-lama-alta.firebaseapp.com",
  databaseURL: "https://gioco-della-lama-alta-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gioco-della-lama-alta",
  storageBucket: "gioco-della-lama-alta.appspot.com",
  messagingSenderId: "182282784891",
  appId: "1:182282784891:web:0503cff93af07a0ee8d2de"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= STATE =================
let roomCode = null;
let playerNumber = null;
let locked = false;

let score1 = 0;
let score2 = 0;
let round = 1;

// ================= MUSIC =================
const music = new Audio("sottofondo.mp3");
music.loop = true;

window.startMusic = () => music.play();

// ================= ROOM =================
window.createRoom = function(code) {
  if (!code) return;

  roomCode = code;
  playerNumber = 1;

  set(ref(db, "rooms/" + code), {
    p1: null,
    p2: null,
    score1: 0,
    score2: 0,
    round: 1
  });

  document.getElementById("roomCode").innerText = code;

  listenRoom();
};

window.joinRoom = function(code) {
  roomCode = code;
  playerNumber = 2;

  document.getElementById("roomCode").innerText = code;

  listenRoom();
};

// ================= LISTENER =================
function listenRoom() {
  const r = ref(db, "rooms/" + roomCode);

  onValue(r, (snap) => {
    const d = snap.val();
    if (!d) return;

    score1 = d.score1;
    score2 = d.score2;
    round = d.round;

    document.getElementById("score1").innerText = score1;
    document.getElementById("score2").innerText = score2;
    document.getElementById("round").innerText = round;

    if (d.p1) {
      document.getElementById("cardP1").innerHTML = `<img src="retro-carta.webp">`;
    }

    if (d.p2) {
      document.getElementById("cardP2").innerHTML = `<img src="retro-carta.webp">`;
    }

    if (d.p1 && d.p2 && !locked) reveal(d);
  });
}

// ================= CHOOSE =================
window.choose = function(player, value) {
  if (!roomCode || locked) return;

  const path = player === 1 ? "p1" : "p2";

  update(ref(db, "rooms/" + roomCode), {
    [path]: value
  });

  if (player === 1)
    document.getElementById("cardP1").innerHTML = `<img src="retro-carta.webp">`;
  else
    document.getElementById("cardP2").innerHTML = `<img src="retro-carta.webp">`;
};

// ================= REVEAL =================
function reveal(d) {
  locked = true;

  setTimeout(() => {
    const c1 = d.p1;
    const c2 = d.p2;

    document.getElementById("cardP1").innerHTML = `<img src="carta-${c1}.webp">`;
    document.getElementById("cardP2").innerHTML = `<img src="carta-${c2}.webp">`;

    const res = document.getElementById("result");

    if (c1 > c2) {
      score1++;
      res.innerText = "Player 1 vince!";
    } else if (c2 > c1) {
      score2++;
      res.innerText = "Player 2 vince!";
    } else {
      res.innerText = "Pareggio!";
    }

    update(ref(db, "rooms/" + roomCode), {
      score1,
      score2,
      p1: null,
      p2: null,
      round: round + 1
    });

    locked = false;
  }, 800);
}
