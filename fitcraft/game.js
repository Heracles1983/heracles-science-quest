/* FITCRAFT — a small, accessible fitness knowledge card game. */
(function () {
  'use strict';

  const STORAGE_KEY = 'fitcraft-v1';
  const RULES = Object.freeze({ playerHealth: 30, bossHealth: 40, energy: 3, damage: 10, mistakeDamage: 8, comboEvery: 3, comboDamage: 5, correctScore: 100, comboScore: 50, shieldMax: 8 });
  const SKILLS = Object.freeze({ insight: Object.freeze({ cost: 1, charges: 2, name: '智慧洞察' }), guard: Object.freeze({ cost: 1, charges: 2, name: '科学屏障' }), restore: Object.freeze({ cost: 2, charges: 1, name: '恢复之息' }) });
  const boundedInt = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback;

  // Pure rule helpers are exposed so the battle rules can be checked without a browser.
  function createBattle(queue, chapterId, mode) {
    return { queue: queue.slice(), chapterId: String(chapterId), mode: mode || 'chapter', cursor: 0, answered: false, selected: -1, playerHp: RULES.playerHealth, bossHp: RULES.bossHealth, energy: RULES.energy, combo: 0, score: 0, correctCount: 0, wrongCount: 0, defeatedBoss: false, ended: false, settled: false, shield: 0, skillCharges: { insight: 2, guard: 2, restore: 1 }, turnSkills: [], eliminated: [], resolution: null };
  }

  function skillUnavailable(battle, name) {
    if (!Object.hasOwn(SKILLS, name)) return '技能不可用';
    const skill = SKILLS[name];
    if (!battle || !skill || !battle.queue[battle.cursor]) return '暂无可用回合';
    if (battle.ended || battle.answered) return '出牌后，下一回合再施放技能';
    if (!battle.skillCharges[name]) return '本局次数已用完';
    if (battle.turnSkills.includes(name)) return '本回合已施放';
    if (battle.energy - skill.cost < 1) return '需保留 1 点能量出牌';
    if (name === 'restore' && battle.playerHp >= RULES.playerHealth) return '生命已满';
    if (name === 'guard' && battle.shield >= RULES.shieldMax) return '护盾已满';
    return '';
  }

  function castSkill(battle, name) {
    if (skillUnavailable(battle, name)) return null;
    const skill = SKILLS[name];
    battle.energy -= skill.cost;
    battle.skillCharges[name] -= 1;
    battle.turnSkills.push(name);
    let amount = 0;
    if (name === 'insight') {
      const question = battle.queue[battle.cursor];
      const index = question.options.findIndex((_, option) => option !== question.correct && !battle.eliminated.includes(option));
      battle.eliminated.push(index);
      amount = index;
    } else if (name === 'guard') {
      amount = Math.min(4, RULES.shieldMax - battle.shield);
      battle.shield += amount;
    } else {
      amount = Math.min(6, RULES.playerHealth - battle.playerHp);
      battle.playerHp += amount;
    }
    return { name, amount };
  }

  function resolveAnswer(battle, optionIndex) {
    if (!battle || battle.answered || battle.ended) return null;
    const question = battle.queue[battle.cursor];
    if (!question || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= question.options.length || battle.energy < 1 || battle.eliminated.includes(optionIndex)) return null;
    const correct = optionIndex === Number(question.correct);
    battle.answered = true;
    battle.selected = optionIndex;
    battle.energy = Math.max(0, battle.energy - 1);
    let damage = 0;
    let comboBonus = false;
    let absorbed = 0;
    let playerDamage = 0;
    if (correct) {
      battle.combo += 1;
      comboBonus = battle.combo % RULES.comboEvery === 0;
      damage = RULES.damage + (comboBonus ? RULES.comboDamage : 0);
      battle.bossHp = Math.max(0, battle.bossHp - damage);
      battle.score += RULES.correctScore + (comboBonus ? RULES.comboScore : 0);
      battle.correctCount += 1;
      if (battle.bossHp === 0) battle.defeatedBoss = true;
    } else {
      battle.combo = 0;
      absorbed = Math.min(battle.shield, RULES.mistakeDamage);
      battle.shield -= absorbed;
      playerDamage = RULES.mistakeDamage - absorbed;
      battle.playerHp = Math.max(0, battle.playerHp - playerDamage);
      battle.wrongCount += 1;
    }
    battle.ended = battle.playerHp === 0 || battle.cursor >= battle.queue.length - 1;
    battle.resolution = { correct, damage, comboBonus, absorbed, playerDamage };
    return { ...battle.resolution, question, finished: battle.ended };
  }

  function advanceBattle(battle) {
    if (!battle || !battle.answered || battle.ended) return false;
    battle.cursor += 1;
    battle.answered = false;
    battle.selected = -1;
    battle.energy = RULES.energy;
    battle.turnSkills = [];
    battle.eliminated = [];
    battle.resolution = null;
    return true;
  }

  function snapshotBattle(battle) {
    if (!battle) return null;
    const { chapterId, mode, cursor, answered, selected, playerHp, bossHp, energy, combo, score, correctCount, wrongCount, defeatedBoss, ended, settled, shield, skillCharges, turnSkills, eliminated, resolution } = battle;
    return { version: 1, queueIds: battle.queue.map(question => question.id), chapterId, mode, cursor, answered, selected, playerHp, bossHp, energy, combo, score, correctCount, wrongCount, defeatedBoss, ended, settled, shield, skillCharges: { ...skillCharges }, turnSkills: turnSkills.slice(), eliminated: eliminated.slice(), resolution: resolution ? { ...resolution } : null };
  }

  function restoreBattle(saved, questions, chapters) {
    if (!saved || saved.version !== 1 || !Array.isArray(saved.queueIds) || !saved.queueIds.length || saved.queueIds.length > questions.length || !chapters.some(chapter => chapter.id === saved.chapterId) || !['chapter', 'review'].includes(saved.mode)) return null;
    const byId = new Map(questions.map(question => [question.id, question]));
    const ids = saved.queueIds.filter(id => typeof id === 'string' && byId.has(id));
    if (ids.length !== saved.queueIds.length || new Set(ids).size !== ids.length) return null;
    const queue = ids.map(id => byId.get(id));
    if (saved.mode === 'chapter' && queue.some(question => question.chapter !== saved.chapterId)) return null;
    const battle = createBattle(queue, saved.chapterId, saved.mode);
    battle.cursor = boundedInt(saved.cursor, 0, 0, queue.length - 1);
    const question = queue[battle.cursor];
    const selected = boundedInt(saved.selected, -1, -1, question.options.length - 1);
    battle.answered = saved.answered === true && selected >= 0;
    battle.selected = battle.answered ? selected : -1;
    battle.playerHp = boundedInt(saved.playerHp, RULES.playerHealth, 0, RULES.playerHealth);
    if (!battle.answered && battle.playerHp === 0) return null;
    battle.bossHp = boundedInt(saved.bossHp, RULES.bossHealth, 0, RULES.bossHealth);
    battle.shield = boundedInt(saved.shield, 0, 0, RULES.shieldMax);
    battle.turnSkills = Array.isArray(saved.turnSkills) ? [...new Set(saved.turnSkills.filter(name => Object.hasOwn(SKILLS, name)))] : [];
    if (battle.turnSkills.reduce((sum, name) => sum + SKILLS[name].cost, 0) > RULES.energy - 1) battle.turnSkills = [];
    Object.keys(SKILLS).forEach(name => { battle.skillCharges[name] = boundedInt(saved.skillCharges && saved.skillCharges[name], SKILLS[name].charges - (battle.turnSkills.includes(name) ? 1 : 0), 0, SKILLS[name].charges - (battle.turnSkills.includes(name) ? 1 : 0)); });
    battle.eliminated = battle.turnSkills.includes('insight') && Array.isArray(saved.eliminated) ? saved.eliminated.filter(index => Number.isInteger(index) && index >= 0 && index < question.options.length && index !== question.correct).slice(0, 1) : [];
    if (battle.answered && battle.eliminated.includes(selected)) return null;
    battle.energy = RULES.energy - battle.turnSkills.reduce((sum, name) => sum + SKILLS[name].cost, 0) - (battle.answered ? 1 : 0);
    const completed = battle.cursor + (battle.answered ? 1 : 0);
    battle.correctCount = boundedInt(saved.correctCount, 0, 0, completed);
    battle.wrongCount = boundedInt(saved.wrongCount, completed - battle.correctCount, 0, completed - battle.correctCount);
    battle.combo = boundedInt(saved.combo, 0, 0, battle.correctCount);
    battle.score = boundedInt(saved.score, 0, 0, completed * (RULES.correctScore + RULES.comboScore));
    battle.defeatedBoss = battle.bossHp === 0;
    battle.ended = battle.playerHp === 0 || (battle.answered && battle.cursor === queue.length - 1);
    battle.settled = battle.ended && saved.settled === true;
    if (battle.answered) {
      const correct = selected === question.correct;
      if (!correct) battle.combo = 0;
      const comboBonus = correct && battle.combo > 0 && battle.combo % RULES.comboEvery === 0;
      const playerDamage = correct ? 0 : boundedInt(saved.resolution && saved.resolution.playerDamage, RULES.mistakeDamage, 0, RULES.mistakeDamage);
      battle.resolution = { correct, damage: correct ? RULES.damage + (comboBonus ? RULES.comboDamage : 0) : 0, comboBonus, playerDamage, absorbed: correct ? 0 : RULES.mistakeDamage - playerDamage };
    }
    return battle;
  }

  window.FITCRAFT_RULES = Object.freeze({ constants: RULES, skills: SKILLS, createBattle, resolveAnswer, advanceBattle, skillUnavailable, castSkill, snapshotBattle, restoreBattle });

  function init() {
    const raw = window.FITNESS_DATA;
    if (!raw || !Array.isArray(raw.chapters) || !Array.isArray(raw.questions)) return;
    const chapters = raw.chapters.filter(chapter => chapter && chapter.id != null).map(chapter => ({ ...chapter, id: String(chapter.id) }));
    const questions = raw.questions.filter(question => question && question.id != null && Array.isArray(question.options) && question.options.length === 3 && Number.isInteger(Number(question.correct)) && Number(question.correct) >= 0 && Number(question.correct) < 3).map(question => ({ ...question, id: String(question.id), chapter: String(question.chapter), correct: Number(question.correct) }));
    if (!chapters.length || !questions.length) return;

    const $ = id => document.getElementById(id);
    const els = Object.fromEntries(['arena-view', 'collection-view', 'chapter-list', 'chapter-kicker', 'chapter-title', 'chapter-subtitle', 'boss-name', 'boss-subtitle', 'boss-hp', 'boss-maxhp', 'boss-health-fill', 'boss-portrait', 'player-hp', 'player-health-fill', 'round-label', 'energy-count', 'energy-gems', 'question-title', 'question-tag', 'question-prompt', 'hand', 'feedback', 'feedback-title', 'feedback-copy', 'feedback-source', 'next-turn', 'turn-hint', 'combo-count', 'battle-score', 'learned-count', 'collection-count', 'quest-progress', 'quest-progress-fill', 'collection-grid', 'collection-filters', 'review-button', 'battle-reset', 'sound-toggle', 'help-button', 'help-dialog', 'help-close', 'result-dialog', 'toast', 'attack-fx', 'game-board', 'nav-arena', 'nav-collection', 'skill-panel', 'skill-hint', 'shield-count'].map(id => [id, $(id)]));
    const questionIds = new Set(questions.map(question => question.id));
    const chapterIds = new Set(chapters.map(chapter => chapter.id));
    const chapterById = id => chapters.find(chapter => chapter.id === String(id)) || chapters[0];
    const questionById = id => questions.find(question => question.id === String(id));
    const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    const safeUrl = value => { try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : ''; } catch (_) { return ''; } };
    const text = (name, value) => { if (els[name]) els[name].textContent = String(value); };
    const hidden = (element, value) => { if (element) { element.hidden = value; element.classList.toggle('hidden', value); } };
    const mark = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2 12 8 18 10 12 12 10 18 8 12 2 10 8 8Z" fill="currentColor"/></svg>';
    const externalMark = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3H3v10h10v-3M9 3h4v4M7 9l6-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function readProgress() {
      const blank = { version: 1, learnedIds: [], wrongIds: [], clearedChapters: [], bestScore: 0, chapterBest: {}, sound: true, activeChapter: chapters[0].id, battle: null };
      try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
        if (!saved || saved.version !== 1) return blank;
        const knownList = (list, allowed) => Array.isArray(list) ? [...new Set(list.map(String).filter(id => allowed.has(id)))] : [];
        const chapterBest = {};
        chapters.forEach(chapter => { chapterBest[chapter.id] = boundedInt(saved.chapterBest && saved.chapterBest[chapter.id], 0, 0, questions.filter(question => question.chapter === chapter.id).length * 150); });
        return { ...blank, learnedIds: knownList(saved.learnedIds, questionIds), wrongIds: knownList(saved.wrongIds, questionIds), clearedChapters: knownList(saved.clearedChapters, chapterIds), bestScore: boundedInt(saved.bestScore, 0, 0, questions.length * 150), chapterBest, sound: saved.sound !== false, activeChapter: chapterIds.has(String(saved.activeChapter)) ? String(saved.activeChapter) : chapters[0].id, battle: snapshotBattle(restoreBattle(saved.battle, questions, chapters)) };
      } catch (_) { return blank; }
    }

    let progress = readProgress();
    let battle = restoreBattle(progress.battle, questions, chapters);
    let currentView = 'arena';
    let collectionFilter = 'all';
    let toastTimer;
    let effectTimer;
    let audioContext;
    const prefersReducedMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    function saveProgress() {
      progress.battle = snapshotBattle(battle);
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* The game still works when local storage is unavailable. */ }
    }

    function toast(message) {
      if (!els.toast) return;
      window.clearTimeout(toastTimer);
      els.toast.textContent = message;
      els.toast.classList.add('visible');
      hidden(els.toast, false);
      toastTimer = window.setTimeout(() => { els.toast.classList.remove('visible'); hidden(els.toast, true); }, 3000);
    }

    function playSound(kind) {
      if (!progress.sound) return;
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        if (!audioContext) audioContext = new Audio();
        if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
        const notes = kind === 'wrong' ? [220, 164.8] : kind === 'combo' ? [523.3, 659.3, 784] : [523.3, 659.3];
        const start = audioContext.currentTime;
        notes.forEach((frequency, index) => {
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const at = start + index * 0.085;
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, at);
          gain.gain.linearRampToValueAtTime(0.035, at + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.001, at + 0.17);
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.start(at);
          oscillator.stop(at + 0.18);
        });
      } catch (_) { /* Audio is decorative and must never block a turn. */ }
    }

    function syncSound() {
      const button = els['sound-toggle'];
      if (!button) return;
      button.dataset.muted = String(!progress.sound);
      button.setAttribute('aria-pressed', String(!progress.sound));
      button.setAttribute('aria-label', progress.sound ? '关闭音效' : '开启音效');
      button.title = progress.sound ? '关闭音效' : '开启音效';
      button.classList.toggle('muted', !progress.sound);
      const label = button.querySelector('[data-sound-label]');
      if (label) label.textContent = progress.sound ? '音效开' : '音效关';
      else if (!button.querySelector('svg')) button.textContent = progress.sound ? '音效开' : '音效关';
    }

    function isDialogOpen() {
      return ['help-dialog', 'result-dialog'].some(id => els[id] && (els[id].open || els[id].hasAttribute('open')));
    }

    function showDialog(dialog) {
      if (!dialog) return;
      try { if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', ''); }
      catch (_) { dialog.setAttribute('open', ''); }
      document.body.classList.add('modal-open');
      renderSkills();
    }

    function closeDialog(dialog) {
      if (!dialog) return;
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      if (!isDialogOpen()) document.body.classList.remove('modal-open');
      renderSkills();
    }

    function updateProgressUi() {
      const learned = progress.learnedIds.length;
      text('learned-count', learned);
      text('collection-count', `${learned} / ${questions.length}`);
      text('quest-progress', `${learned} / ${questions.length}`);
      if (els['quest-progress-fill']) els['quest-progress-fill'].style.width = `${learned / questions.length * 100}%`;
      if (els['review-button']) {
        els['review-button'].disabled = progress.wrongIds.length === 0;
        els['review-button'].setAttribute('aria-label', `复习 ${progress.wrongIds.length} 道错题`);
        const label = els['review-button'].querySelector('[data-review-label]') || els['review-button'].querySelector('span');
        if (label) label.textContent = `错题复习 · ${progress.wrongIds.length}`;
        else els['review-button'].textContent = `错题复习 · ${progress.wrongIds.length}`;
      }
      renderChapterList();
    }

    function renderChapterList() {
      if (!els['chapter-list']) return;
      els['chapter-list'].innerHTML = chapters.map((chapter, index) => {
        const cleared = progress.clearedChapters.includes(chapter.id);
        const active = battle && battle.mode === 'chapter' && battle.chapterId === chapter.id;
        const chapterCount = questions.filter(question => question.chapter === chapter.id).length;
        return `<button type="button" class="chapter-button chapter-${escapeHtml(chapter.id)}${active ? ' active' : ''}${cleared ? ' completed' : ''}" data-chapter="${escapeHtml(chapter.id)}" aria-pressed="${active}"><span class="chapter-icon"><svg aria-hidden="true"><use href="#i-${escapeHtml(chapter.icon || 'sword')}"/></svg></span><span class="chapter-info"><small>CHAPTER 0${index + 1}</small><strong>${escapeHtml(chapter.title)}</strong><span>${escapeHtml(chapter.subtitle || `${chapterCount} 道知识挑战`)}</span></span><span class="chapter-status">${cleared ? '已通关' : `${chapterCount} 回合`}</span></button>`;
      }).join('');
    }

    function healthBar(id, current, maximum) {
      const bar = els[id];
      if (!bar) return;
      bar.style.width = `${Math.max(0, Math.min(100, current / maximum * 100))}%`;
      bar.setAttribute('aria-valuenow', String(current));
      bar.setAttribute('aria-valuemax', String(maximum));
      bar.classList.toggle('low-health', current / maximum <= 0.25);
    }

    function setArt(element, art) {
      if (!element) return;
      for (let index = 0; index < 6; index += 1) element.classList.remove(`art-${index}`);
      element.classList.add(`art-${Number.isInteger(Number(art)) ? Number(art) : 4}`);
    }

    function renderBattleStats() {
      if (!battle) return;
      text('boss-hp', battle.bossHp);
      text('boss-maxhp', RULES.bossHealth);
      text('player-hp', battle.playerHp);
      text('round-label', `第 ${battle.cursor + 1} / ${battle.queue.length} 回合`);
      text('energy-count', battle.energy);
      text('combo-count', battle.combo);
      text('battle-score', battle.score);
      text('shield-count', battle.shield);
      healthBar('boss-health-fill', battle.bossHp, RULES.bossHealth);
      healthBar('player-health-fill', battle.playerHp, RULES.playerHealth);
      if (els['energy-gems']) els['energy-gems'].innerHTML = Array.from({ length: RULES.energy }, (_, index) => `<span class="energy-gem ${index < battle.energy ? 'filled is-filled' : 'empty is-empty'}" aria-hidden="true"></span>`).join('');
      if (els['boss-portrait']) els['boss-portrait'].classList.toggle('defeated', battle.defeatedBoss);
      renderSkills();
    }

    function renderSkills() {
      if (els['skill-panel']) Array.from(els['skill-panel'].querySelectorAll('[data-skill]')).forEach(button => {
        const name = button.dataset.skill;
        if (!Object.hasOwn(SKILLS, name)) { button.disabled = true; return; }
        const unavailable = currentView !== 'arena' ? '返回修炼场施放技能' : isDialogOpen() ? '关闭弹窗后施放技能' : skillUnavailable(battle, name);
        button.disabled = Boolean(unavailable);
        button.setAttribute('aria-disabled', String(button.disabled));
        button.title = unavailable || `${SKILLS[name].name} · 消耗 ${SKILLS[name].cost} 点能量`;
        const remaining = button.querySelector('[data-remaining]');
        if (remaining) remaining.textContent = String(battle && battle.skillCharges[name] || 0);
      });
      text('skill-hint', !battle ? '每回合先施法，再出知识卡' : battle.ended ? '本局已结束，查看战报总结收获' : battle.answered ? '本回合已出牌，下一回合恢复 3 点能量' : battle.energy === 1 ? '已保留最后 1 点能量，请打出知识卡' : '先施放技能，至少保留 1 点能量出牌');
    }

    function useSkill(name) {
      if (currentView !== 'arena' || isDialogOpen()) return;
      const result = castSkill(battle, name);
      if (!result) return;
      saveProgress();
      if (name === 'insight' && els.hand) Array.from(els.hand.querySelectorAll('[data-index]')).forEach(card => {
        if (battle.eliminated.includes(Number(card.dataset.index))) { card.disabled = true; card.classList.add('eliminated'); card.setAttribute('aria-label', `${card.getAttribute('aria-label') || '此选项'}，已被智慧洞察排除`); }
      });
      renderBattleStats();
      text('skill-hint', name === 'insight' ? '智慧洞察已排除一张错误牌' : name === 'guard' ? `获得 ${result.amount} 点护盾，保留至抵消反击` : `恢复 ${result.amount} 点生命，准备出牌`);
    }

    function renderQuestion() {
      const question = battle.queue[battle.cursor];
      const chapter = chapterById(question.chapter);
      text('question-title', question.title);
      text('question-tag', battle.mode === 'review' ? `错题复习 · ${chapter.title}` : chapter.title);
      text('question-prompt', question.question);
      if (els.hand) els.hand.innerHTML = question.options.map((option, index) => `<button type="button" class="playing-card${battle.eliminated.includes(index) ? ' eliminated' : ''}" data-index="${index}"${battle.eliminated.includes(index) ? ' disabled' : ''} aria-label="选项 ${index + 1}：${escapeHtml(option.name)}，${escapeHtml(option.text)}${battle.eliminated.includes(index) ? '，已排除' : ''}"><span class="cost-gem" aria-label="消耗 1 点能量">1</span><span class="card-art art-${Number.isInteger(Number(option.art)) ? Number(option.art) : index}"></span><span class="card-name">${escapeHtml(option.name)}</span><span class="card-type">${escapeHtml(option.type || chapter.title)}</span><span class="card-copy">${escapeHtml(option.text)}</span><span class="card-bottom"><span class="card-bottom-mark">${mark}</span><span>${battle.eliminated.includes(index) ? '已排除' : '施放'}</span><kbd>${index + 1}</kbd></span></button>`).join('');
      hidden(els.feedback, true);
      hidden(els['next-turn'], false);
      if (els['next-turn']) {
        els['next-turn'].disabled = true;
        const label = els['next-turn'].querySelector('span');
        if (label) label.textContent = '等待出牌';
        else els['next-turn'].textContent = '等待出牌';
      }
      text('turn-hint', '选择一张知识卡，向守关者发起挑战');
      if (els['game-board']) els['game-board'].classList.remove('answer-correct', 'answer-wrong');
      renderBattleStats();
      if (battle.answered) renderResolvedQuestion();
    }

    function renderBattleHeader() {
      const chapter = chapterById(battle.chapterId);
      const isReview = battle.mode === 'review';
      text('chapter-kicker', isReview ? 'KNOWLEDGE PRACTICE' : `CHAPTER 0${chapters.indexOf(chapter) + 1}`);
      text('chapter-title', isReview ? '错题修炼' : chapter.title);
      text('chapter-subtitle', isReview ? '重新检视训练迷思，把每次失误变成下一次的底气。' : chapter.description || chapter.subtitle || '用知识打出你的下一张好牌。');
      text('boss-name', isReview ? '迷思守卫' : chapter.boss || '知识守关者');
      text('boss-subtitle', isReview ? `${battle.queue.length} 道待复习知识 · 答对后移出错题本` : chapter.description || chapter.subtitle || '以知识之力，击败训练迷思');
      setArt(els['boss-portrait'], isReview ? 5 : chapter.art == null ? 4 : chapter.art);
    }

    function openBattle() {
      renderBattleHeader();
      closeDialog(els['result-dialog']);
      setView('arena');
      renderQuestion();
      updateProgressUi();
    }

    function startChapter(id, announce) {
      const chapter = chapterById(id);
      const queue = questions.filter(question => question.chapter === chapter.id);
      if (!queue.length) { toast('这一章的知识卡还在准备中'); return; }
      battle = createBattle(queue, chapter.id, 'chapter');
      progress.activeChapter = chapter.id;
      saveProgress();
      openBattle();
      if (announce) toast(`已开启「${chapter.title}」`);
    }

    function startReview(queueOverride) {
      const queue = Array.isArray(queueOverride) ? queueOverride.map(question => questionById(question.id)).filter(Boolean) : progress.wrongIds.map(questionById).filter(Boolean);
      if (!queue.length) { toast('暂无错题，继续挑战解锁更多知识'); return; }
      battle = createBattle(queue, progress.activeChapter, 'review');
      saveProgress();
      openBattle();
      toast(`开始复习 ${queue.length} 道错题`);
    }

    function effect(result) {
      if (prefersReducedMotion) return;
      window.clearTimeout(effectTimer);
      if (els['game-board']) {
        els['game-board'].classList.remove('answer-correct', 'answer-wrong');
        void els['game-board'].offsetWidth;
        els['game-board'].classList.add(result.correct ? 'answer-correct' : 'answer-wrong');
      }
      if (els['attack-fx']) {
        els['attack-fx'].className = `attack-fx is-active ${result.correct ? 'correct' : 'wrong'}`;
        els['attack-fx'].innerHTML = `<span class="attack-number">${!result.correct && !result.playerDamage ? '格挡' : `−${result.correct ? result.damage : result.playerDamage}`}</span><span class="attack-label">${result.comboBonus ? '三连 · 知识暴击' : result.correct ? '知识命中' : result.absorbed ? '科学屏障' : '迷思反击'}</span>`;
      }
      effectTimer = window.setTimeout(() => {
        if (els['attack-fx']) els['attack-fx'].classList.remove('is-active');
        if (els['game-board']) els['game-board'].classList.remove('answer-correct', 'answer-wrong');
      }, 850);
    }

    function chooseCard(index) {
      if (currentView !== 'arena' || isDialogOpen()) return;
      const result = resolveAnswer(battle, index);
      if (!result) return;
      const question = result.question;
      if (!progress.learnedIds.includes(question.id)) progress.learnedIds.push(question.id);
      if (result.correct) progress.wrongIds = progress.wrongIds.filter(id => id !== question.id);
      else if (!progress.wrongIds.includes(question.id)) progress.wrongIds.push(question.id);
      if (battle.mode === 'chapter' && battle.defeatedBoss && !progress.clearedChapters.includes(battle.chapterId)) progress.clearedChapters.push(battle.chapterId);
      progress.bestScore = Math.max(progress.bestScore, battle.score);
      if (battle.mode === 'chapter') progress.chapterBest[battle.chapterId] = Math.max(Number(progress.chapterBest[battle.chapterId]) || 0, battle.score);
      saveProgress();
      renderResolvedQuestion(result);
      updateProgressUi();
      renderCollection();
      effect(result);
      playSound(result.correct ? result.comboBonus ? 'combo' : 'correct' : 'wrong');
      if (window.matchMedia && window.matchMedia('(max-width: 700px)').matches && els['next-turn'] && typeof els['next-turn'].scrollIntoView === 'function') els['next-turn'].scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }

    function renderResolvedQuestion(result) {
      if (!battle || !battle.answered) return;
      if (!result) result = { ...battle.resolution, question: battle.queue[battle.cursor], finished: battle.ended };
      const question = result.question;
      const index = battle.selected;
      if (els.hand) Array.from(els.hand.querySelectorAll('[data-index]')).forEach(card => {
        const cardIndex = Number(card.dataset.index);
        card.disabled = true;
        card.classList.toggle('selected', cardIndex === index);
        card.classList.toggle('correct', cardIndex === question.correct);
        card.classList.toggle('wrong', cardIndex === index && !result.correct);
        card.classList.toggle('dimmed', cardIndex !== index && cardIndex !== question.correct);
        card.setAttribute('aria-pressed', String(cardIndex === index));
      });
      text('feedback-title', result.correct ? result.comboBonus ? `三连击！造成 ${result.damage} 点知识伤害` : `知识命中 · 造成 ${result.damage} 点伤害` : result.absorbed ? `护盾抵消 ${result.absorbed} · ${result.playerDamage ? `生命减少 ${result.playerDamage}` : '未损失生命'}` : `迷思反击 · 生命减少 ${result.playerDamage}`);
      if (els.feedback) { els.feedback.classList.toggle('feedback-correct', result.correct); els.feedback.classList.toggle('feedback-wrong', !result.correct); }
      if (els['feedback-copy']) els['feedback-copy'].innerHTML = `<span class="feedback-answer">正确答案：${escapeHtml(question.options[question.correct].name)}</span><span class="feedback-explanation">${escapeHtml(question.explanation)}</span>`;
      const source = question.source || {};
      const sourceUrl = safeUrl(source.url);
      if (els['feedback-source']) {
        const sourceElement = els['feedback-source'];
        if (sourceElement.tagName === 'A') {
          if (sourceUrl) { sourceElement.href = sourceUrl; sourceElement.innerHTML = `参考来源：${escapeHtml(source.label || '科学资料')} ${externalMark}`; }
          else { sourceElement.removeAttribute('href'); sourceElement.innerHTML = ''; }
        } else sourceElement.innerHTML = sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">参考来源：${escapeHtml(source.label || '科学资料')} ${externalMark}</a>` : '';
      }
      hidden(els.feedback, false);
      hidden(els['next-turn'], false);
      if (els['next-turn']) {
        els['next-turn'].disabled = false;
        const label = els['next-turn'].querySelector('span');
        const copy = battle.ended ? '查看战报' : battle.defeatedBoss ? '继续学习' : '下一回合';
        if (label) label.textContent = copy;
        else els['next-turn'].textContent = copy;
      }
      text('turn-hint', battle.ended ? '修炼结束，查看战报总结本次收获' : battle.defeatedBoss ? '守关者已击败，继续完成剩余知识挑战' : '知识已解锁，准备进入下一回合');
      renderBattleStats();
    }

    function settleBattle() {
      if (!battle || !battle.ended) return;
      battle.settled = true;
      saveProgress();
      const won = battle.defeatedBoss;
      const chapter = chapterById(battle.chapterId);
      const isReview = battle.mode === 'review';
      const completed = battle.correctCount + battle.wrongCount;
      const nextChapter = chapters[chapters.indexOf(chapter) + 1];
      const result = els['result-dialog'];
      if (!result) return;
      result.classList.remove('collection-detail-dialog');
      result.classList.add('battle-result-dialog');
      result.innerHTML = `<button type="button" class="dialog-close" data-result-action="close" aria-label="关闭战报">×</button><div class="result-emblem ${won ? 'victory' : 'practice'}">${mark}</div><p class="dialog-kicker">${isReview ? 'PRACTICE COMPLETE' : won ? 'CHAPTER CLEARED' : 'KEEP LEARNING'}</p><h2 class="dialog-title">${isReview ? '温故，也是一种进阶' : won ? '知识之力，胜利在握' : '每次修炼，都更进一步'}</h2><p class="dialog-copy">${isReview ? `已复习 ${completed} 道题，答对的知识已移出错题本。` : won ? `你击败了${escapeHtml(chapter.boss || '知识守关者')}，完成「${escapeHtml(chapter.title)}」挑战。` : battle.playerHp === 0 ? '生命已耗尽。先消化刚学到的知识，再来挑战一次。' : '本章知识已学完，再多答对一些就能击败守关者。'}</p><div class="result-stats"><div><strong>${battle.score}</strong><span>本局积分</span></div><div><strong>${battle.correctCount} / ${completed}</strong><span>正确解答</span></div><div><strong>${progress.bestScore}</strong><span>最高积分</span></div></div><div class="dialog-actions"><button type="button" class="button button-primary" data-result-action="replay">${isReview ? progress.wrongIds.length ? '继续复习' : '回到修炼场' : '再次挑战'}</button>${!isReview && nextChapter ? '<button type="button" class="button button-secondary" data-result-action="next">挑战下一章</button>' : '<button type="button" class="button button-secondary" data-result-action="collection">查看知识图鉴</button>'}</div><p class="result-note">${progress.learnedIds.length} / ${questions.length} 张知识卡已解锁 · ${progress.clearedChapters.length} / ${chapters.length} 章节已通关</p>`;
      showDialog(result);
    }

    function nextTurn() {
      if (!battle || !battle.answered || isDialogOpen() || currentView !== 'arena') return;
      if (battle.ended) { settleBattle(); return; }
      if (advanceBattle(battle)) {
        saveProgress();
        renderQuestion();
        if (els['question-title']) { els['question-title'].setAttribute('tabindex', '-1'); els['question-title'].focus({ preventScroll: true }); }
      }
    }

    function renderCollectionFilters() {
      if (!els['collection-filters']) return;
      els['collection-filters'].innerHTML = [{ id: 'all', title: '全部知识' }, ...chapters].map(chapter => `<button type="button" class="collection-filter${collectionFilter === chapter.id ? ' active' : ''}" data-filter="${escapeHtml(chapter.id)}" aria-pressed="${collectionFilter === chapter.id}">${escapeHtml(chapter.title)}</button>`).join('');
    }

    function renderCollection() {
      renderCollectionFilters();
      if (!els['collection-grid']) return;
      const visibleQuestions = questions.filter(question => collectionFilter === 'all' || question.chapter === collectionFilter);
      els['collection-grid'].innerHTML = visibleQuestions.map(question => {
        const learned = progress.learnedIds.includes(question.id);
        const wrong = progress.wrongIds.includes(question.id);
        const chapter = chapterById(question.chapter);
        // A locked card's illustration must not hint at which answer is correct.
        const chapterArt = { strength: 0, nutrition: 3, recovery: 1 }[question.chapter] ?? 5;
        const art = learned ? question.options[question.correct].art == null ? 5 : question.options[question.correct].art : chapterArt;
        return `<button type="button" class="collection-card${learned ? ' unlocked' : ' locked'}${wrong ? ' needs-review' : ''}" data-question="${escapeHtml(question.id)}" aria-label="${escapeHtml(question.title)}，${learned ? wrong ? '已解锁，待复习' : '已解锁' : '未解锁，可预览题目'}"><span class="collection-art art-${Number(art)}"></span><span class="collection-badge">${learned ? wrong ? '待复习' : '已解锁' : '待解锁'}</span><span class="collection-title">${escapeHtml(question.title)}</span><span class="collection-meta">${escapeHtml(chapter.title)}</span><span class="collection-preview">${learned ? '查看知识解析' : '预览挑战题目'} <span aria-hidden="true">→</span></span></button>`;
      }).join('');
    }

    function previewQuestion(id) {
      const question = questionById(id);
      const dialog = els['result-dialog'];
      if (!question || !dialog) return;
      const learned = progress.learnedIds.includes(question.id);
      const chapter = chapterById(question.chapter);
      const source = question.source || {};
      const sourceUrl = safeUrl(source.url);
      dialog.classList.remove('battle-result-dialog');
      dialog.classList.add('collection-detail-dialog');
      dialog.innerHTML = `<button type="button" class="dialog-close" data-result-action="close" aria-label="关闭知识卡">×</button><p class="dialog-kicker">${escapeHtml(chapter.title)} · ${learned ? '已解锁知识' : '待解锁知识'}</p><h2 class="dialog-title">${escapeHtml(question.title)}</h2><p class="knowledge-question">${escapeHtml(question.question)}</p><div class="knowledge-options">${question.options.map((option, index) => `<div class="knowledge-option${learned && index === question.correct ? ' correct' : ''}"><span>${String.fromCharCode(65 + index)}</span><p><strong>${escapeHtml(option.name)}</strong>${escapeHtml(option.text)}</p></div>`).join('')}</div>${learned ? `<div class="knowledge-answer"><strong>正确答案：${escapeHtml(question.options[question.correct].name)}</strong><p>${escapeHtml(question.explanation)}</p></div>${sourceUrl ? `<a class="knowledge-source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">参考来源：${escapeHtml(source.label || '科学资料')} ${externalMark}</a>` : ''}` : '<p class="dialog-copy knowledge-locked">在修炼场完成这道挑战，即可解锁知识解析。</p>'}<div class="dialog-actions"><button type="button" class="button button-primary" data-result-action="close">收起知识卡</button>${!learned ? `<button type="button" class="button button-secondary" data-result-action="learn" data-chapter="${escapeHtml(question.chapter)}">前往本章挑战</button>` : ''}</div>`;
      showDialog(dialog);
    }

    function setView(view) {
      currentView = view;
      hidden(els['arena-view'], view !== 'arena');
      hidden(els['collection-view'], view !== 'collection');
      ['arena', 'collection'].forEach(name => {
        const nav = els[`nav-${name}`];
        if (nav) { nav.classList.toggle('active', name === view); nav.setAttribute('aria-current', name === view ? 'page' : 'false'); }
      });
      if (view === 'collection') renderCollection();
      renderSkills();
    }

    function bind(element, event, callback) { if (element) element.addEventListener(event, callback); }
    bind(els.hand, 'click', event => { const card = event.target.closest('[data-index]'); if (card && els.hand.contains(card)) chooseCard(Number(card.dataset.index)); });
    bind(els['skill-panel'], 'click', event => { const button = event.target.closest('[data-skill]'); if (button && els['skill-panel'].contains(button)) useSkill(button.dataset.skill); });
    bind(els['next-turn'], 'click', nextTurn);
    bind(els['chapter-list'], 'click', event => { const button = event.target.closest('[data-chapter]'); if (button) startChapter(button.dataset.chapter, true); });
    bind(els['nav-arena'], 'click', () => setView('arena'));
    bind(els['nav-collection'], 'click', () => setView('collection'));
    bind(els['review-button'], 'click', startReview);
    bind(els['battle-reset'], 'click', () => { if (!battle) return; if (battle.mode === 'review') startReview(battle.queue); else startChapter(battle.chapterId, false); toast('本局已重新开始，知识记录已保留'); });
    bind(els['sound-toggle'], 'click', () => { progress.sound = !progress.sound; saveProgress(); syncSound(); if (progress.sound) playSound('correct'); });
    bind(els['help-button'], 'click', () => showDialog(els['help-dialog']));
    bind(els['help-close'], 'click', () => closeDialog(els['help-dialog']));
    bind(els['collection-filters'], 'click', event => { const button = event.target.closest('[data-filter]'); if (button) { collectionFilter = button.dataset.filter; renderCollection(); const active = els['collection-filters'].querySelector(`[data-filter="${collectionFilter}"]`); if (active) active.focus({ preventScroll: true }); } });
    bind(els['collection-grid'], 'click', event => { const card = event.target.closest('[data-question]'); if (card) previewQuestion(card.dataset.question); });
    bind(els['result-dialog'], 'click', event => {
      const button = event.target.closest('[data-result-action]');
      if (!button) return;
      const action = button.dataset.resultAction;
      closeDialog(els['result-dialog']);
      if (action === 'collection') setView('collection');
      if (action === 'learn') startChapter(button.dataset.chapter, true);
      if (action === 'replay') { if (battle.mode === 'review' && progress.wrongIds.length) startReview(); else startChapter(battle.chapterId, false); }
      if (action === 'next') { const chapter = chapterById(battle.chapterId); const next = chapters[chapters.indexOf(chapter) + 1]; if (next) startChapter(next.id, true); }
    });
    ['help-dialog', 'result-dialog'].forEach(id => {
      bind(els[id], 'close', () => { if (!isDialogOpen()) document.body.classList.remove('modal-open'); renderSkills(); });
      bind(els[id], 'click', event => {
        if (event.target !== els[id]) return;
        const bounds = els[id].getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog(els[id]);
      });
    });
    document.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.repeat || event.ctrlKey || event.altKey || event.metaKey || isDialogOpen() || currentView !== 'arena') return;
      const target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (!battle) return;
      const skill = { q: 'insight', w: 'guard', e: 'restore' }[String(event.key).toLowerCase()];
      if (skill && !battle.answered && !battle.ended) { event.preventDefault(); useSkill(skill); }
      else if (/^[123]$/.test(event.key) && !battle.answered && !battle.ended && !battle.eliminated.includes(Number(event.key) - 1)) { event.preventDefault(); chooseCard(Number(event.key) - 1); }
      else if ((event.code === 'Space' || event.key === ' ') && battle.answered && !(target && (target.closest && target.closest('button, a, input, textarea, select, summary, [role="button"]')))) { event.preventDefault(); nextTurn(); }
    });

    syncSound();
    renderCollection();
    if (battle) { openBattle(); saveProgress(); }
    else startChapter(progress.activeChapter, false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
