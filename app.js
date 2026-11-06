(() => {
  const $ = (id) => document.getElementById(id);
  const state = { status: "offline", ram: 0, cpu: 0, players: 0, startedAt: 0, uptimeTimer: null, metricsTimer: null, bootTimer: null, queue: 0 };
  const statusBadge = $("statusBadge");
  const statusText = $("statusText");
  const startBtn = $("startBtn"), stopBtn = $("stopBtn"), restartBtn = $("restartBtn");
  const logs = [];
  const pad = n => String(n).padStart(2, "0");
  const now = () => new Date().toLocaleTimeString("tr-TR", {hour12:false});
  function toast(message) { const el=$("toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2600); }
  function log(message, type="info") {
    const entry={time:now(),message,type}; logs.push(entry); if(logs.length>250) logs.shift();
    renderLogs();
  }
  function renderLogs() {
    const html=logs.map(x=>`<div class="log-line"><time>${x.time}</time><span class="log-${x.type}">[${x.type.toUpperCase()}]</span> ${escapeHtml(x.message)}</div>`).join("");
    ["dashboardLogs","fullLogs"].forEach(id=>{const el=$(id); if(el){el.innerHTML=html;el.scrollTop=el.scrollHeight;}});
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function setStatus(status) {
    state.status=status; statusBadge.className="status-badge "+status; statusText.textContent=({offline:"ÇEVRİMDIŞI",starting:"BAŞLATILIYOR",online:"ÇEVRİMİÇİ",stopping:"KAPATILIYOR"})[status];
    $("listBadge").className="status-badge compact "+status; $("listBadge").querySelector("span").textContent=statusText.textContent;
    startBtn.disabled=status!=="offline"; stopBtn.disabled=status!=="online"; restartBtn.disabled=status!=="online";
  }
  function paintMetrics(){
    $("ramValue").textContent=state.ram; $("cpuValue").textContent=state.cpu; $("playersValue").textContent=state.players;
    $("ramBar").style.width=(state.ram/4096*100)+"%"; $("cpuBar").style.width=state.cpu+"%"; $("playersBar").style.width=(state.players/20*100)+"%";
  }
  function resetMetrics(){state.ram=0;state.cpu=0;state.players=0;paintMetrics();$("uptimeValue").textContent="00:00:00";}
  function stopTimers(){clearInterval(state.metricsTimer);clearInterval(state.uptimeTimer);clearTimeout(state.bootTimer);state.metricsTimer=state.uptimeTimer=state.bootTimer=null;}
  function startMetrics(){
    stopTimers(); state.startedAt=Date.now();
    state.metricsTimer=setInterval(()=>{
      if(state.status!=="online")return;
      state.ram=Math.min(4096,Math.max(180,state.ram+Math.round((Math.random()-.35)*180)));
      state.cpu=Math.min(95,Math.max(4,Math.round(state.cpu+(Math.random()-.48)*16)));
      state.players=Math.min(20,Math.max(0,state.players+(Math.random()<.42?(Math.random()<.5?-1:1):0)));
      paintMetrics();
    },1600);
    state.uptimeTimer=setInterval(()=>{const s=Math.floor((Date.now()-state.startedAt)/1000);$("uptimeValue").textContent=[Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(pad).join(":");},1000);
  }
  function boot(){
    if(state.status!=="offline")return;
    setStatus("starting");state.queue=1;$("queueValue").textContent="1";$("queueBig").textContent="1";$("queueText").textContent="Başlatma isteği";$("queueState").textContent="İşleniyor";
    log("Sunucu başlatma isteği alındı.");log("Kaynaklar hazırlanıyor...","system");log("Minecraft Server 1.20.1 başlatılıyor...","warn");
    state.bootTimer=setTimeout(()=>{
      setStatus("online");state.queue=0;$("queueValue").textContent="0";$("queueBig").textContent="0";$("queueText").textContent="Kuyrukta işlem yok";$("queueState").textContent="Boş";
      state.ram=512+Math.floor(Math.random()*250);state.cpu=8+Math.floor(Math.random()*9);state.players=Math.floor(Math.random()*4);paintMetrics();startMetrics();
      log("Minecraft Server 1.20.1 hazır!");log("Sunucu başarıyla çevrimiçi.","info");log("Dinleniyor: play.nexus-demo.net","system");toast("Sunucu çevrimiçi!");
    },3000);
  }
  function shutdown(restarting=false){
    if(state.status!=="online"&&state.status!=="starting")return;
    stopTimers();setStatus("offline");resetMetrics();state.queue=0;$("queueValue").textContent="0";$("queueBig").textContent="0";$("queueText").textContent="Kuyrukta işlem yok";$("queueState").textContent="Boş";
    log(restarting?"Yeniden başlatma için sunucu kapatılıyor...":"Kapatma isteği alındı.","warn");log("Sunucu durduruldu.","system");
    if(restarting){setTimeout(boot,900);toast("Sunucu yeniden başlatılıyor...");}else toast("Sunucu kapatıldı.");
  }
  startBtn.addEventListener("click",boot);
  stopBtn.addEventListener("click",()=>shutdown(false));
  restartBtn.addEventListener("click",()=>shutdown(true));
  $("copyAddress").addEventListener("click",async()=>{try{await navigator.clipboard.writeText("play.nexus-demo.net");toast("Sunucu adresi kopyalandı.");}catch{toast("Adres: play.nexus-demo.net");}});
  function clearLogs(){logs.length=0;renderLogs();log("Konsol temizlendi.","system");}
  $("clearLogs").addEventListener("click",clearLogs);$("clearFullLogs").addEventListener("click",clearLogs);
  $("commandForm").addEventListener("submit",e=>{e.preventDefault();const input=$("commandInput"),cmd=input.value.trim();if(!cmd)return;log("> "+cmd,"system");input.value="";if(state.status!=="online"){log("Sunucu çevrimdışı. Komut çalıştırılamadı.","error");return;}log("Demo modu: komut gerçek sunucuya gönderilmedi.","warn");});
  function navigate(page){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("crumb").textContent=({dashboard:"Overview",servers:"Servers",files:"Files",console:"Console",settings:"Settings"})[page]||"Overview";window.scrollTo({top:0,behavior:"smooth"});}
  document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
  document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
  $("helpBtn").addEventListener("click",()=>toast("NEXUS v0.1 — Ön yüz simülasyon modu."));
  function tickClock(){$("clock").textContent=now();}tickClock();setInterval(tickClock,1000);
  setStatus("offline");paintMetrics();log("NEXUS demo konsoluna hoş geldin.","info");log("Gerçek oyun sunucusuna bağlı değil — simülasyon modu.","system");
})();