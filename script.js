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
  apiKey: "AIzaSy....", 
  authDomain: "gioco-della-lama-alta.firebaseapp.com",
  databaseURL: "https://gioco-della-lama-alta-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gioco-della-lama-alta"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* STATE */
let roomCode, playerNumber, roomData;
let timer = null;
let lastRoundSeenPopup = 0; // Serve per non far riapparire i popup se si riapre la stanza

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

// Popup immagini
const popupPunto = document.getElementById("popupPunto");
const popupNessunPunto = document.getElementById("popupNessunPunto");
const popupMadamaVince = document.getElementById("popupMadamaVince");
const popupMadamaPerde = document.getElementById("popupMadamaPerde");

const chiudiPopupPunto = document.getElementById("chiudiPopupPunto");
const chiudiPopupNessunPunto = document.getElementById("chiudiPopupNessunPunto");
const chiudiPopupMadamaVince = document.getElementById("chiudiPopupMadamaVince");
const chiudiPopupMadamaPerde = document.getElementById("chiudiPopupMadamaPerde");

// Tasto Dinamico per Prossimo Round / Torna alla Lobby
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
  
  document.getElementById("game").appendChild(nextRoundBtn);
  loadLeaderboard();
});

// Funzione per chiudere tutti i popup di gioco in un colpo solo
function chiudiTuttiIPopup() {
  popupPunto.classList.add("hidden");
  popupNessunPunto.classList.add("hidden");
  popupMadamaVince.classList.add("hidden");
  popupMadamaPerde.classList.add("hidden");
}

chiudiPopupPunto.onclick = chiudiTuttiIPopup;
chiudiPopupNessunPunto.onclick = chiudiTuttiIPopup;
chiudiPopupMadamaVince.onclick = chiudiTuttiIPopup;
chiudiPopupMadamaPerde.onclick = chiudiTuttiIPopup;

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

/* AGGIORNA CLASSIFICA GLOBALE */
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
    p1: false, 
    p2: false,
    score1: 0,
    score2: 0,
    round: 1,
    state: "waiting", 
    cpu: false,
    roundResult: "" // Nuovo campo: "madama", "p1", "p2", "both", "none"
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

  update(ref(db, "rooms/" + roomCode), {
    p2Name: nick,
    p2Color: color,
    p1: false,
    p2: false,
    cpu: Math.floor(Math.random() * 5) + 1,
    state: "choose",
    roundResult: ""
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
  if (roomData[field] !== false) return; 

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

    // FASE: CHOOSE
    if (roomData.state === "choose") {
      nextRoundBtn.style.display = "none"; 
      chiudiTuttiIPopup(); // Pulisce i popup vecchi ad inizio round
      
      if (!timer) {
        countdown(5);
      }

      if (typeof roomData.p1 === "number" && typeof roomData.p2 === "number") {
        clearInterval(timer);
        timer = null;
        if (playerNumber === 1) {
          calculateScores();
        }
      }
    }

    // FASE: REVEAL O ENDED (Mostra i Popup sincronizzati)
    if (roomData.state === "reveal" || roomData.state === "ended") {
      clearInterval(timer);
      timer = null;
      countdownEl.textContent = "-";
      
      // Controlla se dobbiamo mostrare il popup per questo round specifico
      if (lastRoundSeenPopup !== roomData.round || roomData.state === "ended") {
        lastRoundSeenPopup = roomData.round;
        chiudiTuttiIPopup();

        const res = roomData.roundResult;

        if (roomData.state === "ended") {
          // FINE PARTITA DEI 5 ROUND
          if (res === "madama_win_game") {
            popupMadamaVince.classList.remove("hidden");
          } else if (res === "madama_lose_game") {
            popupMadamaPerde.classList.remove("hidden");
          }
        } else {
          // FINE ROUND NORMALE
          if (res === "madama") {
            popupMadamaVince.classList.remove("hidden"); // Entrambi vedono Madama vince il round
          } else if (res === "both") {
            popupPunto.classList.remove("hidden"); // Entrambi hanno fatto punto
          } else if (res === "p1") {
            if (playerNumber === 1) popupPunto.classList.remove("hidden");
            if (playerNumber === 2) popupNessunPunto.classList.remove("hidden");
          } else if (res === "p2") {
            if (playerNumber === 2) popupPunto.classList.remove("hidden");
            if (playerNumber === 1) popupNessunPunto.classList.remove("hidden");
          }
        }
      }

      if (roomData.state === "reveal" && playerNumber === 1) {
        nextRoundBtn.textContent = "Prossimo Round";
        nextRoundBtn.style.display = "block";
      }
      
      if (roomData.state === "ended") {
        nextRoundBtn.textContent = "Torna alla Lobby";
        nextRoundBtn.style.display = "block";
      }
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
      if (playerNumber === 1) {
        calculateScores();
      }
    }
  }, 1000);
}

/* REGOLA CALCOLO PUNTI */
function calc(c, cpu) {
  if (typeof c !== "number" || typeof cpu !== "number") return 0;
  if (c === cpu) return 2;
  if (Math.abs(c - cpu) === 1) return 1;
  return 0;
}

/* CALCOLO E AGGIORNAMENTO STATO INTERNAZIONALE */
function calculateScores() {
  let s1 = roomData.score1;
  let s2 = roomData.score2;

  const choiceP1 = roomData.p1;
  const choiceP2 = roomData.p2;
  const cpuCard = roomData.cpu;

  let ptsP1 = calc(choiceP1, cpuCard);
  let ptsP2 = calc(choiceP2, cpuCard);

  if (typeof choiceP1 === "number" && typeof choiceP2 === "number") {
    if (choiceP1 === choiceP2 || Math.abs(choiceP1 - cpuCard) === Math.abs(choiceP2 - cpuCard)) {
      ptsP1 = 0;
      ptsP2 = 0;
    }
  }

  s1 += ptsP1;
  s2 += ptsP2;

  // Stabiliamo l'esito del round corrente da inviare a entrambi
  let roundResult = "madama"; // Default: nessuno fa punti -> vince madama
  if (ptsP1 > 0 && ptsP2 > 0) roundResult = "both";
  else if (ptsP1 > 0) roundResult = "p1";
  else if (ptsP2 > 0) roundResult = "p2";

  // Se siamo al round 5, verifichiamo la macro-vittoria del gioco
  if (roomData.round >= 5) {
    let vincitoreFinale = "";
    let puntiVincitore = 0;
    let finalResult = "madama_win_game"; // Di base vince il computer

    if (s1 >= 6) {
      vincitoreFinale = roomData.p1Name;
      puntiVincitore = s1;
      finalResult = "madama_lose_game";
    } else if (s2 >= 6) {
      vincitoreFinale = roomData.p2Name;
      puntiVincitore = s2;
      finalResult = "madama_lose_game";
    }

    if (vincitoreFinale !== "") {
       updateLeaderboard(vincitoreFinale, puntiVincitore);
    }

    update(ref(db, "rooms/" + roomCode), {
      score1: s1,
      score2: s2,
      roundResult: finalResult,
      state: "ended"
    });
  } else {
    // Round normali
    update(ref(db, "rooms/" + roomCode), {
      score1: s1,
      score2: s2,
      roundResult: roundResult,
      state: "reveal"
    });
  }
}

/* FUNZIONE GESTIONE TASTO (AVANZA / TORNA ALLA LOBBY) */
function advanceRound() {
  if (roomData && roomData.state === "ended") {
    game.classList.add("hidden");
    lobby.classList.remove("hidden");
    nextRoundBtn.style.display = "none";
    chiudiTuttiIPopup();
    
    roomCode = null;
    playerNumber = null;
    roomData = null;
    lastRoundSeenPopup = 0;
    return;
  }

  update(ref(db, "rooms/" + roomCode), {
    cpu: Math.floor(Math.random() * 5) + 1,
    p1: false,
    p2: false,
    round: roomData.round + 1,
    roundResult: "",
    state: "choose"
  });
}

/* AGGIORNA INTERFACCIA TAVOLO */
function render(d) {
  const back = `<img src="retro-carta.webp" alt="Carta Coperta">`;

  if (d.state === "waiting") {
    cardCPU.innerHTML = `<div class="waiting-text">Lobby</div>`;
    cardP1.innerHTML = `<div class="waiting-text">Pronto</div>`;
    cardP2.innerHTML = `<div class="waiting-text">...</div>`;
    resultEl.textContent = "In attesa del secondo giocatore...";
  }
  else if (d.state === "choose") {
    cardCPU.innerHTML = back; 
    cardP1.innerHTML = d.p1 !== false ? back : `<div class="waiting-text">...</div>`;
    cardP2.innerHTML = d.p2 !== false ? back : `<div class="waiting-text">...</div>`;
    resultEl.textContent = "Scegli la tua carta prima che scada il tempo!";
  } 
  else if (d.state === "reveal" || d.state === "ended") {
    cardCPU.innerHTML = (typeof d.cpu === "number" && d.cpu >= 1 && d.cpu <= 5) ? `<img src="carta-${d.cpu}.webp">` : back;
    cardP1.innerHTML = (typeof d.p1 === "number" && d.p1 >= 1 && d.p1 <= 5) ? `<img src="carta-${d.p1}.webp">` : `<div class="waiting-text">Nessuna</div>`;
    cardP2.innerHTML = (typeof d.p2 === "number" && d.p2 >= 1 && d.p2 <= 5) ? `<img src="carta-${d.p2}.webp">` : `<div class="waiting-text">Nessuna</div>`;
    
    if (d.state === "ended") {
      if (d.score1 < 6 && d.score2 < 6) {
        resultEl.textContent = "Partita Terminata! Vince Madama (Nessuno ha raggiunto 6 punti)!";
      } else if (d.score1 === d.score2) {
        resultEl.textContent = "Partita Terminata! Pareggio totale tra i giocatori!";
      } else {
        const winName = d.score1 > d.score2 ? d.p1Name : d.p2Name;
        resultEl.textContent = `Partita Terminata! Vince ${winName}!`;
      }
    } else {
      resultEl.textContent = "Fine del Turno! Carte scoperte sul tavolo.";
    }
  }
}
