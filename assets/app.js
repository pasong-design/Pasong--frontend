const songs=[['Kwata Awo','Bobley Nsubuga'],['Kube','Triple Jokerman'],['Love Me','Nema'],['Tugende','Daddy Andre'],['Never Give Up','King Saha']];
function render(id){const e=document.getElementById(id);if(e)e.innerHTML=songs.map(s=>`<article class="song"><div class="art">🎵</div><div><h3>${s[0]}</h3><p>${s[1]}</p><small>UGX 500 • KV BEATS</small></div><a class="btn small" href="song.html">Buy</a></article>`).join('')}
['trending','latest','countdown'].forEach(render);
