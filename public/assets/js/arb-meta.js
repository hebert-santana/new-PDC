// Reposiciona arbitragem ANTES dos campinhos e cria o "chip" com a info da partida.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.custom-provaveis-item').forEach(item => {
    const arb = item.querySelector('#arbitragem-bloco, .arb-wrap');   // bloco vazio ou com dados
    const lineups = item.querySelector('.lineups');

    // 1) Arbitragem vem antes dos campinhos
    if (arb && lineups) item.insertBefore(arb, lineups);

    // 2) Criar botão-chip com a info da partida
    let matchText = '';
    const arbMatch = item.querySelector('.arb-wrap .arb-head .arb-match'); // quando há dados
    if (arbMatch) {
      matchText = arbMatch.textContent.replace(/^Jogo:\s*/,'').trim();
    } else {
      // inferir a partida pelos times mostrados no bloco (funciona no estado "vazio")
      const teams = Array.from(item.querySelectorAll('.status-card .status-team'))
                        .map(n => n.textContent.trim()).slice(0,2);
      if (teams.length === 2) {
        // tenta pegar "Rodada X" do alt da primeira lineup
        const img = item.querySelector('.lineup-img[alt*="rodada"]');
        let rodada = '';
        if (img) {
          const m = img.alt.match(/rodada\s+(\d+)/i);
          if (m) rodada = ` • Rodada ${m[1]}`;
        }
        matchText = `${teams[0]} × ${teams[1]}${rodada}`;
      }
    }

    if (matchText) {
      // cria a faixa meta (acima da arbitragem; se não houver arbitragem, fica acima dos campinhos)
      let meta = item.querySelector('.arb-meta.container-avisosize');
      if (!meta) {
        meta = document.createElement('div');
        meta.className = 'arb-meta container-avisosize rail-right';
        item.insertBefore(meta, arb || lineups);
      }
      // botão-chip (recria para evitar duplicar em re-hydration)
      meta.innerHTML = '';
      const chip = document.createElement('a');
      chip.className = 'match-chip';
      chip.setAttribute('role','button');
      chip.setAttribute('aria-label', `Partida ${matchText}`);
      chip.innerHTML = `<i class="bi bi-calendar2-event" aria-hidden="true"></i><span class="mc-label">${matchText}</span>`;
      meta.appendChild(chip);

      // remove "Jogo: ..." do cabeçalho dentro do card para não repetir
      if (arbMatch) arbMatch.remove();
    }
  });
});
