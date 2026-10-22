<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Advertise on PASONG</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
html,body{height:auto!important;overflow-y:auto!important;background:#0a0a0f;color:#fff}
</style>
</head>
<body class="min-h-screen flex flex-col bg-[#0a0a0f]">

<header class="p-4 border-b border-white/10 flex justify-between items-center">
<a href="/index.html" class="font-black text-xl tracking-widest">PASONG</a>
<a href="/ads-manager.html" class="text-sm bg-white text-black px-4 py-2 rounded-full font-bold">Ads Manager</a>
</header>

<main class="flex-1 max-w-[900px] mx-auto w-full p-6">
<h1 class="text-3xl font-black mt-6">Promote on PASONG</h1>
<p class="text-white/60 mt-2 text-sm">Choose what you want to promote</p>

<!-- OPTIONS -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
<button onclick="showTab('song')" id="btn-song" class="tab-btn bg-white text-black p-5 rounded-2xl font-bold text-left">
🎵 My Song
<span class="block text-xs font-normal opacity-60 mt-1">From your uploaded songs</span>
</button>
<button onclick="showTab('profile')" id="btn-profile" class="tab-btn bg-white/10 p-5 rounded-2xl font-bold text-left">
👤 My Profile
<span class="block text-xs font-normal opacity-60 mt-1">Promote your account</span>
</button>
<button onclick="showTab('business')" id="btn-business" class="tab-btn bg-white/10 p-5 rounded-2xl font-bold text-left">
🏢 My Business
<span class="block text-xs font-normal opacity-60 mt-1">Product / Service / Video</span>
</button>
</div>

<!-- MY SONG -->
<div id="tab-song" class="tab mt-8">
<h3 class="font-bold mb-4">Select a song from your library</h3>
<div id="song-list" class="space-y-3">
<div class="p-4 bg-white/5 rounded-xl text-sm text-white/50">Loading your songs...</div>
</div>
<button class="mt-6 w-full bg-[#1DB954] text-black font-black py-3.5 rounded-full">Continue to Promote Song</button>
</div>

<!-- MY PROFILE -->
<div id="tab-profile" class="tab mt-8 hidden">
<h3 class="font-bold mb-4">Promote your profile</h3>
<div class="p-5 bg-white/5 rounded-2xl flex gap-4 items-center">
<img src="https://i.pravatar.cc/100" class="w-14 h-14 rounded-full">
<div><p class="font-bold">Your PASONG Profile</p><p class="text-xs text-white/50">@yourname • Promote to gain followers</p></div>
</div>
<button class="mt-6 w-full bg-white text-black font-black py-3.5 rounded-full">Promote My Profile</button>
</div>

<!-- MY BUSINESS -->
<div id="tab-business" class="tab mt-8 hidden">
<h3 class="font-bold mb-4">Promote your business</h3>
<div class="space-y-4">
<input type="text" placeholder="Business / Product Name" class="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm">
<textarea placeholder="What do you want people to know?" class="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm h-28"></textarea>
<label class="block w-full bg-white/5 border border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer">
<span class="text-sm">Click to upload flyer / video for your ad</span>
<input type="file" id="business-file" accept="image/*,video/*" class="hidden">
<p id="file-name" class="text-xs text-white/40 mt-2"></p>
</label>
<button onclick="uploadBusinessAd()" class="w-full bg-white text-black font-black py-3.5 rounded-full">Upload to PASONG Ads Management</button>
<p class="text-[11px] text-white/40 text-center mt-2">Your ad will be reviewed and appear in Ads Manager</p>
</div>
</div>

</main>

<!-- AUTO FOOTER - ONE FILE FOR ALL PAGES -->
<div id="pasong-footer-container"></div>
<script src="pasong-footer-loader.js"></script>

<script>
function showTab(t){
  document.querySelectorAll('.tab').forEach(x=>x.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(x=>{x.classList.remove('bg-white','text-black');x.classList.add('bg-white/10','text-white')});
  document.getElementById('tab-'+t).classList.remove('hidden');
  const b=document.getElementById('btn-'+t);
  b.classList.remove('bg-white/10','text-white');
  b.classList.add('bg-white','text-black');
}
document.getElementById('business-file')?.addEventListener('change',e=>{
  document.getElementById('file-name').textContent=e.target.files[0]?.name||'';
});
function uploadBusinessAd(){
  alert('Your business ad uploaded! Check Ads Manager.');
  // Here you connect to your real Ads Management database
  // Example: save to Supabase / Firebase
}
showTab('song');
</script>
</body>
</html>
