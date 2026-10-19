// pasong-player.js - COPY PASTE THIS FILE
const PASONG_PLAYER_URL = "player.html";
function openPasongPlayer(id){
  if(!id) return;
  window.location.href = `${PASONG_PLAYER_URL}?id=${id}`;
}
function connectAllPlayers(){
  document.querySelectorAll("[data-id]").forEach(el=>{
    el.style.cursor="pointer";
    el.onclick = function(e){
      if(e.target.closest(".buy, .heart, .like, button")) return;
      openPasongPlayer(this.getAttribute("data-id"));
    };
  });
  // Kill all old audio players
  document.querySelectorAll("audio").forEach(a=>{
    if(!a.closest(".main")) a.style.display="none";
  });
}
document.addEventListener("DOMContentLoaded", ()=>{ setTimeout(connectAllPlayers, 800); });
setInterval(connectAllPlayers, 2000);
window.playSong = openPasongPlayer;
window.openPlayer = openPasongPlayer;
