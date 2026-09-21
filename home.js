const SUPABASE_URL =
  "https://mtufczmjlkvycarxylgh.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_XDIZ0_nd4PAYJy2Oz4VaxQ_R4Trs3VP";

let pasongSupabase = null;

if(
  window.supabase &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.startsWith("YOUR_")
){

  pasongSupabase =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

}


/* =========================
   ACCOUNT
========================= */

async function loadPasongAccount(){

  const accountBox =
    document.getElementById("accountBox");

  const accountPhoto =
    document.getElementById("accountPhoto");

  const accountName =
    document.getElementById("accountName");

  if(!accountBox) return;

  if(!pasongSupabase){

    accountName.textContent = "Account";

    return;

  }

  try{

    const result =
      await pasongSupabase.auth.getUser();

    const user = result.data?.user;

    if(user){

      const metadata =
        user.user_metadata || {};

      const name =
        metadata.performing_name ||
        metadata.full_name ||
        metadata.name ||
        user.email?.split("@")[0] ||
        "Account";

      accountName.textContent = name;

      if(metadata.avatar_url){

        accountPhoto.src =
          metadata.avatar_url;

      }

    }else{

      accountName.textContent =
        "Login / Sign Up";

    }

  }catch(error){

    console.error(
      "PASONG account error:",
      error
    );

  }

}


/* =========================
   MINI PLAYER
========================= */

const miniPlayer =
  document.getElementById("miniPlayer");

const miniPlayerAudio =
  document.getElementById("miniAudio");

const miniPlayerTitle =
  document.getElementById("miniPlayerTitle");

const miniPlayerLabel =
  document.getElementById("miniPlayerLabel");

const miniPlayerClose =
  document.getElementById("closeMiniPlayer");


function showMiniPlayer(
  title,
  label,
  audioUrl
){

  if(!miniPlayer) return;

  if(miniPlayerTitle)
    miniPlayerTitle.textContent = title;

  if(miniPlayerLabel)
    miniPlayerLabel.textContent = label;

  if(miniPlayerAudio){

    miniPlayerAudio.src = audioUrl;

    miniPlayerAudio.currentTime = 0;

    miniPlayerAudio.play().catch(
      function(){}
    );

  }

  miniPlayer.classList.add("show");

}


function closeMiniPlayer(){

  if(miniPlayerAudio){

    miniPlayerAudio.pause();

    miniPlayerAudio.src = "";

  }

  if(miniPlayer){

    miniPlayer.classList.remove("show");

  }

}


if(miniPlayerClose){

  miniPlayerClose.addEventListener(
    "click",
    closeMiniPlayer
  );

}


/* =========================
   SONG PREVIEW
========================= */

function playSongPreview(
  title,
  artist,
  audioUrl
){

  if(!audioUrl){

    alert("Preview not available.");

    return;

  }

  showMiniPlayer(
    title,
    "20 second preview • " + artist,
    audioUrl
  );

  if(miniPlayerAudio){

    miniPlayerAudio.currentTime = 0;

    miniPlayerAudio.play().catch(
      function(){}
    );

    clearTimeout(
      miniPlayerAudio._pasongPreviewTimer
    );

    miniPlayerAudio._pasongPreviewTimer =
      setTimeout(
        function(){

          miniPlayerAudio.pause();

        },
        20000
      );

  }

}


/* =========================
   DJ MIX PLAY
========================= */

function playDjMix(
  title,
  dj,
  audioUrl
){

  if(!audioUrl){

    alert("DJ Mix audio not available.");

    return;

  }

  showMiniPlayer(
    title,
    "Free full streaming • " + dj,
    audioUrl
  );

}


/* =========================
   SONG CARD
========================= */

function createSongCard(song){

  const card =
    document.createElement("div");

  card.className = "song-card";

  const title =
    song.title || "Untitled";

  const artist =
    song.artist_name ||
    song.performing_name ||
    song.artist ||
    "Unknown Artist";

  const cover =
    song.cover_url ||
    "https://placehold.co/600x600/191927/ffffff?text=PASONG";

  const audio =
    song.preview_url ||
    song.audio_url ||
    "";

  card.innerHTML = `

    <img
      class="song-cover"
      src="${escapeHtml(cover)}"
      alt="${escapeHtml(title)}"
      loading="lazy"
    >

    <div class="song-info">

      <div class="song-title">
        ${escapeHtml(title)}
      </div>

      <div class="song-artist">
        ${escapeHtml(artist)}
      </div>

      <div class="song-bottom">

        <div class="song-price">
          UGX 700
        </div>

        <button
          class="song-play"
          type="button"
          aria-label="Play preview"
        >
          ▶
        </button>

      </div>

      <button
        class="song-open"
        type="button"
      >
        Play 20 second preview
      </button>

    </div>

  `;

  const playButton =
    card.querySelector(".song-play");

  const openButton =
    card.querySelector(".song-open");

  if(playButton){

    playButton.addEventListener(
      "click",
      function(){

        playSongPreview(
          title,
          artist,
          audio
        );

      }
    );

  }

  if(openButton){

    openButton.addEventListener(
      "click",
      function(){

        playSongPreview(
          title,
          artist,
          audio
        );

      }
    );

  }

  return card;

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value){

  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}


/* =========================
   HERO SLIDER
========================= */

const heroCover =
  document.getElementById("heroCover");

const heroSlides = [

  "https://placehold.co/1600x700/151324/ffffff?text=PASONG",

  "https://placehold.co/1600x700/18132b/ffffff?text=YOUR+MUSIC",

  "https://placehold.co/1600x700/201
