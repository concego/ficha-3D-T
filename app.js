(() => {
  'use strict';
  const STORE = 'ficha-3dt-alpha-v1';
  const statDefs = [
    ['F', 'Força'], ['H', 'Habilidade'], ['R', 'Resistência'], ['A', 'Armadura'], ['PdF', 'Poder de Fogo']
  ];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const blankCharacter = (name = 'Personagem 1') => ({
    id: uid(), name, player: '', concept: '', scale: 'Ningen', pointsTotal: 5, xp: 0,
    stats: Object.fromEntries(statDefs.map(([key]) => [key, { value: key === 'R' ? 1 : 0, bonus: 0, description: '' }])),
    pv: 5, pm: 5, effects: [], advantages: [], disadvantages: [], skills: [], equipment: [], attacks: [],
    quickNotes: '', appearance: '', personality: '', backstory: '', generalNotes: '', rollHistory: []
  });
  let data = loadData();
  let soundEnabled = false;
  let pendingDelete = false;
  const announce = (message) => {
    const live = $('#announcer');
    live.textContent = '';
    window.setTimeout(() => { live.textContent = message; }, 30);
  };
  function normalizeCharacter(input, index = 0) {
    const base = blankCharacter(`Personagem ${index + 1}`);
    if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
    const safeText = (value, max = 5000) => typeof value === 'string' ? value.slice(0, max) : '';
    const safeInt = (value, fallback = 0, min = 0, max = 100000) => {
      const n = Number(value);
      return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback;
    };
    base.id = safeText(input.id, 100) || base.id;
    for (const key of ['name', 'player', 'concept', 'quickNotes', 'appearance', 'personality', 'backstory', 'generalNotes']) base[key] = safeText(input[key], key.includes('Notes') || key === 'backstory' ? 12000 : 300);
    base.scale = ['Ningen', 'Sugoi', 'Kiodai', 'Kami'].includes(input.scale) ? input.scale : 'Ningen';
    base.pointsTotal = safeInt(input.pointsTotal, 5);
    base.xp = safeInt(input.xp);
    for (const [key] of statDefs) {
      const item = input.stats && input.stats[key];
      base.stats[key] = { value: safeInt(item && item.value, key === 'R' ? 1 : 0, 0, 100), bonus: safeInt(item && item.bonus, 0, -100, 100), description: safeText(item && item.description, 500) };
    }
    const maxResource = Math.max(0, base.stats.R.value + base.stats.R.bonus) * 5;
    base.pv = safeInt(input.pv, maxResource, 0, 100000);
    base.pm = safeInt(input.pm, maxResource, 0, 100000);
    const cleanList = (list, fields) => Array.isArray(list) ? list.slice(0, 200).map((item) => {
      const clean = { id: safeText(item && item.id, 100) || uid() };
      for (const [field, max] of fields) clean[field] = typeof max === 'number' ? safeInt(item && item[field], 0, 0, 100000) : safeText(item && item[field], max);
      if ('selected' in (item || {})) clean.selected = Boolean(item.selected);
      if ('modifier' in (item || {})) clean.modifier = safeInt(item.modifier, 0, -1000, 1000);
      return clean;
    }) : [];
    base.effects = cleanList(input.effects, [['name', 100], ['cost', 0], ['modifier', 0]]);
    base.advantages = cleanList(input.advantages, [['name', 100], ['cost', 0], ['description', 1000]]);
    base.disadvantages = cleanList(input.disadvantages, [['name', 100], ['value', 0], ['description', 1000]]);
    base.skills = cleanList(input.skills, [['name', 120], ['description', 500]]);
    base.equipment = cleanList(input.equipment, [['name', 120], ['description', 500]]);
    base.attacks = cleanList(input.attacks, [['name', 120], ['type', 120], ['description', 500]]);
    base.rollHistory = Array.isArray(input.rollHistory) ? input.rollHistory.slice(0, 10).map((x) => safeText(x, 500)) : [];
    return base;
  }
  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (saved && Array.isArray(saved.characters) && saved.characters.length) {
        const characters = saved.characters.slice(0, 100).map(normalizeCharacter);
        return { characters, activeId: characters.some((c) => c.id === saved.activeId) ? saved.activeId : characters[0].id };
      }
    } catch (_) { /* inicia com uma ficha nova se os dados locais estiverem inválidos */ }
    const first = blankCharacter();
    return { characters: [first], activeId: first.id };
  }
  const current = () => data.characters.find((c) => c.id === data.activeId) || data.characters[0];
  function save(message) {
    try {
      localStorage.setItem(STORE, JSON.stringify(data));
      if (message) announce(message);
    } catch (_) {
      announce('Não foi possível guardar no navegador. Exporte um JSON para não perder as alterações.');
    }
  }
  function escText(el, text) { el.textContent = text == null ? '' : String(text); }
  function renderCharacterSelect() {
    const select = $('#character-select');
    select.replaceChildren();
    data.characters.forEach((character, i) => {
      const option = document.createElement('option');
      option.value = character.id;
      option.textContent = character.name.trim() || `Personagem ${i + 1}`;
      option.selected = character.id === data.activeId;
      select.append(option);
    });
  }
  function renderFields() {
    const c = current();
    $('#char-name').value = c.name;
    $('#player-name').value = c.player;
    $('#char-concept').value = c.concept;
    $('#char-scale').value = c.scale;
    $('#points-total').value = c.pointsTotal;
    $('#xp-total').value = c.xp;
    $('#quick-notes').value = c.quickNotes;
    $('#appearance').value = c.appearance;
    $('#personality').value = c.personality;
    $('#backstory').value = c.backstory;
    $('#general-notes').value = c.generalNotes;
    renderCharacterSelect();
    renderStats();
    renderItems('effects'); renderItems('advantages'); renderItems('disadvantages'); renderItems('skills'); renderItems('equipment'); renderItems('attacks');
    renderResources(); renderRollHistory(); updatePoints();
  }
  function renderStats() {
    const host = $('#stats-container'); host.replaceChildren();
    for (const [key, label] of statDefs) {
      const stat = current().stats[key];
      const card = document.createElement('div'); card.className = 'card stat-card';
      const valueWrap = document.createElement('div'); valueWrap.className = 'stat-value';
      const valueLabel = document.createElement('label'); valueLabel.htmlFor = `stat-${key}`; valueLabel.textContent = `${label} (${key}) — base`;
      const input = document.createElement('input'); input.type = 'number'; input.min = '0'; input.step = '1'; input.max = '100'; input.id = `stat-${key}`; input.value = stat.value; input.dataset.stat = key;
      const total = document.createElement('p'); total.className = 'badge'; total.id = `total-${key}`; total.textContent = `Total final: ${stat.value + stat.bonus}`;
      valueWrap.append(valueLabel, input, total);
      const bonusWrap = document.createElement('div'); bonusWrap.className = 'stat-value';
      const bonusLabel = document.createElement('label'); bonusLabel.htmlFor = `bonus-${key}`; bonusLabel.textContent = `Bônus passivo de ${key}`;
      const bonus = document.createElement('input'); bonus.type = 'number'; bonus.min = '-100'; bonus.max = '100'; bonus.step = '1'; bonus.id = `bonus-${key}`; bonus.value = stat.bonus; bonus.dataset.statBonus = key;
      bonusWrap.append(bonusLabel, bonus);
      const descWrap = document.createElement('div'); descWrap.className = 'stat-desc';
      const descLabel = document.createElement('label'); descLabel.htmlFor = `desc-${key}`; descLabel.textContent = `${label} — bônus, estilo ou descrição`;
      const desc = document.createElement('input'); desc.type = 'text'; desc.id = `desc-${key}`; desc.maxLength = 500; desc.value = stat.description; desc.dataset.statDescription = key;
      descWrap.append(descLabel, desc);
      card.append(valueWrap, bonusWrap, descWrap); host.append(card);
    }
  }
  function renderResources() {
    const c = current();
    const maximum = Math.max(0, c.stats.R.value + c.stats.R.bonus) * 5;
    c.pv = Math.min(c.pv, maximum); c.pm = Math.min(c.pm, maximum);
    $('#pv-readout').textContent = `${c.pv} de ${maximum}`;
    $('#pm-readout').textContent = `${c.pm} de ${maximum}`;
    const ratio = maximum ? c.pv / maximum : 0;
    $('#pv-condition').textContent = maximum === 0 ? 'Sem PV (R = 0)' : ratio > .5 ? 'Saudável' : ratio > .25 ? 'Ferido' : ratio > 0 ? 'À beira da inconsciência' : 'Inconsciente';
  }
  function updatePoints() {
    const c = current();
    const statsCost = statDefs.reduce((sum, [key]) => sum + c.stats[key].value, 0);
    const advantageCost = c.advantages.reduce((sum, item) => sum + item.cost, 0);
    const disadvantageCredit = c.disadvantages.reduce((sum, item) => sum + item.value, 0);
    const spent = statsCost + advantageCost - disadvantageCredit;
    $('#points-summary').textContent = `Pontos gastos líquidos: ${spent} (características ${statsCost} + vantagens ${advantageCost} − desvantagens ${disadvantageCredit}); orçamento base: ${c.pointsTotal}. PEs registrados separadamente: ${c.xp}.`;
  }
  function makeItemRow(kind, item, index) {
    const row = document.createElement('div'); row.className = 'item-row';
    if (kind === 'effects') {
      const label = document.createElement('label');
      const check = document.createElement('input'); check.type = 'checkbox'; check.checked = Boolean(item.selected); check.dataset.effect = item.id;
      const copy = document.createElement('span'); copy.className = 'item-copy';
      const strong = document.createElement('strong'); strong.textContent = item.name;
      const small = document.createElement('small'); small.textContent = `Custo: ${item.cost} PM; modificador: ${item.modifier >= 0 ? '+' : ''}${item.modifier}`;
      copy.append(strong, small); label.append(check, copy); row.append(label);
    } else {
      const copy = document.createElement('div'); copy.className = 'item-copy';
      const strong = document.createElement('strong'); strong.textContent = item.name || `Item ${index + 1}`;
      const detail = kind === 'advantages' ? `${item.cost} ponto(s)` : kind === 'disadvantages' ? `${item.value} ponto(s) concedido(s)` : (item.type ? `${item.type} — ` : '') + (item.description || '');
      const small = document.createElement('small'); small.textContent = detail;
      copy.append(strong, small); row.append(copy);
    }
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'danger'; remove.textContent = 'Remover'; remove.dataset.removeKind = kind; remove.dataset.removeId = item.id;
    remove.setAttribute('aria-label', `Remover ${item.name || `item ${index + 1}`} de ${kind === 'effects' ? 'efeitos' : kind}`);
    row.append(remove); return row;
  }
  const listTargets = { effects: '#effects-list', advantages: '#advantages-list', disadvantages: '#disadvantages-list', skills: '#skills-list', equipment: '#equipment-list', attacks: '#attacks-list' };
  function renderItems(kind) {
    const host = $(listTargets[kind]); host.replaceChildren();
    current()[kind].forEach((item, index) => host.append(makeItemRow(kind, item, index)));
    if (!host.childElementCount) { const p = document.createElement('p'); p.textContent = kind === 'effects' ? 'Nenhum efeito cadastrado.' : 'Nenhum item cadastrado.'; host.append(p); }
  }
  function renderRollHistory() {
    const list = $('#roll-history'); list.replaceChildren();
    current().rollHistory.slice(0, 10).forEach((entry) => { const li = document.createElement('li'); li.textContent = entry; list.append(li); });
    if (!list.childElementCount) { const li = document.createElement('li'); li.textContent = 'Nenhuma rolagem registrada.'; list.append(li); }
  }
  function addRoll(text) {
    const c = current(); const entry = `${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — ${text}`;
    c.rollHistory.unshift(entry); c.rollHistory = c.rollHistory.slice(0, 10);
    $('#last-roll').textContent = text; renderRollHistory(); save(); announce(text); playSound();
  }
  function rollDie() { return Math.floor(Math.random() * 6) + 1; }
  function playSound() {
    if (!soundEnabled) return;
    try { const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return; const ctx = new Audio(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.frequency.value = 520; gain.gain.setValueAtTime(.08, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .12); osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .12); osc.onended = () => ctx.close(); } catch (_) { /* áudio é opcional */ }
  }
  function getModifier() { const input = $('#temp-mod'); const n = Number(input.value); return Number.isFinite(n) ? Math.trunc(n) : 0; }
  function doCombatRoll(action) {
    const c = current(); const active = action === 'initiative' ? [] : c.effects.filter((effect) => effect.selected);
    const cost = active.reduce((sum, effect) => sum + effect.cost, 0);
    if (cost > c.pm) { announce(`PM insuficientes: são necessários ${cost} PM, mas há ${c.pm}.`); $('#last-roll').textContent = `Rolagem cancelada: custo de ${cost} PM; disponíveis ${c.pm}.`; return; }
    const die = rollDie(); const mod = getModifier() + active.reduce((sum, effect) => sum + effect.modifier, 0);
    const stats = c.stats; const statValue = (key) => stats[key].value + stats[key].bonus; let formula, value;
    if (action === 'attackF') { formula = `F ${statValue('F')} + H ${statValue('H')} + 1d6${mod ? ` + modificadores ${mod}` : ''}`; value = statValue('F') + statValue('H') + die + mod; }
    else if (action === 'attackP') { formula = `PdF ${statValue('PdF')} + H ${statValue('H')} + 1d6${mod ? ` + modificadores ${mod}` : ''}`; value = statValue('PdF') + statValue('H') + die + mod; }
    else if (action === 'defense') { formula = `A ${statValue('A')} + H ${statValue('H')} + 1d6${mod ? ` + modificadores ${mod}` : ''}`; value = statValue('A') + statValue('H') + die + mod; }
    else { formula = `H ${statValue('H')} + 1d6${mod ? ` + modificadores ${mod}` : ''}`; value = statValue('H') + die + mod; }
    c.pm -= cost; if (action !== 'initiative') c.effects.forEach((effect) => { if (effect.selected) effect.selected = false; });
    $('#temp-mod').value = '0'; renderItems('effects'); renderResources();
    const effectNote = cost ? `; ${cost} PM gastos` : '';
    addRoll(`${action === 'initiative' ? 'Iniciativa' : action === 'defense' ? 'Força de Defesa' : action === 'attackP' ? 'Ataque à distância' : 'Ataque corpo a corpo'}: ${formula} = ${value} (dado ${die})${effectNote}.`);
  }
  function doStatTest(key) {
    const c = current(); const die = rollDie(); const modifier = getModifier(); const target = c.stats[key].value + c.stats[key].bonus + modifier; const success = die <= target;
    $('#temp-mod').value = '0';
    addRoll(`Teste de ${statDefs.find(([id]) => id === key)[1]}: 1d6 = ${die}; característica ${c.stats[key].value + c.stats[key].bonus}${modifier ? `, modificador ${modifier >= 0 ? '+' : ''}${modifier}, alvo ${target}` : ''} — ${success ? 'sucesso' : 'falha'}.`);
  }
  function doDice(count) { const dice = Array.from({ length: count }, rollDie); addRoll(`${count}d6: ${dice.join(' + ')} = ${dice.reduce((a, b) => a + b, 0)}.`); }
  function clampResource(resource, delta) {
    const c = current(); const max = Math.max(0, c.stats.R.value + c.stats.R.bonus) * 5; const old = c[resource];
    c[resource] = Math.max(0, Math.min(max, old + delta));
    renderResources(); save(`${resource.toUpperCase()} atualizado: ${c[resource]} de ${max}.`);
  }
  function restoreResource(resource) { current()[resource] = Math.max(0, current().stats.R.value + current().stats.R.bonus) * 5; renderResources(); save(`${resource.toUpperCase()} restaurado.`); }
  function fieldMap() {
    return { 'char-name': 'name', 'player-name': 'player', 'char-concept': 'concept', 'char-scale': 'scale', 'points-total': 'pointsTotal', 'xp-total': 'xp', 'quick-notes': 'quickNotes', appearance: 'appearance', personality: 'personality', backstory: 'backstory', 'general-notes': 'generalNotes' };
  }
  function bindForms() {
    for (const [id, key] of Object.entries(fieldMap())) {
      const el = document.getElementById(id); const event = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(event, () => { const c = current(); c[key] = ['pointsTotal', 'xp'].includes(key) ? Math.max(0, Math.trunc(Number(el.value) || 0)) : el.value; if (key === 'name') renderCharacterSelect(); updatePoints(); save(); });
    }
    $('#stats-container').addEventListener('input', (event) => {
      const el = event.target; const c = current();
      if (el.dataset.stat) {
        const key = el.dataset.stat; const oldMax = Math.max(0, c.stats.R.value + c.stats.R.bonus) * 5; const pvWasFull = c.pv === oldMax; const pmWasFull = c.pm === oldMax;
        c.stats[key].value = Math.max(0, Math.min(100, Math.trunc(Number(el.value) || 0))); el.value = c.stats[key].value;
        const newMax = Math.max(0, c.stats.R.value + c.stats.R.bonus) * 5; if (key === 'R') { if (pvWasFull) c.pv = newMax; if (pmWasFull) c.pm = newMax; }
        $(`#total-${key}`).textContent = `Total final: ${c.stats[key].value + c.stats[key].bonus}`; renderResources(); updatePoints(); save();
      } else if (el.dataset.statBonus) {
        const key = el.dataset.statBonus; const oldMax = Math.max(0, c.stats.R.value + c.stats.R.bonus) * 5; const pvWasFull = c.pv === oldMax; const pmWasFull = c.pm === oldMax;
        c.stats[key].bonus = Math.max(-100, Math.min(100, Math.trunc(Number(el.value) || 0))); el.value = c.stats[key].bonus;
        if (key === 'R') { const newMax = Math.max(0, c.stats.R.value + c.stats.R.bonus) * 5; if (pvWasFull) c.pv = newMax; if (pmWasFull) c.pm = newMax; }
        $(`#total-${key}`).textContent = `Total final: ${c.stats[key].value + c.stats[key].bonus}`; renderResources(); updatePoints(); save();
      } else if (el.dataset.statDescription) { c.stats[el.dataset.statDescription].description = el.value; save(); }
    });
    $('#character-select').addEventListener('change', () => { data.activeId = $('#character-select').value; renderFields(); save('Personagem trocado.'); });
    $('#new-character').addEventListener('click', () => {
      if (data.characters.length >= 100) { announce('Limite de 100 personagens atingido.'); return; }
      const name = window.prompt('Nome do novo personagem:', `Personagem ${data.characters.length + 1}`);
      if (name === null) return; const character = blankCharacter(name.trim() || `Personagem ${data.characters.length + 1}`); data.characters.push(character); data.activeId = character.id; renderFields(); save('Novo personagem criado.'); $('#char-name').focus();
    });
    $('#delete-character').addEventListener('click', () => {
      if (data.characters.length <= 1) { announce('A ficha precisa ter pelo menos um personagem.'); return; }
      pendingDelete = true; $('#dialog-message').textContent = `Excluir “${current().name || 'Personagem sem nome'}”? Essa ação remove a ficha deste navegador.`;
      const dialog = $('#confirm-dialog'); if (typeof dialog.showModal === 'function') dialog.showModal(); else if (window.confirm($('#dialog-message').textContent)) deleteCurrent();
    });
    $('#confirm-dialog').addEventListener('close', () => { if (pendingDelete && $('#confirm-dialog').returnValue === 'confirm') deleteCurrent(); pendingDelete = false; });
    $$('.accordion-button').forEach((button) => button.addEventListener('click', () => setAccordion(button, button.getAttribute('aria-expanded') !== 'true')));
    $('#expand-all').addEventListener('click', () => $$('.accordion-button').forEach((b) => setAccordion(b, true)));
    $('#collapse-all').addEventListener('click', () => $$('.accordion-button').forEach((b) => setAccordion(b, false)));
    document.body.addEventListener('click', (event) => {
      const b = event.target.closest('button'); if (!b) return;
      if (b.dataset.resource) clampResource(b.dataset.resource, Number(b.dataset.delta));
      if (b.dataset.restore) restoreResource(b.dataset.restore);
      if (b.dataset.customResource) { const amount = Math.max(0, Math.trunc(Number($(`#${b.dataset.customResource}-amount`).value) || 0)); clampResource(b.dataset.customResource, amount * Number(b.dataset.sign)); }
      if (b.dataset.roll) doCombatRoll(b.dataset.roll);
      if (b.dataset.test) doStatTest(b.dataset.test);
      if (b.dataset.dice) doDice(Number(b.dataset.dice));
      if (b.dataset.removeKind) removeItem(b.dataset.removeKind, b.dataset.removeId);
    });
    $('#effects-list').addEventListener('change', (event) => { const id = event.target.dataset.effect; if (!id) return; const effect = current().effects.find((x) => x.id === id); if (effect) { effect.selected = event.target.checked; save(); } });
    $('#effect-form').addEventListener('submit', (event) => { event.preventDefault(); const name = $('#effect-name').value.trim(); if (!name) return; current().effects.push({ id: uid(), name, cost: Math.max(0, Math.trunc(Number($('#effect-cost').value) || 0)), modifier: Math.trunc(Number($('#effect-mod').value) || 0), selected: false }); event.target.reset(); $('#effect-cost').value = '0'; $('#effect-mod').value = '0'; renderItems('effects'); save('Efeito adicionado.'); $('#effect-name').focus(); });
    bindListForm('advantage-form', 'advantages', () => ({ name: $('#advantage-name').value.trim(), cost: Math.max(0, Math.trunc(Number($('#advantage-cost').value) || 0)), description: $('#advantage-desc').value.trim() }));
    bindListForm('disadvantage-form', 'disadvantages', () => ({ name: $('#disadvantage-name').value.trim(), value: Math.max(0, Math.trunc(Number($('#disadvantage-value').value) || 0)), description: $('#disadvantage-desc').value.trim() }));
    bindListForm('skill-form', 'skills', () => ({ name: $('#skill-name').value.trim(), description: $('#skill-desc').value.trim() }));
    bindListForm('equipment-form', 'equipment', () => ({ name: $('#equipment-name').value.trim(), description: $('#equipment-desc').value.trim() }));
    bindListForm('attack-form', 'attacks', () => ({ name: $('#attack-name').value.trim(), type: $('#attack-type').value.trim(), description: $('#attack-desc').value.trim() }));
    $('#clear-rolls').addEventListener('click', () => { current().rollHistory = []; renderRollHistory(); $('#last-roll').textContent = 'Histórico limpo.'; save('Histórico de rolagens limpo.'); });
    $('#toggle-sound').addEventListener('click', (event) => { soundEnabled = !soundEnabled; event.currentTarget.setAttribute('aria-pressed', String(soundEnabled)); event.currentTarget.textContent = `Som: ${soundEnabled ? 'ligado' : 'desligado'}`; announce(`Som ${soundEnabled ? 'ligado' : 'desligado'}.`); });
    $('#copy-summary').addEventListener('click', copySummary);
    $('#export-json').addEventListener('click', exportJSON);
    $('#import-button').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', importJSON);
  }
  function setAccordion(button, open) { button.setAttribute('aria-expanded', String(open)); const panel = document.getElementById(button.getAttribute('aria-controls')); panel.hidden = !open; }
  function bindListForm(formId, kind, read) {
    $(`#${formId}`).addEventListener('submit', (event) => { event.preventDefault(); const item = read(); if (!item.name) return; item.id = uid(); current()[kind].push(item); event.target.reset(); if (kind === 'advantages' || kind === 'disadvantages') { const cost = kind === 'advantages' ? '#advantage-cost' : '#disadvantage-value'; $(cost).value = '1'; updatePoints(); } renderItems(kind); save('Item adicionado.'); const first = event.target.querySelector('input'); if (first) first.focus(); });
  }
  function removeItem(kind, id) { const c = current(); if (!Array.isArray(c[kind])) return; const item = c[kind].find((x) => x.id === id); c[kind] = c[kind].filter((x) => x.id !== id); renderItems(kind); if (kind === 'advantages' || kind === 'disadvantages') updatePoints(); save(item ? `${item.name} removido.` : 'Item removido.'); }
  function deleteCurrent() {
    if (data.characters.length <= 1) return;
    const index = data.characters.findIndex((c) => c.id === data.activeId); data.characters.splice(index, 1); data.activeId = data.characters[Math.max(0, index - 1)].id; renderFields(); save('Personagem excluído.'); $('#character-select').focus();
  }
  function summaryText() {
    const c = current(); const maxResource = Math.max(0, c.stats.R.value + c.stats.R.bonus) * 5; const lines = [`Ficha 3D&T Alpha — ${c.name || 'Sem nome'}`, `Jogador: ${c.player || '—'}`, `Conceito: ${c.concept || '—'}`, `Escala: ${c.scale}`, `Características: ${statDefs.map(([key]) => `${key} ${c.stats[key].value + c.stats[key].bonus}${c.stats[key].bonus ? ` (base ${c.stats[key].value}, bônus ${c.stats[key].bonus})` : ''}`).join(' | ')}`, `PV: ${c.pv}/${maxResource} | PM: ${c.pm}/${maxResource}`,  `Pontos gastos líquidos: ${statDefs.reduce((s, [k]) => s + c.stats[k].value, 0) + c.advantages.reduce((s, x) => s + x.cost, 0) - c.disadvantages.reduce((s, x) => s + x.value, 0)} de ${c.pointsTotal}; PEs: ${c.xp}`];
    for (const [kind, title] of [['advantages','Vantagens'],['disadvantages','Desvantagens'],['skills','Perícias'],['equipment','Equipamentos'],['attacks','Ataques']]) { if (c[kind].length) lines.push(`${title}: ${c[kind].map((x) => `${x.name}${x.description ? ` — ${x.description}` : ''}`).join('; ')}`); }
    if (c.generalNotes) lines.push(`Anotações: ${c.generalNotes}`); return lines.join('\n');
  }
  async function copySummary() {
    const text = summaryText();
    try { await navigator.clipboard.writeText(text); announce('Resumo copiado para a área de transferência.'); }
    catch (_) { const textarea = document.createElement('textarea'); textarea.value = text; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.append(textarea); textarea.select(); const ok = document.execCommand('copy'); textarea.remove(); announce(ok ? 'Resumo copiado para a área de transferência.' : 'Não foi possível copiar o resumo.'); }
  }
  function exportJSON() {
    const payload = { format: 'ficha-3dt-alpha', version: 1, exportedAt: new Date().toISOString(), activeId: data.activeId, characters: data.characters };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'ficha-3dt-alpha.json'; document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url); announce('Arquivo JSON exportado.');
  }
  async function importJSON(event) {
    const file = event.target.files && event.target.files[0]; if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('O arquivo excede 5 MB.');
      const parsed = JSON.parse(await file.text());
      let incoming;
      if (Array.isArray(parsed)) incoming = parsed;
      else if (Array.isArray(parsed.characters)) incoming = parsed.characters;
      else if (parsed.character && typeof parsed.character === 'object') incoming = [parsed.character];
      else if (parsed.stats) incoming = [parsed];
      else throw new Error('O arquivo não contém uma ficha reconhecida.');
      if (!incoming.length || incoming.length > 100) throw new Error('O arquivo deve conter de 1 a 100 personagens.');
      const chars = incoming.map(normalizeCharacter);
      const activeCandidate = parsed.activeId;
      data = { characters: chars, activeId: chars.some((c) => c.id === activeCandidate) ? activeCandidate : chars[0].id };
      renderFields(); save('Ficha importada com sucesso.'); $('#character-select').focus();
    } catch (error) { announce(error.message === 'O arquivo excede 5 MB.' ? error.message : `Importação não concluída: ${error.message || 'arquivo inválido'}`); }
    finally { event.target.value = ''; }
  }
  bindForms();
  renderFields();
})();
