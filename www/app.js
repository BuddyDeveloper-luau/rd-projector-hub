(()=>{
const API='https://api.real-debrid.com/rest/1.0';
let token=localStorage.getItem('rd_token')||'';
let targetPkg=localStorage.getItem('rd_pkg')??'org.videolan.vlc';

const statusEl=document.getElementById('status-bar');
function notify(msg,isErr=false){
  statusEl.textContent=msg;
  statusEl.style.borderLeftColor=isErr?'#f87171':'#38bdf8';
  statusEl.classList.remove('hidden');
}

// Player selection chips
document.querySelectorAll('.player-select .chip').forEach(btn=>{
  btn.classList.toggle('active',btn.dataset.pkg===targetPkg);
  btn.onclick=()=>{
    targetPkg=btn.dataset.pkg;
    localStorage.setItem('rd_pkg',targetPkg);
    document.querySelectorAll('.player-select .chip').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    notify(`Target player set to ${btn.textContent}`);
  };
});

async function rdFetch(path,opts={}){
  const res=await fetch(API+path,{
    ...opts,
    headers:{Authorization:`Bearer ${token}`,...(opts.headers||{})}
  });
  if(!res.ok)throw new Error(`Real-Debrid HTTP ${res.status}`);
  return res.status===204?null:res.json();
}

async function launchStream(directUrl,title){
  notify(`Launching ${title} in ${targetPkg||'Player'}...`);
  const plugin=window.Capacitor?.Plugins?.StreamLauncher;
  if(plugin){
    await plugin.playVideo({url:directUrl,title,package:targetPkg});
  }else{
    window.open(directUrl,'_blank');
  }
}

async function unrestrictAndPlay(rawLink,fallbackTitle='Real-Debrid Stream'){
  try{
    notify('Unrestricting stream link...');
    const body=new URLSearchParams({link:rawLink});
    const data=await rdFetch('/unrestrict/link',{method:'POST',body});
    await launchStream(data.download,data.filename||fallbackTitle);
  }catch(e){
    notify(`Failed: ${e.message}`,true);
  }
}

async function loadLibrary(){
  const badge=document.getElementById('user-badge');
  const list=document.getElementById('library-list');
  if(!token){
    badge.textContent='NO TOKEN SET';badge.classList.remove('ok');
    list.innerHTML='<div class="muted">Enter your Real-Debrid API token above to load your files.</div>';
    return;
  }
  try{
    const user=await rdFetch('/user');
    badge.textContent=`${user.username.toUpperCase()} · ${user.type.toUpperCase()}`;
    badge.classList.add('ok');

    const [downloads,torrents]=await Promise.all([
      rdFetch('/downloads?limit=25'),
      rdFetch('/torrents?limit=15')
    ]);

    list.innerHTML='';
    const items=[];

    (downloads||[]).forEach(d=>{
      items.push({
        title:d.filename,
        meta:`DIRECT · ${(d.filesize/1073741824).toFixed(2)} GB`,
        action:()=>launchStream(d.download,d.filename)
      });
    });

    (torrents||[]).filter(t=>t.status==='downloaded'&&t.links?.length).forEach(t=>{
      items.push({
        title:t.filename,
        meta:`CACHED TORRENT · ${(t.bytes/1073741824).toFixed(2)} GB`,
        action:()=>unrestrictAndPlay(t.links[0],t.filename)
      });
    });

    if(!items.length){
      list.innerHTML='<div class="muted">No downloads or cached torrents found on your account.</div>';
      return;
    }

    items.forEach(it=>{
      const btn=document.createElement('button');
      btn.className='media-item';
      btn.tabIndex=0;
      btn.innerHTML=`<div class="media-title">${it.title}</div><div class="media-meta"><span>${it.meta}</span><span>▶ PLAY</span></div>`;
      btn.onclick=it.action;
      list.appendChild(btn);
    });
  }catch(e){
    badge.textContent='AUTH ERROR';badge.classList.remove('ok');
    notify(`Error loading Real-Debrid: ${e.message}`,true);
  }
}

document.getElementById('token-input').value=token;
document.getElementById('token-form').onsubmit=e=>{
  e.preventDefault();
  token=document.getElementById('token-input').value.trim();
  localStorage.setItem('rd_token',token);
  notify('Token saved. Syncing library...');
  loadLibrary();
};

document.getElementById('link-form').onsubmit=async e=>{
  e.preventDefault();
  const val=document.getElementById('link-input').value.trim();
  if(!val)return;
  if(val.startsWith('magnet:')){
    try{
      notify('Adding magnet to Real-Debrid...');
      const added=await rdFetch('/torrents/addMagnet',{method:'POST',body:new URLSearchParams({magnet:val})});
      await rdFetch(`/torrents/selectFiles/${added.id}`,{method:'POST',body:new URLSearchParams({files:'all'})});
      notify('Magnet added! Refreshing library...');
      setTimeout(loadLibrary,1500);
    }catch(err){notify(`Magnet error: ${err.message}`,true);}
  }else{
    await unrestrictAndPlay(val);
  }
  document.getElementById('link-input').value='';
};

document.getElementById('refresh-btn').onclick=loadLibrary;
loadLibrary();
})();
