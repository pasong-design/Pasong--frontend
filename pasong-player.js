/* PASONG shared-player navigation helper. Keep playback UI in player.html. */
(function () {
  "use strict";

  const PLAYER_URL = "player.html";

  function openPasongPlayer(id, type) {
    const cleanId = String(id == null ? "" : id).trim();
    if (!cleanId) return false;

    const cleanType = type === "beat" ? "beat" : "song";
    const target = new URL(PLAYER_URL, window.location.href);
    target.searchParams.set("type", cleanType);
    target.searchParams.set("id", cleanId);
    window.location.assign(target.toString());
    return true;
  }

  // Explicit helpers are safe to call from page-specific controls.
  window.openPasongPlayer = openPasongPlayer;
  window.openPasongSongPlayer = function (id) { return openPasongPlayer(id, "song"); };
  window.openPasongBeatPlayer = function (id) { return openPasongPlayer(id, "beat"); };
  // Backward-compatible aliases used by older PASONG pages.
  window.playSong = window.openPasongSongPlayer;
  window.openPlayer = window.openPasongSongPlayer;

  // Optional declarative wiring: data-pasong-player="song|beat" and data-player-id.
  // This is delegated once and does not interfere with buttons inside cards.
  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-pasong-player][data-player-id]");
    if (!trigger) return;
    if (event.target.closest("button, a, input, select, textarea, .buy, .heart, .like")) return;
    const type = trigger.getAttribute("data-pasong-player");
    const id = trigger.getAttribute("data-player-id");
    if (openPasongPlayer(id, type)) event.preventDefault();
  });
})();
