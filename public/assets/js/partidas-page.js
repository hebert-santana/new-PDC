// /assets/js/partidas-page.js
(() => {
  'use strict';

  const ROOT_ID   = 'partidas-root';
  const CHIP_ID   = 'chip-rodada';
  const CHIP_SUB  = 'chip-rodada-sub';
  const JSON_URL  = '/assets/data/partidas.json';

  const $root    = document.getElementById(ROOT_ID);
  const $chip    = document.getElementById(CHIP_ID);
  const $chipSub = document.getElementById(CHIP_SUB);

  if (!$root) return;

  function fmtDateTime(ts) {
    // ts já vem em segundos no JSON
    const d = new Date(ts * 1000);
    const optsDate = { weekday: 'short', day: '2-digit', month: '2-digit' };
    const optsTime = { hour: '2-digit', minute: '2-digit' };
    return {
      dia: d.toLocaleDateString('pt-BR', optsDate),   // ex: "qui, 20/11"
      hora: d.toLocaleTimeString('pt-BR', optsTime)   // ex: "21:30"
    };
  }

  function fmtForm(arr) {
    // ['v','e','d', ...] → bolinhas
    if (!Array.isArray(arr) || !arr.length) return '';
    return arr.slice(-5).map((r) => {
      let cls = 'form-n';
      if (r === 'v') cls = 'form-v';
      else if (r === 'e') cls = 'form-e';
      else if (r === 'd') cls = 'form-d';
      return `<span class="form-dot ${cls}">${r.toUpperCase()}</span>`;
    }).join('');
  }

function createMatchCard(p, clubes) {
  const mand = clubes[p.clube_casa_id];
  const vist = clubes[p.clube_visitante_id];

  const { dia, hora } = fmtDateTime(p.timestamp);
  const formMand = fmtForm(p.aproveitamento_mandante);
  const formVist = fmtForm(p.aproveitamento_visitante);

  const mandEsc = mand?.escudos?.['60x60'] || mand?.escudos?.['45x45'];
  const vistEsc = vist?.escudos?.['60x60'] || vist?.escudos?.['45x45'];

  // TV (ignorando "fique por dentro")
  let transm = '';
  if (p.transmissao) {
    const rawLabel = (p.transmissao.label || '').trim();
    const url = p.transmissao.url || '';

    const isFique = rawLabel.toLowerCase().includes('fique por dentro');
    const hasInfo = rawLabel || url;

    if (!isFique && hasInfo) {
      const label = rawLabel || 'Saiba mais';
      transm = `
        <div class="match-meta-line">
          <i class="bi bi-tv" aria-hidden="true"></i>
          ${
            url
              ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
              : `<span>${label}</span>`
          }
        </div>`;
    }
  }

  const html = `
    <article class="match-card">
      <div class="match-time">
        <span class="match-day">${dia}</span>
        <span class="match-hour">${hora}</span>
      </div>

      <div class="match-teams">
        <div class="team team-home">
          ${mandEsc ? `<img src="${mandEsc}" alt="${mand?.nome_fantasia || mand?.apelido || mand?.nome}" class="team-badge" loading="lazy" decoding="async">` : ''}
          <div class="team-info">
            <strong class="team-sigla">${mand?.abreviacao || '---'}</strong>
            <span class="team-nome">${mand?.nome_fantasia || mand?.apelido || ''}</span>
            <span class="team-pos">#${p.clube_casa_posicao || '-'}</span>
            <div class="team-form" aria-label="Últimos jogos mandante">
              ${formMand}
            </div>
          </div>
        </div>

        <div class="match-vs">x</div>

        <div class="team team-away">
          <div class="team-info text-end">
            <strong class="team-sigla">${vist?.abreviacao || '---'}</strong>
            <span class="team-nome">${vist?.nome_fantasia || vist?.apelido || ''}</span>
            <span class="team-pos">#${p.clube_visitante_posicao || '-'}</span>
            <div class="team-form" aria-label="Últimos jogos visitante">
              ${formVist}
            </div>
          </div>
          ${vistEsc ? `<img src="${vistEsc}" alt="${vist?.nome_fantasia || vist?.apelido || vist?.nome}" class="team-badge" loading="lazy" decoding="async">` : ''}
        </div>
      </div>

      <div class="match-meta">
        <div class="match-meta-line">
          <i class="bi bi-geo-alt" aria-hidden="true"></i>
          <span>${p.local || '-'}</span>
        </div>
        ${transm}
      </div>
    </article>
  `;

  const wrap = document.createElement('div');
  wrap.innerHTML = html.trim();
  return wrap.firstElementChild;
}


async function loadPartidas() {
  try {
    const res = await fetch(JSON_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    const { partidas = [], clubes = {}, rodada } = data || {};

    // só conta/usa partidas válidas
    const partidasValidas = partidas.filter(p => {
      // aceita tanto "valida" quanto "partida_valida"
      if (typeof p.valida === 'boolean') return p.valida;
      if (typeof p.partida_valida === 'boolean') return p.partida_valida;
      return true; // se não veio nada, considera válida
    });

    // Atualiza chip
    if ($chip && rodada != null) {
      $chip.querySelector('b')?.replaceChildren(
        document.createTextNode(`Rodada ${rodada}`)
      );
    }
    if ($chipSub) {
      const qtd = partidasValidas.length;
      $chipSub.textContent = `${qtd} jogo${qtd === 1 ? '' : 's'} listado${qtd === 1 ? '' : 's'}`;
    }

    if (!partidasValidas.length) {
      $root.innerHTML = `<p class="text-muted">Nenhuma partida válida para esta rodada.</p>`;
      return;
    }

    // Ordena por timestamp
    partidasValidas.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    const frag = document.createDocumentFragment();
    partidasValidas.forEach((p) => {
      const card = createMatchCard(p, clubes);
      if (card) frag.appendChild(card);
    });

    $root.innerHTML = '';
    $root.appendChild(frag);
  } catch (e) {
    console.error('Erro ao carregar partidas.json', e);
    if ($chipSub) $chipSub.textContent = 'Erro ao carregar partidas.';
    $root.innerHTML = `<p class="text-danger">Não foi possível carregar as partidas da rodada.</p>`;
  }
}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPartidas);
  } else {
    loadPartidas();
  }
})();
