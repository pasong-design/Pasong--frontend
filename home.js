
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
  document.getElementById("miniPlayerAudio");

const miniPlayerTitle =
  document.getElementById("miniPlayerTitle");

const miniPlayerLabel =
  document.getElementById("miniPlayerLabel");

const miniPlayerClose =
  document.getElementById("miniPlayerClose");


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

  "https://placehold.co/1600x700/201322/ffffff?text=YOUR+CHOICE"

];

let heroSlideIndex = 0;


function startHeroSlider(){

  if(!heroCover) return;

  if(!heroSlides.length) return;

  heroCover.src =
    heroSlides[0];

  setInterval(
    function(){

      heroSlideIndex =
        (heroSlideIndex + 1)
        % heroSlides.length;

      heroCover.style.opacity = "0";

      setTimeout(
        function(){

          heroCover.src =
            heroSlides[heroSlideIndex];

          heroCover.style.opacity = ".34";

        },
        400
      );

    },
    5000
  );

}


/* =========================
   LOAD SONGS
========================= */

async function loadPasongSongs(){

  const sections = {

    trending:
      document.getElementById(
        "trendingMusic"
      ),

    latest:
      document.getElementById(
        "latestMusic"
      ),

    downloads:
      document.getElementById(
        "topDownloads"
      ),

    uganda:
      document.getElementById(
        "topUgandanMusic"
      )

  };


  Object.values(sections).forEach(
    function(container){

      if(container){

        container.innerHTML =
          '<div class="loading-music">Loading music...</div>';

      }

    }
  );


  try{

    const response =
      await fetch(
        "https://pasong-api.onrender.com/api/songs"
      );

    if(!response.ok){

      throw new Error(
        "Failed to load songs"
      );

    }

    const data =
      await response.json();

    const songs =
      Array.isArray(data)
        ? data
        : data.songs || [];


    renderSongSection(
      sections.trending,
      songs
    );

    renderSongSection(
      sections.latest,
      songs
    );

    renderSongSection(
      sections.downloads,
      [...songs].sort(
        function(a,b){

          return (
            Number(b.downloads || 0) -
            Number(a.downloads || 0)
          );

        }
      )
    );

    renderSongSection(
      sections.uganda,
      songs
    );


  }catch(error){

    console.error(
      "PASONG songs error:",
      error
    );


    Object.values(sections).forEach(
      function(container){

        if(container){

          container.innerHTML =
            '<div class="empty-music">No music available right now.</div>';

        }

      }
    );

  }

}


/* =========================
   RENDER SONG SECTION
========================= */

function renderSongSection(
  container,
  songs
){

  if(!container) return;

  container.innerHTML = "";

  if(!songs.length){

    container.innerHTML =
      '<div class="empty-music">No music available yet.</div>';

    return;

  }

  songs.forEach(
    function(song){

      container.appendChild(
        createSongCard(song)
      );

    }
  );

}


/* =========================
   ERROR / EMPTY
========================= */

function showMusicError(
  container,
  message
){

  if(!container) return;

  container.innerHTML =
    `<div class="empty-music">${escapeHtml(message)}</div>`;

}


function showMusicEmpty(
  container
){

  if(!container) return;

  container.innerHTML =
    '<div class="empty-music">No music available yet.</div>';

}


/* =========================
   DJ MIX DETECTION
========================= */

function isDjMix(song){

  const category =
    String(
      song.category ||
      song.type ||
      song.content_type ||
      ""
    ).toLowerCase();

  const title =
    String(
      song.title || ""
    ).toLowerCase();

  return (
    category.includes("dj") ||
    category.includes("mix") ||
    title.includes("dj mix")
  );

}


/* =========================
   DJ COUNTRY
========================= */

let djCountry =
  "UG";


async function detectDjCountry(){

  try{

    const response =
      await fetch(
        "https://ipapi.co/json/"
      );

    if(!response.ok)
      throw new Error(
        "Country detection failed"
      );

    const data =
      await response.json();

    if(data && data.country_code){

      djCountry =
        data.country_code;

    }

  }catch(error){

    console.warn(
      "DJ country detection failed:",
      error
    );

    djCountry = "UG";

  }

}


/* =========================
   DJ PRICE
========================= */

function getDjPrice(){

  if(djCountry === "UG"){

    return "UGX 1,000";

  }

  return "$1";

}


/* =========================
   DJ MIX CARD
========================= */

function createDjMixCard(mix){

  const card =
    document.createElement("div");

  card.className =
    "dj-mix-card";


  const title =
    mix.title ||
    "Untitled DJ Mix";

  const dj =
    mix.artist_name ||
    mix.performing_name ||
    mix.artist ||
    mix.dj_name ||
    "DJ";


  const cover =
    mix.cover_url ||
    "https://placehold.co/800x500/191927/ffffff?text=PASONG+DJ+MIX";


  const audio =
    mix.audio_url ||
    mix.preview_url ||
    "";


  card.innerHTML = `

    <img
      class="dj-mix-cover"
      src="${escapeHtml(cover)}"
      alt="${escapeHtml(title)}"
      loading="lazy"
    >

    <div class="dj-mix-info">

      <div class="dj-mix-title">
        ${escapeHtml(title)}
      </div>

      <div class="dj-mix-dj">
        ${escapeHtml(dj)}
      </div>

      <div class="dj-mix-free">
        FREE FULL STREAMING
      </div>

      <div class="dj-mix-price">
        Download ${getDjPrice()}
      </div>

      <div class="dj-mix-actions">

        <button
          class="dj-mix-stream"
          type="button"
        >
          ▶ Stream
        </button>

        <button
          class="dj-mix-buy"
          type="button"
        >
          🛒 Buy
        </button>

      </div>

      <button
        class="dj-mix-tip"
        type="button"
      >
        💗 Support DJ
      </button>

      <button
        class="dj-mix-open"
        type="button"
      >
        View DJ Mix
      </button>

    </div>

  `;


  const streamButton =
    card.querySelector(
      ".dj-mix-stream"
    );

  if(streamButton){

    streamButton.addEventListener(
      "click",
      function(){

        playDjMix(
          title,
          dj,
          audio
        );

      }
    );

  }


  const buyButton =
    card.querySelector(
      ".dj-mix-buy"
    );

  if(buyButton){

    buyButton.addEventListener(
      "click",
      function(){

        window.location.href =
          "checkout.html";

      }
    );

  }


  const tipButton =
    card.querySelector(
      ".dj-mix-tip"
    );

  if(tipButton){

    tipButton.addEventListener(
      "click",
      function(){

        alert(
          "Support the DJ feature is coming soon."
        );

      }
    );

  }


  const openButton =
    card.querySelector(
      ".dj-mix-open"
    );

  if(openButton){

    openButton.addEventListener(
      "click",
      function(){

        playDjMix(
          title,
          dj,
          audio
        );

      }
    );

  }


  return card;

}


/* =========================
   LOAD DJ MIXES
========================= */

async function loadPasongDjMixes(){

  const container =
    document.getElementById(
      "djMixPanel"
    );

  if(!container) return;


  container.innerHTML =
    '<div class="dj-mix-loading">Loading DJ mixes...</div>';


  try{

    const response =
      await fetch(
        "https://pasong-api.onrender.com/api/songs"
      );


    if(!response.ok){

      throw new Error(
        "Failed to load DJ mixes"
      );

    }


    const data =
      await response.json();


    const songs =
      Array.isArray(data)
        ? data
        : data.songs || [];


    const mixes =
      songs.filter(
        isDjMix
      );


    container.innerHTML = "";


    if(!mixes.length){

      container.innerHTML =
        '<div class="dj-mix-empty">No DJ mixes available yet.</div>';

      return;

    }


    mixes.forEach(
      function(mix){

        container.appendChild(
          createDjMixCard(mix)
        );

      }
    );


  }catch(error){

    console.error(
      "PASONG DJ mix error:",
      error
    );


    container.innerHTML =
      '<div class="dj-mix-empty">No DJ mixes available right now.</div>';

  }

}


/* =========================
   SEARCH
========================= */

const searchInput =
  document.querySelector(
    ".search-box input"
  );


if(searchInput){

  searchInput.addEventListener(
    "input",
    function(){

      const query =
        searchInput.value
          .trim()
          .toLowerCase();


      document
        .querySelectorAll(
          ".song-card"
        )
        .forEach(
          function(card){

            const text =
              card.textContent
                .toLowerCase();


            card.style.display =
              !query ||
              text.includes(query)
                ? ""
                : "none";

          }
        );

    }
  );

}


/* =========================
   START
========================= */

startHeroSlider();

loadPasongAccount();

loadPasongSongs();

detectDjCountry()
  .then(
    function(){

      loadPasongDjMixes();

    }
  )
  .catch(
    function(){

      loadPasongDjMixes();

    }
  );
