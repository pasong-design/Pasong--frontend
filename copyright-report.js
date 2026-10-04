/* PASONG Copyright Report button + notice form.
   Add to the PASONG Song page before </body>:
   <script src="copyright-report.js" defer></script>
*/
(function(){
  const API_BASE="https://pasong-api.onrender.com";
  const SUPABASE_URL="https://mtufczmjlkvycarxylgh.supabase.co";
  const SUPABASE_ANON_KEY="sb_publishable_XDIZ0_nd4PAYJy2Oz4VaxQ_R4Trs3VP";

  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
  function songId(){const p=new URLSearchParams(location.search);return p.get("id")||p.get("song_id")||p.get("songId")||"";}

  function addStyles(){
    const s=document.createElement("style");
    s.textContent=`
      #pasongCopyrightBtn{display:inline-flex;align-items:center;gap:7px;margin:10px 0;padding:10px 13px;border:1px solid #4b2630;border-radius:10px;background:#241217;color:#ffb4bd;font-weight:800;cursor:pointer}
      #pasongCopyrightBtn:hover{background:#32151d}
      #pasongCopyrightModal{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:99999;display:none;align-items:center;justify-content:center;padding:14px}
      #pasongCopyrightModal.open{display:flex}
      .pasong-copyright-box{width:min(720px,100%);max-height:94vh;overflow:auto;background:#101018;border:1px solid #302a3a;border-radius:18px;padding:20px;color:#f5f5f7;box-shadow:0 20px 80px rgba(0,0,0,.5)}
      .pasong-copyright-box h2{margin:0 0 7px;font-size:21px}.pasong-copyright-box p{color:#aaa;font-size:12px;line-height:1.5;margin:0 0 14px}
      .pc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pc-field{margin-bottom:10px}.pc-field.full{grid-column:1/-1}.pc-field label{display:block;font-size:11px;color:#bbb;font-weight:800;margin-bottom:5px}.pc-field input,.pc-field textarea,.pc-field select{width:100%;padding:10px;background:#0b0b11;color:#fff;border:1px solid #2b2b37;border-radius:9px;outline:none}.pc-field textarea{min-height:85px;resize:vertical}.pc-check{font-size:11px;color:#aaa;line-height:1.5;margin:8px 0}.pc-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px}.pc-btn{border:0;border-radius:9px;padding:10px 14px;font-weight:800;cursor:pointer}.pc-submit{background:#8b5cf6;color:#fff}.pc-cancel{background:#1a1a23;color:#ddd;border:1px solid #30303a}.pc-msg{margin:10px 0;padding:10px;border-radius:9px;font-size:12px}.pc-msg.error{background:#32141a;color:#ffabb3}.pc-msg.ok{background:#10281a;color:#93f2b0}
      @media(max-width:600px){.pc-grid{grid-template-columns:1fr}.pc-field.full{grid-column:auto}}
    `;
    document.head.appendChild(s);
  }

  function build(){
    if(!songId())return;
    addStyles();

    const button=document.createElement("button");
    button.id="pasongCopyrightBtn";
    button.type="button";
    button.textContent="⚠️ Report Copyright Infringement";

    const anchor=document.querySelector("#favoriteBtn")||document.querySelector(".actions")||document.querySelector("main")||document.body;
    if(anchor.parentNode && anchor.id==="favoriteBtn") anchor.parentNode.insertBefore(button,anchor.nextSibling);
    else anchor.prepend(button);

    const modal=document.createElement("div");
    modal.id="pasongCopyrightModal";
    modal.innerHTML=`<div class="pasong-copyright-box" role="dialog" aria-modal="true">
      <h2>⚖️ Copyright Infringement Notice</h2>
      <p>Use this form if you are the copyright owner or an authorized rights representative and believe this PASONG song is being used without permission. Please provide accurate information and evidence.</p>
      <div id="pcMsg"></div>
      <form id="pcForm">
        <div class="pc-grid">
          <div class="pc-field"><label>Claimant name *</label><input id="pcName" required></div>
          <div class="pc-field"><label>Email *</label><input id="pcEmail" type="email" required></div>
          <div class="pc-field"><label>Phone</label><input id="pcPhone"></div>
          <div class="pc-field"><label>Your role *</label><select id="pcRole"><option value="copyright_owner">Copyright owner</option><option value="authorized_agent">Authorized agent</option><option value="exclusive_licensee">Exclusive licensee</option><option value="other">Other rights holder</option></select></div>
          <div class="pc-field full"><label>Full address *</label><input id="pcAddress" required></div>
          <div class="pc-field full"><label>Copyright / rights claim *</label><textarea id="pcRights" required placeholder="Explain what work you own and what rights are being infringed."></textarea></div>
          <div class="pc-field full"><label>Infringing material description *</label><textarea id="pcMaterial" required placeholder="Describe the song/content and where it appears on PASONG."></textarea></div>
          <div class="pc-field full"><label>Reason for complaint *</label><textarea id="pcReason" required></textarea></div>
          <div class="pc-field full"><label>Requested remedial action *</label><textarea id="pcAction" required>Remove or disable access to the reported infringing song while the claim is reviewed.</textarea></div>
          <div class="pc-field full"><label>Evidence URL</label><input id="pcEvidence" type="url" placeholder="https://... ownership/licence/registration evidence"></div>
          <div class="pc-field full"><label>Electronic signature *</label><input id="pcSignature" required placeholder="Type your full legal name"></div>
        </div>
        <div class="pc-check"><label><input id="pcGoodFaith" type="checkbox" required> I declare that I have a good-faith belief that the reported use is not authorized by the copyright owner, its agent, or the law.</label></div>
        <div class="pc-check"><label><input id="pcAccurate" type="checkbox" required> I declare that the information in this notice is accurate to the best of my knowledge and that I am authorized to act for the rights holder where applicable.</label></div>
        <div class="pc-actions"><button class="pc-btn pc-cancel" type="button" id="pcCancel">Cancel</button><button class="pc-btn pc-submit" type="submit" id="pcSubmit">Submit Copyright Notice</button></div>
      </form>
    </div>`;
    document.body.appendChild(modal);

    button.addEventListener("click",()=>modal.classList.add("open"));
    document.getElementById("pcCancel").addEventListener("click",()=>modal.classList.remove("open"));
    modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});

    document.getElementById("pcForm").addEventListener("submit",async e=>{
      e.preventDefault();
      const submit=document.getElementById("pcSubmit");
      const msg=document.getElementById("pcMsg");
      submit.disabled=true;submit.textContent="Submitting...";msg.innerHTML="";
      try{
        let supabaseClient=null;
        if(window.supabase?.createClient){supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);}
        let token=null;
        if(supabaseClient){const r=await supabaseClient.auth.getSession();token=r.data?.session?.access_token||null;}
        const currentUrl=location.href;
        const response=await fetch(API_BASE+"/api/copyright/complaints",{
          method:"POST",
          headers:{"Content-Type":"application/json",...(token?{"Authorization":"Bearer "+token}:{})},
          body:JSON.stringify({
            song_id:songId(),song_url:currentUrl,
            complainant_name:document.getElementById("pcName").value.trim(),
            complainant_email:document.getElementById("pcEmail").value.trim(),
            complainant_phone:document.getElementById("pcPhone").value.trim(),
            complainant_address:document.getElementById("pcAddress").value.trim(),
            claimant_role:document.getElementById("pcRole").value,
            rights_claim:document.getElementById("pcRights").value.trim(),
            material_description:document.getElementById("pcMaterial").value.trim(),
            reason:document.getElementById("pcReason").value.trim(),
            remedial_action:document.getElementById("pcAction").value.trim(),
            evidence_url:document.getElementById("pcEvidence").value.trim(),
            signature:document.getElementById("pcSignature").value.trim(),
            good_faith_declaration:document.getElementById("pcGoodFaith").checked,
            accuracy_declaration:document.getElementById("pcAccurate").checked
          })
        });
        const text=await response.text();let data={};try{data=text?JSON.parse(text):{};}catch(_){}
        if(!response.ok)throw new Error(data.error||"Unable to submit copyright notice.");
        msg.innerHTML='<div class="pc-msg ok">'+esc(data.message||"Copyright notice submitted successfully.")+'</div>';
        document.getElementById("pcForm").reset();
      }catch(err){msg.innerHTML='<div class="pc-msg error">'+esc(err.message||"Unable to submit copyright notice.")+'</div>';}
      finally{submit.disabled=false;submit.textContent="Submit Copyright Notice";}
    });
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",build);else build();
})();
