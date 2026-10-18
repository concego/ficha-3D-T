const STORAGE_KEY = 'ficha_3det_alpha_v3';
    let appState = {
      soundEnabled: true,
      activeCharId: null,
      openAccordions: ['sec-combate'],
      characters: []
    };
    let bioEditMode = false;

    function createDefaultCharacter(name = 'Novo Herói') {
      return {
        id: 'char_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: name,
        player: '',
        concept: 'Aventureiro',
        scale: 'Ningen (Normal)',
        pointsTotal: 5,
        xp: 0,
        stats: { F: 1, H: 1, R: 1, A: 1, PdF: 0 },
        statDescs: { F: 'Esmagamento', H: '', R: '', A: '', PdF: '' },
        pvCurrent: 5,
        pmCurrent: 5,
        traits: [
          {
            id: 't_default_1',
            name: 'Ataque Especial',
            category: 'Vantagem',
            cost: 1,
            mode: 'temporary',
            target: 'FA',
            mod: 2,
            pmCost: 2,
            active: false,
            desc: 'Gasta 2 PM para ganhar FA+2 em um ataque.'
          }
        ],
        powers: [],
        money: '',
        inventory: '',
        appearance: '',
        personality: '',
        history: '',
        quickNotes: '',
        diary: [],
        rollLog: []
      };
    }

    function cleanText(value, max = 5000) {
      return typeof value === 'string' ? value.slice(0, max) : '';
    }
    function cleanNumber(value, fallback = 0, min = -100000, max = 100000) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.trunc(number))) : fallback;
    }
    function migrateRepoCharacter(old, index) {
      const c = createDefaultCharacter(cleanText(old.name, 100) || `Personagem ${index + 1}`);
      c.traits = [];
      c.id = cleanText(old.id, 100) || c.id;
      c.player = cleanText(old.player, 100); c.concept = cleanText(old.concept, 160);
      const scales = { Ningen: 'Ningen (Normal)', Sugoi: 'Sugoi (x10)', Kiodai: 'Kiodai (x100)', Kami: 'Kami (x1000)' };
      c.scale = scales[old.scale] || cleanText(old.scale, 80) || 'Ningen (Normal)';
      c.pointsTotal = cleanNumber(old.pointsTotal, 5, 0); c.xp = cleanNumber(old.xp, 0, 0);
      const statKeys = ['F', 'H', 'R', 'A', 'PdF'];
      for (const key of statKeys) {
        const raw = old.stats && old.stats[key];
        const base = raw && typeof raw === 'object' ? raw.value : raw;
        c.stats[key] = Math.max(0, cleanNumber(base, key === 'R' ? 1 : 0, 0, 100));
        c.statDescs[key] = cleanText((raw && typeof raw === 'object' && raw.description) || (old.statDescs && old.statDescs[key]), 500);
        const bonus = raw && typeof raw === 'object' ? cleanNumber(raw.bonus, 0, -100, 100) : 0;
        if (bonus) c.traits.push({ id: `migrated-bonus-${key}-${c.id}`, name: `Bônus passivo migrado de ${key}`, category: 'Bônus migrado', cost: 0, mode: 'permanent', target: key, mod: bonus, pmCost: 0, active: false, desc: 'Bônus preservado da versão anterior da ficha.' });
      }
      for (const item of (Array.isArray(old.advantages) ? old.advantages : []).filter(x => x && typeof x === 'object')) c.traits.push({ id: cleanText(item.id, 100) || `mig-a-${Date.now()}-${Math.random()}`, name: cleanText(item.name, 120), category: 'Vantagem', cost: cleanNumber(item.cost, 0, 0), mode: 'none', target: 'none', mod: 0, pmCost: 0, active: false, desc: cleanText(item.description, 2000) });
      for (const item of (Array.isArray(old.disadvantages) ? old.disadvantages : []).filter(x => x && typeof x === 'object')) c.traits.push({ id: cleanText(item.id, 100) || `mig-d-${Date.now()}-${Math.random()}`, name: cleanText(item.name, 120), category: 'Desvantagem', cost: -cleanNumber(item.value, 0, 0), mode: 'none', target: 'none', mod: 0, pmCost: 0, active: false, desc: cleanText(item.description, 2000) });
      for (const effect of (Array.isArray(old.effects) ? old.effects : []).filter(x => x && typeof x === 'object')) c.traits.push({ id: cleanText(effect.id, 100) || `mig-e-${Date.now()}-${Math.random()}`, name: cleanText(effect.name, 120), category: 'Efeito migrado', cost: 0, mode: 'temporary', target: 'COMBAT', mod: cleanNumber(effect.modifier, 0, -1000, 1000), pmCost: cleanNumber(effect.cost, 0, 0), active: Boolean(effect.selected), desc: 'Migrado como modificador genérico de ataque/defesa. Ele se desativa após uma rolagem, como na versão anterior.' });
      c.powers = (Array.isArray(old.skills) ? old.skills : []).filter(item => item && typeof item === 'object').map((item, i) => ({ id: cleanText(item.id, 100) || `mig-s-${i}-${c.id}`, name: cleanText(item.name, 120), type: 'Perícia / Especialização', points: 0, pmCost: 0, desc: cleanText(item.description, 2000) }));
      c.pointsTotal = cleanNumber(old.pointsTotal, 5, 0); c.xp = cleanNumber(old.xp, 0, 0);
      c.pvCurrent = cleanNumber(old.pv, c.stats.R * 5, 0); c.pmCurrent = cleanNumber(old.pm, c.stats.R * 5, 0);
      c.quickNotes = cleanText(old.quickNotes, 12000);
      c.appearance = cleanText(old.appearance, 12000); c.personality = cleanText(old.personality, 12000);
      const historyParts = [cleanText(old.backstory, 12000)];
      if (old.generalNotes) historyParts.push(`Anotações gerais migradas:\n${cleanText(old.generalNotes, 8000)}`);
      c.history = historyParts.filter(Boolean).join('\n\n');
      const inventory = [];
      for (const item of (Array.isArray(old.equipment) ? old.equipment : []).filter(x => x && typeof x === 'object')) inventory.push(`${cleanText(item.name, 120)}${item.description ? ` — ${cleanText(item.description, 500)}` : ''}`);
      for (const item of (Array.isArray(old.attacks) ? old.attacks : []).filter(x => x && typeof x === 'object')) inventory.push(`Ataque: ${cleanText(item.name, 120)}${item.type ? ` (${cleanText(item.type, 120)})` : ''}${item.description ? ` — ${cleanText(item.description, 500)}` : ''}`);
      c.inventory = [cleanText(old.inventory, 12000), inventory.length ? `Itens e ataques migrados:\n- ${inventory.join('\n- ')}` : ''].filter(Boolean).join('\n\n');
      c.money = cleanText(old.money, 200);
      c.diary = Array.isArray(old.diary) ? old.diary.filter(d => d && typeof d === 'object').slice(0, 500).map((d, i) => ({ id: cleanText(d.id, 100) || `d-${i}-${c.id}`, title: cleanText(d.title, 200), text: cleanText(d.text, 12000) })) : [];
      c.rollLog = (Array.isArray(old.rollHistory) ? old.rollHistory : Array.isArray(old.rollLog) ? old.rollLog : []).slice(0, 10).map(x => cleanText(x, 500));
      return c;
    }
    function normalizeTraitMode(mode, target) {
      if (mode === 'passive') return 'permanent';
      if (mode === 'toggle') return ['PV_MAX', 'PM_MAX'].includes(target) ? 'permanent' : 'temporary';
      if (mode === 'temporary' && ['PV_MAX', 'PM_MAX'].includes(target)) return 'permanent';
      return ['none', 'permanent', 'temporary'].includes(mode) ? mode : 'none';
    }
    function normalizeCharacter(input, index) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) return createDefaultCharacter(`Personagem ${index + 1}`);
      const legacyRepoShape = input.advantages || input.disadvantages || input.effects || (input.stats && typeof input.stats.F === 'object');
      if (legacyRepoShape) return migrateRepoCharacter(input, index);
      const c = createDefaultCharacter(cleanText(input.name, 100) || `Personagem ${index + 1}`);
      c.id = cleanText(input.id, 100) || c.id;
      for (const key of ['name','player','concept','scale','money','inventory','appearance','personality','history','quickNotes']) if (key in input) c[key] = cleanText(input[key], key === 'history' || key === 'inventory' || key === 'quickNotes' ? 12000 : 500);
      c.pointsTotal = cleanNumber(input.pointsTotal, 5, 0); c.xp = cleanNumber(input.xp, 0, 0);
      const statKeys = ['F','H','R','A','PdF'];
      for (const key of statKeys) {
        c.stats[key] = Math.max(0, cleanNumber(input.stats && input.stats[key], key === 'R' ? 1 : 0, 0, 100));
        c.statDescs[key] = cleanText(input.statDescs && input.statDescs[key], 500);
      }
      c.pvCurrent = cleanNumber(input.pvCurrent, c.stats.R * 5, 0);
      c.pmCurrent = cleanNumber(input.pmCurrent, c.stats.R * 5, 0);
      const validTargets = ['none','FA','FD','COMBAT','F','H','R','A','PdF','PV_MAX','PM_MAX','INIT'];
      c.traits = Array.isArray(input.traits) ? input.traits.slice(0,500).map((t,i) => ({
        id: cleanText(t && t.id,100) || `trait-${i}-${c.id}`, name: cleanText(t && t.name,120),
        category: cleanText(t && t.category,80) || 'Vantagem', cost: cleanNumber(t && t.cost,0),
        mode: normalizeTraitMode(t && t.mode, t && t.target), target: validTargets.includes(t && t.target) ? t.target : 'none',
        mod: cleanNumber(t && t.mod,0,-10000,10000), pmCost: cleanNumber(t && t.pmCost,0,0), active: Boolean(t && t.active), desc: cleanText(t && t.desc,5000)
      })) : [];
      c.powers = Array.isArray(input.powers) ? input.powers.slice(0,500).map((x,i) => ({ id:cleanText(x && x.id,100)||`power-${i}-${c.id}`, name:cleanText(x && x.name,120), type:cleanText(x && x.type,100)||'Perícia / Especialização', points:cleanNumber(x && x.points,0), pmCost:cleanNumber(x && x.pmCost,0,0), desc:cleanText(x && x.desc,5000) })) : [];
      c.diary = Array.isArray(input.diary) ? input.diary.filter(d => d && typeof d === 'object').slice(0,500).map((d,i) => ({ id:cleanText(d && d.id,100)||`diary-${i}-${c.id}`, title:cleanText(d && d.title,200), text:cleanText(d && d.text,12000) })) : [];
      c.rollLog = Array.isArray(input.rollLog) ? input.rollLog.slice(0,10).map(x => cleanText(x,500)) : [];
      return c;
    }
    function normalizeState(parsed) {
      if (!parsed || !Array.isArray(parsed.characters) || !parsed.characters.length || parsed.characters.length > 100) return null;
      const characters = parsed.characters.map((c,i) => normalizeCharacter(c,i));
      const requestedId = cleanText(parsed.activeCharId || parsed.activeId,100);
      return {
        soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : parsed.format === 'ficha-3dt-alpha' ? false : true,
        activeCharId: characters.some(c => c.id === requestedId) ? requestedId : characters[0].id,
        openAccordions: Array.isArray(parsed.openAccordions) ? parsed.openAccordions.filter(id => typeof id === 'string' && /^sec-/.test(id)).slice(0,20) : ['sec-combate'],
        characters
      };
    }
    function loadState() {
      let saved = null;
      try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { announce('O navegador não permitiu acessar os dados salvos.', true); }
      if (saved) {
        try {
          const normalized = normalizeState(JSON.parse(saved));
          if (normalized) { appState = normalized; saveState(); }
          else announce('Os dados salvos não foram reconhecidos; uma ficha nova será aberta.', true);
        } catch (e) { announce('Não foi possível ler os dados salvos; uma ficha nova será aberta.', true); }
      }
      if (!Array.isArray(appState.openAccordions)) appState.openAccordions = ['sec-combate'];
      if (!appState.characters || appState.characters.length === 0) {
        const first = createDefaultCharacter('Kain');
        appState.characters = [first]; appState.activeCharId = first.id;
      }
      if (!appState.activeCharId || !getActiveChar()) appState.activeCharId = appState.characters[0].id;
    }

    function saveState() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); }
      catch (e) { announce('Não foi possível salvar no navegador. Exporte um JSON para manter um backup.', true); }
      updateDynamicHeaders();
    }

    function getActiveChar() {
      return appState.characters.find(c => c.id === appState.activeCharId);
    }

    // --- CONTROLE DE GAVETAS (ACORDEÕES) ---
    function toggleSection(panelId) {
      const panel = document.getElementById(panelId);
      const btn = document.querySelector(`button[aria-controls="${panelId}"]`);
      if (!panel || !btn) return;

      const isCurrentlyOpen = btn.getAttribute('aria-expanded') === 'true';
      const willOpen = !isCurrentlyOpen;

      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      panel.hidden = !willOpen;

      if (willOpen) {
        if (!appState.openAccordions.includes(panelId)) {
          appState.openAccordions.push(panelId);
        }
      } else {
        appState.openAccordions = appState.openAccordions.filter(id => id !== panelId);
      }
      saveState();
    }

    function expandAllSections(open) {
      appState.openAccordions = [];
      document.querySelectorAll('.accordion-btn').forEach(btn => {
        const panelId = btn.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (panel) panel.hidden = !open;
        if (open) appState.openAccordions.push(panelId);
      });
      saveState();
      announce(open ? 'Todas as seções foram expandidas.' : 'Todas as seções foram recolhidas.');
    }

    function applySavedAccordions() {
      document.querySelectorAll('.accordion-btn').forEach(btn => {
        const panelId = btn.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);
        const isOpen = appState.openAccordions.includes(panelId);
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (panel) panel.hidden = !isOpen;
      });
    }

    // --- WEB AUDIO API ---
    let audioCtx = null;
    function playTone(freq, type = 'sine', duration = 0.12) {
      if (!appState.soundEnabled) return;
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    function soundRoll() { playTone(380, 'triangle', 0.1); setTimeout(() => playTone(520, 'sine', 0.15), 90); }
    function soundCrit() { playTone(523, 'sine', 0.1); setTimeout(() => playTone(659, 'sine', 0.1), 100); setTimeout(() => playTone(784, 'triangle', 0.25), 200); }
    function soundFumble() { playTone(220, 'sawtooth', 0.18); setTimeout(() => playTone(150, 'sawtooth', 0.25), 160); }

    function toggleSound() {
      appState.soundEnabled = !appState.soundEnabled;
      document.getElementById('btn-import-json').addEventListener('click', () => document.getElementById('input-import-json').click());
      const soundBtn = document.getElementById('btn-toggle-sound');
      soundBtn.setAttribute('aria-pressed', String(appState.soundEnabled));
      soundBtn.textContent = `Som: ${appState.soundEnabled ? 'Ligado' : 'Desligado'}`;
      saveState();
      announce(`Efeitos sonoros ${appState.soundEnabled ? 'ligados' : 'desligados'}.`);
    }

    function announce(msg, assertive = false) {
      const el = document.getElementById(assertive ? 'live-announcer' : 'polite-announcer');
      el.textContent = '';
      setTimeout(() => { el.textContent = msg; }, 30);
    }

    // --- CÁLCULOS DO 3D&T ALPHA ---
    function getEffectiveStats(char) {
      const totals = { F: char.stats.F, H: char.stats.H, R: char.stats.R, A: char.stats.A, PdF: char.stats.PdF, FA: 0, FD: 0, COMBAT: 0, INIT: 0, PV_MAX: 0, PM_MAX: 0 };
      char.traits.forEach(t => {
        const shouldApply = (t.mode === 'permanent') || (t.mode === 'temporary' && t.active);
        if (shouldApply && t.target !== 'none' && totals[t.target] !== undefined) {
          totals[t.target] += Number(t.mod) || 0;
        }
      });
      ['F', 'H', 'R', 'A', 'PdF'].forEach(k => { if (totals[k] < 0) totals[k] = 0; });

      const pvBase = totals.R === 0 ? 1 : totals.R * 5;
      const pmBase = totals.R === 0 ? 1 : totals.R * 5;
      totals.maxPV = Math.max(1, pvBase + totals.PV_MAX);
      totals.maxPM = Math.max(1, pmBase + totals.PM_MAX);
      return totals;
    }

    function calculatePoints(char) {
      const statPoints = (char.stats.F || 0) + (char.stats.H || 0) + (char.stats.R || 0) + (char.stats.A || 0) + (char.stats.PdF || 0);
      let vants = 0;
      let desvants = 0;
      char.traits.forEach(t => {
        const c = Number(t.cost) || 0;
        if (c >= 0) vants += c;
        else desvants += c;
      });
      let powerPoints = 0;
      char.powers.forEach(p => { powerPoints += Number(p.points) || 0; });
      const spent = statPoints + vants + desvants + powerPoints;
      return { statPoints, vants, desvants, powerPoints, spent, remaining: char.pointsTotal - spent };
    }

    function updateDynamicHeaders() {
      const char = getActiveChar();
      if (!char) return;
      const eff = getEffectiveStats(char);
      const pts = calculatePoints(char);

      document.getElementById('main-title').textContent = `Ficha 3D&T Alpha: ${char.name}`;
      document.getElementById('hdr-combate').textContent =
        `1. Combate e Rolagens (PV: ${char.pvCurrent}/${eff.maxPV} | PM: ${char.pmCurrent}/${eff.maxPM})`;
      document.getElementById('hdr-identidade').textContent =
        `2. Identidade: ${char.name} (${pts.spent}/${char.pointsTotal} pts | ${char.scale.split(' ')[0]})`;
      document.getElementById('hdr-stats').textContent =
        `3. Características (F${eff.F}, H${eff.H}, R${eff.R}, A${eff.A}, PdF${eff.PdF})`;
      document.getElementById('hdr-traits').textContent =
        `4. Vantagens e Desvantagens (${char.traits.length} itens | Desvantagens: ${pts.desvants} pts)`;
      document.getElementById('hdr-powers').textContent =
        `5. Perícias e Magias (${char.powers.length} cadastradas)`;
      document.getElementById('hdr-inv').textContent =
        `6. Inventário e Dinheiro (${char.money ? char.money : 'Sem dinheiro anotado'})`;
      document.getElementById('hdr-bio').textContent =
        `7. Aparência, Personalidade e História`;
      document.getElementById('hdr-diary').textContent =
        `8. Diário de Sessão (${char.diary.length} anotações)`;
    }

    // --- ATUALIZAÇÃO DE CAMPOS DIRETOS ---
    function updateField(prop, val, isNum = false) {
      const char = getActiveChar();
      if (!char) return;
      char[prop] = isNum ? (parseInt(val, 10) || 0) : val;
      saveState();
      if (prop === 'name' || prop === 'concept') populateCharSelect();
      if (isNum) {
        const pts = calculatePoints(char);
        document.getElementById('points-summary').textContent =
          `${pts.spent} pontos gastos de ${char.pointsTotal} (Restam: ${pts.remaining} pts | Características: ${pts.statPoints} | Vantagens: +${pts.vants} | Desvantagens: ${pts.desvants} | Perícias: +${pts.powerPoints})`;
      }
      if (prop === 'appearance' || prop === 'personality' || prop === 'history') {
        document.getElementById('read-appearance').textContent = char.appearance || 'Nenhuma aparência descrita.';
        document.getElementById('read-personality').textContent = char.personality || 'Nenhuma personalidade descrita.';
        document.getElementById('read-history').textContent = char.history || 'Nenhuma história escrita.';
      }
    }

    function updateStat(statKey, val) {
      const char = getActiveChar();
      if (!char) return;
      char.stats[statKey] = Math.max(0, parseInt(val, 10) || 0);
      saveState();
      renderCharacter();
    }

    function updateStatDesc(statKey, val) {
      const char = getActiveChar();
      if (!char) return;
      char.statDescs[statKey] = val;
      saveState();
    }

    function renderCharacter() {
      const char = getActiveChar();
      if (!char) return;
      const eff = getEffectiveStats(char);
      const pts = calculatePoints(char);

      if (char.pvCurrent > eff.maxPV) char.pvCurrent = eff.maxPV;
      if (char.pmCurrent > eff.maxPM) char.pmCurrent = eff.maxPM;

      document.getElementById('pv-display').textContent = `${char.pvCurrent} / ${eff.maxPV}`;
      document.getElementById('pm-display').textContent = `${char.pmCurrent} / ${eff.maxPM}`;

      const pvStatusEl = document.getElementById('pv-status');
      if (char.pvCurrent <= 0) {
        pvStatusEl.textContent = 'Derrotado / Inconsciente (0 PV - Faça Teste de Morte!)';
      } else if (char.pvCurrent <= eff.R) {
        pvStatusEl.textContent = `Perto da Morte! (PV igual ou menor que R=${eff.R})`;
      } else {
        pvStatusEl.textContent = 'Saudável';
      }

      const activeContainer = document.getElementById('active-effects-list');
      activeContainer.innerHTML = '';
      const permanentList = document.getElementById('permanent-effects-list');
      permanentList.replaceChildren();
      const permanentTraits = char.traits.filter(t => t.mode === 'permanent' && t.target !== 'none' && Number(t.mod));
      if (!permanentTraits.length) { const li = document.createElement('li'); li.textContent = 'Nenhum bônus permanente de rolagem cadastrado.'; permanentList.appendChild(li); }
      else permanentTraits.forEach(t => { const li = document.createElement('li'); const sign = t.mod >= 0 ? `+${t.mod}` : t.mod; li.textContent = `${t.name}: ${targetLabel(t.target)} ${sign} (permanente; sem custo em PM).`; permanentList.appendChild(li); });
      const toggleTraits = char.traits.filter(t => t.mode === 'temporary');
      if (toggleTraits.length === 0) {
        activeContainer.innerHTML = '<span>Nenhum efeito ativável cadastrado nas Vantagens.</span>';
      } else {
        toggleTraits.forEach(t => {
          const wrapper = document.createElement('div');
          wrapper.style.marginRight = '1rem';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.id = 'toggle_' + t.id;
          cb.checked = !!t.active;
          cb.addEventListener('change', () => {
            t.active = cb.checked;
            saveState();
            renderCharacter();
            announce(`${t.name} ${t.active ? 'ativado' : 'desativado'}`, false);
          });
          const lbl = document.createElement('label');
          lbl.htmlFor = cb.id;
          lbl.style.display = 'inline';
          lbl.style.marginLeft = '0.35rem';
          const modSign = t.mod >= 0 ? `+${t.mod}` : t.mod;
          const targetText = targetLabel(t.target);
          lbl.textContent = `${t.name} (${t.target !== 'none' ? targetText + ' ' + modSign : ''} | ${t.pmCost} PM uma vez; próxima rolagem compatível)`;
          wrapper.appendChild(cb);
          wrapper.appendChild(lbl);
          activeContainer.appendChild(wrapper);
        });
      }

      document.getElementById('quick-notes').value = char.quickNotes || '';
      renderRollLog(char);

      document.getElementById('char-name').value = char.name;
      document.getElementById('player-name').value = char.player;
      document.getElementById('char-concept').value = char.concept;
      document.getElementById('char-scale').value = char.scale;
      document.getElementById('char-points-total').value = char.pointsTotal;
      document.getElementById('char-xp').value = char.xp;
      document.getElementById('points-summary').textContent =
        `${pts.spent} pontos gastos de ${char.pointsTotal} (Restam: ${pts.remaining} pts | Características: ${pts.statPoints} | Vantagens: +${pts.vants} | Desvantagens: ${pts.desvants} | Perícias: +${pts.powerPoints})`;

      ['F', 'H', 'R', 'A', 'PdF'].forEach(k => {
        document.getElementById('stat-' + k).value = char.stats[k];
        document.getElementById('stat-' + k + '-total').textContent = `Total Efetivo: ${eff[k]}`;
        document.getElementById('desc-' + k).value = char.statDescs[k] || '';
      });

      renderTraitsList(char);
      renderPowersList(char);

      document.getElementById('char-money').value = char.money || '';
      document.getElementById('char-inventory').value = char.inventory || '';

      document.getElementById('char-appearance').value = char.appearance || '';
      document.getElementById('char-personality').value = char.personality || '';
      document.getElementById('char-history').value = char.history || '';
      document.getElementById('read-appearance').textContent = char.appearance || 'Nenhuma aparência descrita.';
      document.getElementById('read-personality').textContent = char.personality || 'Nenhuma personalidade descrita.';
      document.getElementById('read-history').textContent = char.history || 'Nenhuma história escrita.';

      renderDiaryList(char);
      updateDynamicHeaders();
    }

    // --- RECURSOS DE COMBATE (PV E PM) ---
    function changeResource(type, delta) {
      const char = getActiveChar();
      const eff = getEffectiveStats(char);
      if (type === 'pv') {
        char.pvCurrent = Math.max(0, Math.min(eff.maxPV, char.pvCurrent + delta));
        playTone(delta < 0 ? 240 : 480, 'sine', 0.1);
        const nearDeath = char.pvCurrent <= eff.R && char.pvCurrent > 0 ? ' Atenção: Perto da Morte!' : '';
        const zeroAlert = char.pvCurrent === 0 ? ' Zero PVs! Personagem caiu!' : '';
        announce(`Pontos de Vida: ${char.pvCurrent} de ${eff.maxPV}.${nearDeath}${zeroAlert}`);
      } else {
        char.pmCurrent = Math.max(0, Math.min(eff.maxPM, char.pmCurrent + delta));
        playTone(delta < 0 ? 300 : 540, 'sine', 0.1);
        announce(`Pontos de Magia: ${char.pmCurrent} de ${eff.maxPM}.`);
      }
      saveState();
      renderCharacter();
    }

    function restoreResource(type) {
      const char = getActiveChar();
      const eff = getEffectiveStats(char);
      if (type === 'pv') {
        char.pvCurrent = eff.maxPV;
        announce(`Pontos de Vida restaurados ao máximo: ${eff.maxPV}`);
      } else {
        char.pmCurrent = eff.maxPM;
        announce(`Pontos de Magia restaurados ao máximo: ${eff.maxPM}`);
      }
      playTone(600, 'sine', 0.15);
      saveState();
      renderCharacter();
    }

    function applyCustomResource(type, multiplier) {
      const inputId = type === 'pv' ? 'pv-custom' : 'pm-custom';
      const val = parseInt(document.getElementById(inputId).value, 10) || 0;
      changeResource(type, val * multiplier);
    }

    // --- ROLADOR DE DADOS ---
    function addRollToLog(text) {
      const char = getActiveChar();
      const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      char.rollLog.unshift(`[${time}] ${text}`);
      if (char.rollLog.length > 10) char.rollLog.pop();
      saveState();
      renderRollLog(char);
    }

    function renderRollLog(char) {
      const ul = document.getElementById('roll-log-list');
      ul.innerHTML = '';
      if (!char.rollLog || char.rollLog.length === 0) {
        ul.innerHTML = '<li>Nenhuma rolagem realizada ainda.</li>';
        return;
      }
      char.rollLog.forEach(entry => {
        const li = document.createElement('li');
        li.style.padding = '0.35rem 0';
        li.style.borderBottom = '1px solid var(--border)';
        li.textContent = entry;
        ul.appendChild(li);
      });
    }

    function clearRollLog() {
      const char = getActiveChar();
      char.rollLog = [];
      saveState();
      renderRollLog(char);
      announce('Histórico de rolagens limpo.');
    }

    function applicableTemporaryTraits(char, rollType) {
      const targetsByAction = {
        fa_cc: ['FA', 'COMBAT', 'F', 'H'],
        fa_pdf: ['FA', 'COMBAT', 'PdF', 'H'],
        fd: ['FD', 'COMBAT', 'A', 'H'],
        init: ['INIT', 'H']
      };
      const targets = rollType.startsWith('stat:') ? [rollType.slice(5)] : (targetsByAction[rollType] || []);
      return char.traits.filter(t => t.mode === 'temporary' && t.active && targets.includes(t.target));
    }
    function temporaryCost(traits) { return traits.reduce((sum, trait) => sum + (Number(trait.pmCost) || 0), 0); }
    function consumeTemporaryTraits(traits) { traits.forEach(t => { t.active = false; }); }
    function consumeGlobalRollModifier() { document.getElementById('temp-mod').value = '0'; }

    function rollCombat(actionType) {
      const char = getActiveChar();
      const activeTemporary = applicableTemporaryTraits(char, actionType);
      const totalPmCost = temporaryCost(activeTemporary);
      const tempMod = parseInt(document.getElementById('temp-mod').value, 10) || 0;
      if (char.pmCurrent < totalPmCost) {
        playTone(180, 'sawtooth', 0.2);
        announce(`PM insuficiente para ${activeTemporary.map(t => t.name).join(', ')}. Custo: ${totalPmCost} PM; disponíveis: ${char.pmCurrent} PM.`, true);
        return;
      }
      const eff = getEffectiveStats(char);
      if (totalPmCost > 0) char.pmCurrent -= totalPmCost;
      const d6 = Math.floor(Math.random() * 6) + 1;
      const isCrit = d6 === 6;
      let total = 0; let msg = '';
      if (actionType === 'fa_cc') {
        const fVal = isCrit ? eff.F * 2 : eff.F;
        total = d6 + fVal + eff.H + eff.FA + eff.COMBAT + tempMod;
        const desc = char.statDescs.F ? ` (${char.statDescs.F})` : '';
        msg = `${isCrit ? 'CRÍTICO! ' : ''}Ataque Corpo a Corpo${desc}: Total ${total}. (Dado: ${d6} + F:${fVal} + H:${eff.H}${eff.FA ? ' + Bônus FA:' + eff.FA : ''}${eff.COMBAT ? ' + Bônus Combate:' + eff.COMBAT : ''}${tempMod ? ' + Mod temporário:' + tempMod : ''})`;
      } else if (actionType === 'fa_pdf') {
        const pdfVal = isCrit ? eff.PdF * 2 : eff.PdF;
        total = d6 + pdfVal + eff.H + eff.FA + eff.COMBAT + tempMod;
        const desc = char.statDescs.PdF ? ` (${char.statDescs.PdF})` : '';
        msg = `${isCrit ? 'CRÍTICO! ' : ''}Ataque à Distância${desc}: Total ${total}. (Dado: ${d6} + PdF:${pdfVal} + H:${eff.H}${eff.FA ? ' + Bônus FA:' + eff.FA : ''}${eff.COMBAT ? ' + Bônus Combate:' + eff.COMBAT : ''}${tempMod ? ' + Mod temporário:' + tempMod : ''})`;
      } else if (actionType === 'fd') {
        const aVal = isCrit ? eff.A * 2 : eff.A;
        total = d6 + aVal + eff.H + eff.FD + eff.COMBAT + tempMod;
        const desc = char.statDescs.A ? ` (${char.statDescs.A})` : '';
        msg = `${isCrit ? 'DEFESA CRÍTICA! ' : ''}Força de Defesa${desc}: Total ${total}. (Dado: ${d6} + A:${aVal} + H:${eff.H}${eff.FD ? ' + Bônus FD:' + eff.FD : ''}${eff.COMBAT ? ' + Bônus Combate:' + eff.COMBAT : ''}${tempMod ? ' + Mod temporário:' + tempMod : ''})`;
      } else if (actionType === 'init') {
        total = d6 + eff.H + eff.INIT + tempMod;
        msg = `Iniciativa: Total ${total}. (Dado: ${d6} + H:${eff.H}${eff.INIT ? ' + Bônus:' + eff.INIT : ''}${tempMod ? ' + Mod temporário:' + tempMod : ''})`;
      } else return;
      if (activeTemporary.length) {
        const names = activeTemporary.map(t => t.name).join(', ');
        msg += totalPmCost ? ` [Bônus temporários usados: ${names}; gastou ${totalPmCost} PM; restam ${char.pmCurrent} PM]` : ` [Bônus temporários usados: ${names}]`;
        consumeTemporaryTraits(activeTemporary);
      }
      consumeGlobalRollModifier();
      if (isCrit && actionType !== 'init') soundCrit(); else soundRoll();
      addRollToLog(msg); renderCharacter(); announce(msg);
    }

    function rollStatTest(statKey) {
      const char = getActiveChar();
      const activeTemporary = applicableTemporaryTraits(char, `stat:${statKey}`);
      const totalPmCost = temporaryCost(activeTemporary);
      const tempMod = parseInt(document.getElementById('temp-mod').value, 10) || 0;
      if (char.pmCurrent < totalPmCost) {
        playTone(180, 'sawtooth', 0.2);
        announce(`PM insuficiente para o bônus ${activeTemporary.map(t => t.name).join(', ')}. Custo: ${totalPmCost} PM; disponíveis: ${char.pmCurrent} PM.`, true);
        return;
      }
      const eff = getEffectiveStats(char);
      if (totalPmCost > 0) char.pmCurrent -= totalPmCost;
      const target = Math.max(0, eff[statKey] + tempMod);
      const d6 = Math.floor(Math.random() * 6) + 1;
      let success = false; let detail = '';
      if (d6 === 6) { detail = 'FALHA CRÍTICA AUTOMÁTICA (tirou 6)!'; soundFumble(); }
      else if (d6 === 1 && target >= 1) { success = true; detail = 'SUCESSO AUTOMÁTICO (tirou 1)!'; soundCrit(); }
      else { success = d6 <= target; detail = success ? 'SUCESSO!' : 'FALHA!'; if (success) soundRoll(); else soundFumble(); }
      const names = activeTemporary.map(t => t.name).join(', ');
      const costNote = activeTemporary.length ? ` Bônus temporários usados: ${names}${totalPmCost ? `; gastou ${totalPmCost} PM, restam ${char.pmCurrent} PM.` : '.'}` : '';
      const msg = `Teste de ${statKey} (Alvo <= ${target}): Dado caiu ${d6}. ${detail}${costNote}`;
      consumeTemporaryTraits(activeTemporary); consumeGlobalRollModifier();
      addRollToLog(msg); renderCharacter(); announce(msg);
    }

    function rollGeneric(label, count, sides) {
      const rolls = [];
      let sum = 0;
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        sum += r;
      }
      soundRoll();
      const msg = `Rolagem ${label}: Total ${sum} (Dados: ${rolls.join(', ')})`;
      addRollToLog(msg);
      announce(msg);
    }

    // --- VANTAGENS E DESVANTAGENS ---
    function addTrait() {
      const name = document.getElementById('trait-name').value.trim();
      if (!name) { announce('Digite o nome da vantagem ou desvantagem.'); document.getElementById('trait-name').focus(); return; }
      const mode = document.getElementById('trait-mode').value;
      const target = document.getElementById('trait-target').value;
      const modifier = parseInt(document.getElementById('trait-mod').value, 10) || 0;
      const pmCost = Math.max(0, parseInt(document.getElementById('trait-pm').value, 10) || 0);
      if (mode !== 'none' && target === 'none') { announce('Escolha o atributo afetado para um bônus numérico.'); document.getElementById('trait-target').focus(); return; }
      if (mode === 'temporary' && ['PV_MAX', 'PM_MAX'].includes(target)) { announce('Bônus diretos de PV/PM máximo devem ser permanentes; bônus temporários são para rolagens.'); document.getElementById('trait-mode').focus(); return; }
      if (mode === 'permanent' && pmCost > 0) { announce('Bônus permanentes não gastam PM. Para cobrar PM, escolha o modo temporário.'); document.getElementById('trait-pm').focus(); return; }
      const char = getActiveChar();
      const newTrait = {
        id: 't_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name, category: document.getElementById('trait-category').value,
        cost: parseInt(document.getElementById('trait-cost').value, 10) || 0,
        mode, target, mod: modifier, pmCost: mode === 'temporary' ? pmCost : 0,
        active: false, desc: document.getElementById('trait-desc').value.trim()
      };
      char.traits.push(newTrait);
      document.getElementById('trait-name').value = '';
      document.getElementById('trait-desc').value = '';
      document.getElementById('trait-mod').value = '0';
      document.getElementById('trait-pm').value = '0';
      saveState(); renderCharacter(); announce(`${newTrait.category} ${newTrait.name} adicionada à ficha.`);
    }

    function removeTrait(id) {
      const char = getActiveChar();
      const idx = char.traits.findIndex(t => t.id === id);
      if (idx > -1) {
        const removed = char.traits.splice(idx, 1)[0];
        saveState();
        renderCharacter();
        announce(`${removed.name} removida da ficha.`);
      }
    }

    function targetLabel(target) {
      return ({ FA: 'Força de Ataque', FD: 'Força de Defesa', COMBAT: 'Ataque e Defesa', F: 'Força', H: 'Habilidade', R: 'Resistência', A: 'Armadura', PdF: 'Poder de Fogo', PV_MAX: 'PV máximo', PM_MAX: 'PM máximo', INIT: 'Iniciativa' })[target] || target;
    }

    function renderTraitsList(char) {
      const ul = document.getElementById('traits-list');
      ul.innerHTML = '';
      if (char.traits.length === 0) {
        ul.innerHTML = '<li>Nenhuma vantagem ou desvantagem cadastrada.</li>';
        return;
      }
      char.traits.forEach(t => {
        const li = document.createElement('li');
        li.className = 'card';
        const row = document.createElement('div');
        row.className = 'flex-row';
        row.style.justifyContent = 'space-between';
        const effectBadge = t.mode !== 'none' && t.target !== 'none'
          ? ` | Efeito (${t.mode === 'permanent' ? 'Permanente' : 'Temporário, próxima rolagem compatível'}): ${targetLabel(t.target)} ${t.mod >= 0 ? '+' + t.mod : t.mod}${t.mode === 'temporary' && t.pmCost ? ' (' + t.pmCost + ' PM uma vez)' : ''}`
          : '';
        const strong = document.createElement('strong');
        strong.textContent = `${t.name} (${t.category} | ${t.cost} pts${effectBadge})`;
        const remove = document.createElement('button');
        remove.type = 'button'; remove.className = 'btn-danger'; remove.textContent = 'Remover';
        remove.setAttribute('aria-label', `Remover ${t.name}`);
        remove.addEventListener('click', () => removeTrait(t.id));
        row.append(strong, remove); li.append(row);
        if (t.desc) { const p = document.createElement('p'); p.style.cssText = 'margin:0.5rem 0 0 0; white-space:pre-wrap;'; p.textContent = t.desc; li.append(p); }
        ul.appendChild(li);
      });
    }

    // --- PERÍCIAS E MAGIAS ---
    function addPower() {
      const name = document.getElementById('power-name').value.trim();
      if (!name) {
        announce('Digite o nome da perícia ou magia.');
        document.getElementById('power-name').focus();
        return;
      }
      const char = getActiveChar();
      const newPower = {
        id: 'p_' + Date.now(),
        name: name,
        type: document.getElementById('power-type').value,
        points: parseInt(document.getElementById('power-points').value, 10) || 0,
        pmCost: parseInt(document.getElementById('power-pm').value, 10) || 0,
        desc: document.getElementById('power-desc').value.trim()
      };
      char.powers.push(newPower);
      document.getElementById('power-name').value = '';
      document.getElementById('power-desc').value = '';
      document.getElementById('power-points').value = '0';
      document.getElementById('power-pm').value = '0';
      saveState();
      renderCharacter();
      announce(`${newPower.type} ${newPower.name} adicionada.`);
    }

    function usePower(id) {
      const char = getActiveChar();
      const p = char.powers.find(item => item.id === id);
      if (!p) return;
      if (p.pmCost > 0) {
        if (char.pmCurrent < p.pmCost) {
          playTone(180, 'sawtooth', 0.2);
          announce(`PM insuficiente para lançar ${p.name}! Custa ${p.pmCost} PM e você tem ${char.pmCurrent} PM.`);
          return;
        }
        char.pmCurrent -= p.pmCost;
      }
      soundRoll();
      const msg = `Usou ${p.name} (${p.type})${p.pmCost > 0 ? ` — Gastou ${p.pmCost} PM (Restam ${char.pmCurrent} PM)` : ''}.`;
      addRollToLog(msg);
      saveState();
      renderCharacter();
      announce(msg);
    }

    function removePower(id) {
      const char = getActiveChar();
      char.powers = char.powers.filter(p => p.id !== id);
      saveState();
      renderCharacter();
      announce('Item removido de Perícias e Magias.');
    }

    function renderPowersList(char) {
      const ul = document.getElementById('powers-list');
      ul.innerHTML = '';
      if (char.powers.length === 0) {
        ul.innerHTML = '<li>Nenhuma perícia ou magia cadastrada.</li>';
        return;
      }
      char.powers.forEach(p => {
        const li = document.createElement('li'); li.className = 'card';
        const row = document.createElement('div'); row.className = 'flex-row'; row.style.justifyContent = 'space-between';
        const title = document.createElement('strong');
        title.textContent = `${p.name} (${p.type} | Custo: ${p.pmCost} PM${p.points ? ' | ' + p.points + ' pts' : ''})`;
        const actions = document.createElement('div'); actions.className = 'flex-row';
        const use = document.createElement('button'); use.type = 'button'; use.textContent = p.pmCost > 0 ? `Usar / Lançar (-${p.pmCost} PM)` : 'Usar / Lançar';
        use.addEventListener('click', () => usePower(p.id));
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn-danger'; remove.textContent = 'Remover';
        remove.setAttribute('aria-label', `Remover ${p.name}`); remove.addEventListener('click', () => removePower(p.id));
        actions.append(use, remove); row.append(title, actions); li.append(row);
        if (p.desc) { const desc = document.createElement('p'); desc.style.cssText = 'margin:0.5rem 0 0 0; white-space:pre-wrap;'; desc.textContent = p.desc; li.append(desc); }
        ul.appendChild(li);
      });
    }

    // --- HISTÓRIA E DIÁRIO ---
    function toggleBioMode() {
      bioEditMode = !bioEditMode;
      document.getElementById('bio-read-view').hidden = bioEditMode;
      document.getElementById('bio-edit-view').hidden = !bioEditMode;
      const btn = document.getElementById('btn-toggle-bio-mode');
      btn.textContent = bioEditMode ? 'Alternar para Modo Leitura (Parágrafos)' : 'Alternar para Modo Edição';
      announce(bioEditMode ? 'Modo de edição da história ativado.' : 'Modo de leitura em parágrafos ativado.');
    }

    function addDiaryEntry() {
      const titleInput = document.getElementById('diary-title');
      const textInput = document.getElementById('diary-text');
      const text = textInput.value.trim();
      if (!text) {
        announce('Escreva alguma anotação antes de salvar no diário.');
        textInput.focus();
        return;
      }
      const char = getActiveChar();
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const title = titleInput.value.trim() || `Sessão (${dateStr})`;
      char.diary.unshift({
        id: 'd_' + Date.now(),
        title: `${title} - ${dateStr}`,
        text: text
      });
      titleInput.value = '';
      textInput.value = '';
      saveState();
      renderCharacter();
      announce(`Entrada "${title}" salva no diário de sessão.`);
    }

    function removeDiaryEntry(id) {
      const char = getActiveChar();
      char.diary = char.diary.filter(d => d.id !== id);
      saveState();
      renderCharacter();
      announce('Anotação de sessão removida.');
    }

    function renderDiaryList(char) {
      const container = document.getElementById('diary-list');
      container.innerHTML = '';
      if (char.diary.length === 0) {
        container.innerHTML = '<p>Nenhuma sessão registrada no diário ainda.</p>';
        return;
      }
      char.diary.forEach(d => {
        const article = document.createElement('article'); article.className = 'card';
        const row = document.createElement('div'); row.className = 'flex-row'; row.style.justifyContent = 'space-between';
        const title = document.createElement('h4'); title.style.margin = '0'; title.textContent = d.title;
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn-danger'; remove.textContent = 'Excluir';
        remove.setAttribute('aria-label', `Excluir anotação ${d.title}`); remove.addEventListener('click', () => removeDiaryEntry(d.id));
        row.append(title, remove);
        const text = document.createElement('p'); text.style.cssText = 'margin:0.5rem 0 0 0; white-space:pre-wrap;'; text.textContent = d.text;
        article.append(row, text); container.appendChild(article);
      });
    }

    // --- MÚLTIPLOS PERSONAGENS E EXPORTAÇÃO ---
    function populateCharSelect() {
      const sel = document.getElementById('char-select');
      sel.innerHTML = '';
      appState.characters.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.concept || '3D&T'})`;
        if (c.id === appState.activeCharId) opt.selected = true;
        sel.appendChild(opt);
      });
    }

    function switchCharacter(charId) {
      document.getElementById('temp-mod').value = '0';
      appState.activeCharId = charId;
      saveState();
      renderCharacter();
      announce(`Personagem alternado para ${getActiveChar().name}.`);
    }

    function createNewCharacter() {
      const name = prompt('Digite o nome do novo personagem:', 'Novo Personagem');
      if (!name) return;
      const newChar = createDefaultCharacter(name.trim());
      appState.characters.push(newChar);
      document.getElementById('temp-mod').value = '0';
      appState.activeCharId = newChar.id;
      saveState();
      populateCharSelect();
      renderCharacter();
      announce(`Personagem ${newChar.name} criado e selecionado.`);
    }

    function deleteCurrentCharacter() {
      if (appState.characters.length <= 1) {
        announce('Você precisa ter pelo menos um personagem salvo na ficha.');
        return;
      }
      const char = getActiveChar();
      if (confirm(`Tem certeza que deseja excluir permanentemente a ficha de ${char.name}?`)) {
        appState.characters = appState.characters.filter(c => c.id !== char.id);
        document.getElementById('temp-mod').value = '0';
        appState.activeCharId = appState.characters[0].id;
        saveState();
        populateCharSelect();
        renderCharacter();
        announce(`Personagem excluído. Ficha ativa agora é ${getActiveChar().name}.`);
      }
    }

    function copyMarkdownSummary() {
      const char = getActiveChar();
      const eff = getEffectiveStats(char);
      const pts = calculatePoints(char);
      const vants = char.traits.map(t => `${t.name} (${t.cost} pts)`).join(', ') || 'Nenhuma';
      const powers = char.powers.map(p => `${p.name} (${p.pmCost} PM)`).join(', ') || 'Nenhuma';

      const md = [
        `*${char.name}* (${char.concept} — ${char.scale} — ${pts.spent}/${char.pointsTotal} pts | ${char.xp} PEs)`,
        `*PV:* ${char.pvCurrent}/${eff.maxPV} | *PM:* ${char.pmCurrent}/${eff.maxPM}`,
        `*Características:* F${eff.F}, H${eff.H}, R${eff.R}, A${eff.A}, PdF${eff.PdF}`,
        `*Vantagens e Desvantagens:* ${vants}`,
        `*Perícias e Magias:* ${powers}`
      ].join('\n');

      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        announce('A cópia automática não está disponível neste navegador.', true); return;
      }
      navigator.clipboard.writeText(md).then(() => {
        announce('Resumo da ficha copiado para a área de transferência!');
      }).catch(() => announce('Não foi possível copiar o resumo. Verifique a permissão da área de transferência.', true));
    }

    function exportJSON() {
      const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'fichas-3det-alpha.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      announce('Arquivo JSON de backup exportado.');
    }

    function importJSON(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { announce('O arquivo excede o limite de 5 MB.', true); e.target.value = ''; document.getElementById('btn-import-json').focus(); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          const normalized = normalizeState(imported);
          if (normalized) {
            appState = normalized;
            document.getElementById('temp-mod').value = '0';
            saveState(); populateCharSelect(); applySavedAccordions(); renderCharacter();
            announce('Fichas importadas. Confira os itens migrados e suas regras.');
          } else announce('Arquivo JSON inválido ou sem personagens.', true);
        } catch (err) {
          announce('Erro ao ler o arquivo JSON.', true);
        } finally {
          e.target.value = '';
          document.getElementById('btn-import-json').focus();
        }
      };
      reader.onerror = () => { announce('Não foi possível ler o arquivo JSON.', true); e.target.value = ''; document.getElementById('btn-import-json').focus(); };
      reader.readAsText(file);
    }

    // --- INICIALIZAÇÃO ---
    window.addEventListener('DOMContentLoaded', () => {
      loadState();
      populateCharSelect();
      applySavedAccordions();

      document.getElementById('btn-import-json').addEventListener('click', () => document.getElementById('input-import-json').click());
      const soundBtn = document.getElementById('btn-toggle-sound');
      soundBtn.setAttribute('aria-pressed', String(appState.soundEnabled));
      soundBtn.textContent = `Som: ${appState.soundEnabled ? 'Ligado' : 'Desligado'}`;

      renderCharacter();
    });
