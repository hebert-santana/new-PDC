// assets/js/team-updates.js
(() => {
  'use strict';

  // Produção lê do /data; (se quiser, adicione '/assets/data/team-updates.json')
  const SOURCES = ['/assets/data/team-updates.json'];

  /* =============== UI helpers (chips) =============== */
  function ensureChipRow(colEl){
    let row = colEl.querySelector(':scope > .chip-stack');
    if (row) return row;

    const card = colEl.querySelector('.lineup-card');
    row = document.createElement('div');
    row.className = 'chip-stack';

    if (card) {
      card.appendChild(row);                 // dentro do card (z-index correto)
    } else {
      const img = colEl.querySelector('.lineup-img');
      if (img) img.insertAdjacentElement('afterend', row);
      else colEl.prepend(row);
    }
    return row;
  }

  function renderUpdatedChip(colEl, label){
    if (!label) return;
    const row  = ensureChipRow(colEl);
    const chip = document.createElement('span');
    chip.className = 'upd-chip';
    chip.innerHTML = `<i class="bi bi-clock-history" aria-hidden="true"></i> Atualizado ${label}`;
    row.appendChild(chip);
  }

  function renderAlertChip(colEl, alertData){
    if (!alertData) return;

    let text = '';
    if (typeof alertData === 'string') text = alertData;
    else if (alertData === true)       text = '⚠️ Pode poupar';
    else if (typeof alertData === 'object') text = alertData.msg || alertData.text || '⚠️ Pode poupar';

    text = (text || '').trim();
    if (!text) return;

    const row = ensureChipRow(colEl);

    let emoji = '', msg = text;
    const m = msg.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
    if (m){ emoji = m[0]; msg = msg.slice(emoji.length).trim(); }

    const chip = document.createElement('span');
    chip.className = 'chip-alert';
    chip.setAttribute('role','note');
    chip.title = msg || 'Pode poupar';

    const e = document.createElement('span');
    e.className = 'emoji';
    e.textContent = emoji || '⚠️';
    chip.appendChild(e);

    chip.appendChild(document.createTextNode(' ' + (msg || 'Pode poupar')));
    row.appendChild(chip);
  }

  /* =============== Datas =============== */
  function fmtHuman(dtStr) {
    if (!dtStr) return null;
    try {
      const now = new Date();
      const dt  = new Date(dtStr);
      const pad  = (n) => String(n).padStart(2, '0');
      const hhmm = `${pad(dt.getHours())}h${pad(dt.getMinutes())}`;

      const sameDay = now.toDateString() === dt.toDateString();
      const yest = new Date(now); yest.setDate(now.getDate() - 1);
      const isYest = yest.toDateString() === dt.toDateString();

      if (sameDay) return `Hoje ${hhmm}`;
      if (isYest)  return `Ontem ${hhmm}`;

      const dd = pad(dt.getDate());
      const mo = pad(dt.getMonth() + 1);
      return `${dd}/${mo} ${hhmm}`;
    } catch { return null; }
  }

  /* =============== Dados =============== */
  async function loadUpdates() {
    for (const url of SOURCES) {
      try {
        const r = await fetch(url, { cache:'no-store' });
        if (r.ok) return await r.json();
      } catch {}
    }
    console.warn('[team-updates] JSON não encontrado.');
    return null;
  }

  // HEAD na imagem (usar apenas localmente)
  async function getImgLastModified(imgEl){
    if (!imgEl) return null;
    const url = imgEl.currentSrc || imgEl.src;
    try {
      const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (!r.ok) return null;
      const lm = r.headers.get('Last-Modified') || r.headers.get('last-modified');
      return lm ? new Date(lm).toISOString() : null;
    } catch { return null; }
  }

  function waitLineups(maxTries=30){
    return new Promise(res=>{
      let tries = 0;
      (function tick(){
        if (document.querySelector('.lineup-col') || tries++ >= maxTries) return res();
        setTimeout(tick, 50);
      })();
    });
  }

  /* =============== Render por coluna/time =============== */
  async function injectChips(data){
    await waitLineups();
    const cols = document.querySelectorAll('.lineup-col');

    for (const col of cols){
      const imgEl = col.querySelector('.lineup-img');

      // key do time por data-team (preferência) ou pelo nome do arquivo
      const byDataAttr = col.querySelector('.status-card')?.dataset.team || null;
      const byImg =
        imgEl?.currentSrc?.match(/\/([a-z0-9-]+)\.(?:jpg|jpeg|png|webp)\b/i)?.[1] ||
        imgEl?.src?.match(/\/([a-z0-9-]+)\.(?:jpg|jpeg|png|webp)\b/i)?.[1] ||
        null;

      const teamKey  = byDataAttr || byImg;
      const fromJson = teamKey ? data?.teams?.[teamKey] : null;

      // 1) Preferir JSON por time (gerado pelo commit/predeploy)
      let dt = fromJson?.last_update || null;

      // 2) Fallback SÓ no ambiente local (no Vercel o Last-Modified é comum)
      const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (!dt && isLocal) dt = await getImgLastModified(imgEl);

      // 3) Chips
      const label = fmtHuman(dt);
      if (label) renderUpdatedChip(col, label);

      const alertVal = (fromJson && (fromJson.alert ?? fromJson.alert_msg)) || null;
      if (alertVal) renderAlertChip(col, alertVal);
    }
  }



  async function loadUpdatesOnce(){ return (await loadUpdates()) || { teams:{} }; }

function clearChips(col){
  col.querySelectorAll('.upd-chip,.chip-alert').forEach(n=>n.remove());
}

function applyChipsForTeam(col, updTeam){
  clearChips(col);
  const label = fmtHuman(updTeam?.last_update);
  if (label) renderUpdatedChip(col, label);
  const alertVal = updTeam?.alert ?? updTeam?.alert_msg ?? null;
  if (alertVal) renderAlertChip(col, alertVal);
}

// Reaplica apenas para um teamKey
async function refreshTeam(teamKey){
  const data = await loadUpdatesOnce();
  const updTeam = data?.teams?.[teamKey] || null;
  document.querySelectorAll(`.lineup-col .status-card[data-team="${teamKey}"]`)
    .forEach(sc => applyChipsForTeam(sc.closest('.lineup-col'), updTeam));
}

// canal: recebe {type:'refresh', teamKey}
try{
  const ch = new BroadcastChannel('lineups');
  ch.onmessage = (e) => {
    const k = e?.data?.teamKey || null;
    if (e?.data?.type === 'refresh' && k) refreshTeam(k);
  };
}catch{}


  /* =============== Bootstrap =============== */
 document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadUpdates();
  await injectChips(data || {});
});

  // util para gerar esqueleto no console
  window.TeamUpdates = {
    printSkeleton(){
      const set = new Set();
      for (const s of (window.JOGOS || [])){
        set.add(s.home.key); set.add(s.away.key);
      }
      const teams = [...set].sort()
        .reduce((acc,k)=>{ acc[k]={ last_update:"", alert:"" }; return acc; }, {});
      console.log(JSON.stringify({version:1, tz:"-03:00", teams}, null, 2));
    }
  };
})();