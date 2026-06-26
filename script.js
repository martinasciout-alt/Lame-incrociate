import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSy....", // Inserisci la tua chiave qui
  authDomain: "gioco-della-lama-alta.firebaseapp.com",
  databaseURL: "https://gioco-della-lama-alta-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gioco-della-lama-alta"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* STATE */
let roomCode, playerNumber, roomData;
let timer = null;
let currentRoundLocal = 0; 

/* DOM */
const lobby = document.getElementById("lobby");
const game = document.getElementById("game");
const hand = document.getElementById("hand");

const score1 = document.getElementById("score1");
const score2 = document.getElementById("score2");
const round = document.getElementById("round");
const countdownEl = document.getElementById("countdown");

const cardCPU = document.getElementById("cardCPU");
const cardP1 = document.getElementById("cardP1");
const cardP2 = document.getElementById("cardP2");

const roomCodeEl = document.getElementById("roomCode");
const playerLabel = document.getElementById("playerLabel");
const resultEl = document.getElementById("result");
const leaderboardEl = document.getElementById("leaderboard");

// Creiamo dinamicamente il tasto "Prossimo Round" per l'Host
const nextRoundBtn = document.createElement("button");
nextRoundBtn.id = "nextRoundBtn";
nextRoundBtn.textContent = "Prossimo Round";
nextRoundBtn.style.display = "none";
nextRoundBtn.onclick = () => advanceRound();

/* POPUP REGOLE */
window.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popupRegole");
  const close = document.getElementById("chiudiPopup");
  const help = document.getElementById("helpButton");

  if (popup) popup.classList.remove("hidden");
  if (close) close.onclick = () => popup.classList.add("hidden");
  if (help) help.onclick = () => popup.classList.remove("hidden");
  
  // Inseriamo il pulsante sotto al box dei risultati nel DOM
  document.getElementById("game").appendChild(nextRoundBtn);

  loadLeaderboard();
});

/* CARICA CLASSIFICA GLOBALE */
function loadLeaderboard() {
  onValue(ref(db, "leaderboard"), (snap) => {
    const data = snap.val();
    if (!data) {
      leaderboardEl.innerHTML = "<p>Nessun punteggio registrato</p>";
      return;
    }
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    leaderboardEl.innerHTML = sorted
      .map(([name, score]) => `<p>🏆 <strong>${name}</strong>: ${score} pt</p>`)
      .join("");
  });
}

/* AGGIORNA CLASSIFICA GLOBALE A FINE PARTITA */
function updateLeaderboard(winnerName, points) {
  if (!winnerName || winnerName === "In attesa...") return;
  const userRef = ref(db, `leaderboard/${winnerName}`);
  get(userRef).then((snapshot) => {
    const currentScore = snapshot.val() || 0;
    set(userRef, currentScore + points);
  });
}

/* CREATE ROOM (PLAYER 1) */
window.createRoom = () => {
  roomCode = document.getElementById("roomInput").value.trim();
  const nick = document.getElementById("nickInput").value.trim() || "P1";
  const color = document.getElementById("colorInput").value;

  if (!roomCode) return alert("Inserisci il nome della stanza!");

  playerNumber = 1;

  set(ref(db, "rooms/" + roomCode), {
    p1Name: nick,
    p1Color: color,
    p2Name: "In attesa...",
    p2Color: "#ffffff",
    p1: null,
    p2: null,
    score1: 0,
    score2: 0,
    round: 1,
    state: "waiting", 
    cpu: null
  }).then(() => {
    start();
  });
};

/* JOIN ROOM (PLAYER 2) */
window.joinRoom = () => {
  roomCode = document.getElementById("roomInput").value.trim();
  const nick = document.getElementById("nickInput").value.trim() || "P2";
  const color = document.getElementById("colorInput").value;

  if (!roomCode) return alert("Inserisci il nome della stanza!");

  playerNumber = 2;

  // Quando entra P2, impostiamo la CPU e lanciamo direttamente lo stato "choose"
  update(ref(db, "rooms/" + roomCode), {
    p2Name: nick,
    p2Color: color,
    cpu: Math.floor(Math.random() * 5) + 1,
    state: "choose" 
  }).then(() => {
    start();
  });
};

/* START INTERFACCIA */
function start() {
  lobby.classList.add("hidden");
  game.classList.remove("hidden");
  roomCodeEl.textContent = roomCode;
  
  renderHand();
  listen();
}

/* MANO DEL GIOCATORE */
function renderHand() {
  hand.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const img = document.createElement("img");
    img.src = `carta-${i}.webp`;
    img.className = "card-hand";
    img.onclick = () => choose(i);
    hand.appendChild(img);
  }
}

/* SELEZIONE CARTA */
window.choose = (v) => {
  if (!roomData) return;
  if (roomData.state !== "choose") return;

  const field = playerNumber === 1 ? "p1" : "p2";
  if (roomData[field] !== null) return; 

  update(ref(db, "rooms/" + roomCode), {
    [field]: v
  });
};

/* SINCRO IN TEMPO REALE (LISTEN) */
function listen() {
  onValue(ref(db, "rooms/" + roomCode), (snap) => {
    roomData = snap.val();
    if (!roomData) return;

    playerLabel.innerHTML = `Stai giocando come: <span style="color:${playerNumber === 1 ? roomData.p1Color : roomData.p2Color}">${playerNumber === 1 ? roomData.p1Name : roomData.p2Name}</span>`;
    
    score1.innerHTML = `<span style="color:${roomData.p1Color}">${roomData.p1Name}</span>: ${roomData.score1}`;
    score2.innerHTML = `<span style="color:${roomData.p2Color}">${roomData.p2Name}</span>: ${roomData.score2}`;
    round.textContent = roomData.round;

    // Gestione del timer nella fase "choose"
    if (roomData.state === "choose") {
      nextRoundBtn.style.display = "none"; // Nascondi il tasto durante la scelta
      if (!timer) {
        countdown(5);
      }
      // Se entrambi scelgono prima del tempo, l'host calcola subito ed esegue il reveal
      if (roomData.p1 !== null && roomData.p2 !== null) {
        clearInterval(timer);
        timer = null;
        if (playerNumber === 1) calculateScores();
      }
    }

    // Mostra il tasto prossimo round nella fase "reveal" (Solo per il Giocatore 1 / Host)
    if (roomData.state === "reveal") {
      clearInterval(timer);
      timer = null;
      countdownEl.textContent = "-";
      if (playerNumber === 1) {
        nextRoundBtn.style.display = "block";
      }
    } else {
      if (playerNumber === 1) nextRoundBtn.style.display = "none";
    }

    render(roomData);
  });
}

/* COUNTDOWN */
function countdown(t) {
  clearInterval(timer);
  countdownEl.textContent = t;

  timer = setInterval(() => {
    t--;
    if (t >= 0) {
      countdownEl.textContent = t;
    }

    if (t < 0) {
      clearInterval(timer);
      timer = null;
      // Allo scadere del tempo l'host forza il calcolo dei punteggi
      if (playerNumber === 1) {
        calculateScores();
      }
    }
  }, 1000);
}

/* REGOLA CALCOLO PUNTI */
function calc(c, cpu) {
  if (c === null || c === undefined || !cpu) return 0;
  if (c === cpu) return 2;
  if (Math.abs(c - cpu) === 1) return 1;
  return 0;
}

/* CALCOLO PUNTI E PASSAGGIO A REVEAL */
function calculateScores() {
  let s1 = roomData.score1;
  let s2 = roomData.score2;

  const choiceP1 = roomData.p1;
  const choiceP2 = roomData.p2;
  const cpuCard = roomData.cpu;

  let ptsP1 = calc(choiceP1, cpuCard);
  let ptsP2 = calc(choiceP2, cpuCard);

  // Se scelgono la stessa carta o equidistanti, vince la CPU (0 punti)
  if (choiceP1 !== null && choiceP2 !== null) {
    if (choiceP1 === choiceP2 || Math.abs(choiceP1 - cpuCard) === Math.abs(choiceP2 - cpuCard)) {
      ptsP1 = 0;
      ptsP2 = 0;
    }
  }

  s1 += ptsP1;
  s2 += ptsP2;

  // Aggiorna i punteggi e imposta lo stato su "reveal" (così le carte si girano)
  update(ref(db, "rooms/" + roomCode), {
    score1: s1,
    score2: s2,
    state: "reveal"
  });
}

/* FUNZIONE TASTO PROSSIMO ROUND (SOLO HOST) */
function advanceRound() {
  if (roomData.round >= 5) {
    // Gestione fine partita al round 5
    let vincitoreFinale = "";
    let puntiVincitore = 0;
    
    if (roomData.score1 > roomData.score2) {
      vincitoreFinale = roomData.p1Name;
      puntiVincitore = roomData.score1;
    } else if (roomData.score2 > roomData.score1) {
      vincitoreFinale = roomData.p2Name;
      puntiVincitore = roomData.score2;
    }

    if (vincitoreFinale !== "") {
       updateLeaderboard(vincitoreFinale, puntiVincitore);
    }

    update(ref(db, "rooms/" + roomCode), {
      state: "ended"
    });
  } else {
    // Genera una nuova carta CPU e resetta le scelte dei giocatori per il nuovo round
    update(ref(db, "rooms/" + roomCode), {
      cpu: Math.floor(Math.random() * 5) + 1,
      p1: null,
      p2: null,
      round: roomData.round + 1,
      state: "choose"
    });
  }
}

/* AGGIORNAMENTO GRAFICO DEL TAVOLO */
function render(d) {
  const back = `<img src="retro-carta.webp" alt="Carta Coperta">`;

  if (d.state === "waiting") {
    cardCPU.innerHTML = `<div class="waiting-text">Lobby</div>`;
    cardP1.innerHTML = `<div class="waiting-text">Pronto</div>`;
    cardP2.innerHTML = `<div class="waiting-text">...</div>`;
    resultEl.textContent = "In attesa del secondo giocatore...";
  }
  else if (d.state === "choose") {
    // DURANTE LA SCELTA: TUTTE LE CARTE SUL TAVOLO SONO COPERTE
    cardCPU.innerHTML = back; 
    cardP1.innerHTML = d.p1 !== null ? back : `<div class="waiting-text">...</div>`;
    cardP2.innerHTML = d.p2 !== null ? back : `<div class="waiting-text">...</div>`;
    resultEl.textContent = "Scegli la tua carta prima dello scadere del tempo!";
  } 
  else if (d.state === "reveal" || d.state === "ended") {
    // DOPO LA SCELTA (O FINE TEMPO): LE CARTE VENGONO GIRATE E SCOPERTE
    cardCPU.innerHTML = d.cpu ? `<img src="carta-${d.cpu}.webp">` : back;
    cardP1.innerHTML = d.p1 !== null ? `<img src="carta-${d.p1}.webp">` : `<div class="waiting-text">Nessuna</div>`;
    cardP2.innerHTML = d.p2 !== null ? `<img src="carta-${d.p2}.webp">` : `<div class="waiting-text">Nessuna</div>`;
    
    if (d.state === "ended") {
      if (d.score1 === d.score2) {
        resultEl.textContent = "Partita Terminata! Pareggio totale!";
      } else {
        const winName = d.score1 > d.score2 ? d.p1Name : d.p2Name;
        resultEl.textContent = `Partita Terminata! Vince ${winName}!`;
      }
    } else {
      resultEl.textContent = "Carte girate! L'Host può cliccare su 'Prossimo Round' per continuare.";
    }
  }
}
