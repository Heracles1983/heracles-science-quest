(function () {
  'use strict';

  const STORAGE_KEY = 'fitcraft-selection-v1';
  const COURSE_IDS = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const content = id => window.FIT_ENRICHMENT && Object.prototype.hasOwnProperty.call(window.FIT_ENRICHMENT, id) ? window.FIT_ENRICHMENT[id] : null;

  function normalizeSnapshot(input) {
    const normalized = { version: 1, answers: {} };
    try {
      if (!input || typeof input !== 'object' || Array.isArray(input) || input.version !== 1 || !input.answers || typeof input.answers !== 'object' || Array.isArray(input.answers)) return normalized;
      COURSE_IDS.forEach(id => {
        const course = content(id);
        if (course && course.choice.options.some(option => option.key === input.answers[id])) normalized.answers[id] = input.answers[id];
      });
    } catch (error) {
      return { version: 1, answers: {} };
    }
    return normalized;
  }

  let state = { version: 1, answers: {} };
  try { state = normalizeSnapshot(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')); } catch (error) { /* Continue in memory when storage is blocked or malformed. */ }

  function persist() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { /* The lesson remains usable without persistence. */ }
  }

  function snapshot() {
    return normalizeSnapshot(state);
  }

  function restore(input) {
    state = normalizeSnapshot(input);
    persist();
    return snapshot();
  }

  function renderChoiceFeedback(lab, courseId) {
    const choice = content(courseId).choice;
    const selectedKey = state.answers[courseId];
    const selected = choice.options.find(option => option.key === selectedKey);
    const correct = choice.options.find(option => option.key === choice.correct);
    lab.querySelectorAll('[data-selection-answer]').forEach(button => {
      const isSelected = button.dataset.selectionAnswer === selectedKey;
      const isCorrect = Boolean(selected) && button.dataset.selectionAnswer === choice.correct;
      button.setAttribute('aria-pressed', String(isSelected));
      button.classList.toggle('selection-selected', isSelected);
      button.classList.toggle('selection-correct', isCorrect);
      button.classList.toggle('selection-wrong', Boolean(selected) && isSelected && !isCorrect);
      button.querySelector('.selection-result').textContent = isCorrect ? '✓ 参考选择' : isSelected ? '你的选择' : '';
    });
    const feedback = lab.querySelector('.selection-feedback');
    if (!selected) {
      feedback.innerHTML = '<p>选择一个方案，看看器械条件、目标动作模式与恢复情况如何影响选择。此练习可以反复尝试。</p>';
      return;
    }
    feedback.innerHTML = '<p><strong>' + (selectedKey === choice.correct ? '✓ 这个方案符合当前情境。' : '再比较一下当前的训练目标。') + '</strong> ' + esc(selected.explanation) + '</p>' +
      (selectedKey !== choice.correct && correct ? '<p><strong>参考选择：' + esc(correct.label) + '</strong> ' + esc(correct.explanation) + '</p>' : '');
  }

  function mount(config) {
    if (!config || !config.container || typeof config.container.querySelector !== 'function') return;
    const container = config.container;
    container.querySelectorAll('.selection-lab').forEach(element => element.remove());
    if (!COURSE_IDS.includes(config.courseId) || !['movement', 'control'].includes(config.lesson)) return;
    const course = content(config.courseId);
    if (!course) return;

    const lab = document.createElement('details');
    lab.className = 'selection-lab';
    lab.open = true;
    if (config.lesson === 'movement') {
      const currentTab = container.querySelector('.exercise-tab.active');
      const exerciseId = currentTab && currentTab.dataset.exercise;
      const exercise = exerciseId && course.exercises[exerciseId];
      const exerciseName = window.FIT_COURSES && window.FIT_COURSES[config.courseId] && window.FIT_COURSES[config.courseId].exercises.find(item => item.id === exerciseId);
      lab.innerHTML = '<summary>动作选择实战</summary><div class="selection-content"><p class="selection-kicker">从目标和条件出发 · 选适合今天的动作</p><p class="selection-prompt">' + esc(course.choice.prompt) + '</p><div class="selection-options" role="group" aria-label="动作选择情境">' +
        course.choice.options.map((option, index) => '<button type="button" class="selection-option" data-selection-answer="' + esc(option.key) + '" aria-pressed="false"><span class="selection-letter">' + ['A', 'B', 'C'][index] + '</span><span class="selection-option-copy">' + esc(option.label) + '</span><small class="selection-result"></small></button>').join('') +
        '</div><div class="selection-feedback" role="status" aria-live="polite" aria-atomic="true"></div>' +
        (exercise ? '<section class="selection-meta" aria-label="当前动作选择依据"><h4>' + esc(exerciseName ? exerciseName.name : '当前动作') + ' · 为什么选它</h4><dl><div class="selection-meta-row"><dt>器械条件</dt><dd>' + esc(exercise.equipment) + '</dd></div><div class="selection-meta-row"><dt>动作角色</dt><dd>' + esc(exercise.role) + '</dd></div><div class="selection-meta-row"><dt>替代选项</dt><dd>' + esc(exercise.substitute) + '</dd></div><div class="selection-meta-row"><dt>选择理由</dt><dd>' + esc(exercise.reason) + '</dd></div></dl></section>' : '') +
        '<p class="selection-note">替换先看训练目标与动作模式，再看器械、舒适度、控制和能否记录进步。替代动作不必完全等效；更换后重新确定负荷与次数，不直接照搬重量。</p></div>';
      lab.querySelectorAll('[data-selection-answer]').forEach(button => button.addEventListener('click', () => {
        if (!course.choice.options.some(option => option.key === button.dataset.selectionAnswer)) return;
        state.answers[config.courseId] = button.dataset.selectionAnswer;
        persist();
        renderChoiceFeedback(lab, config.courseId);
      }));
      renderChoiceFeedback(lab, config.courseId);
    } else {
      lab.innerHTML = '<summary>本部位进阶方法</summary><div class="selection-content"><h4>' + esc(course.principle.title) + '</h4><p>' + esc(course.principle.body) + '</p><p class="selection-example"><strong>实际例子</strong> ' + esc(course.principle.example) + '</p><p class="selection-note">小提示：只比较相近条件下的训练表现。先记录动作、组数、次数、负荷与余力，再决定下一次维持、加次数或小幅加重；恢复不足时可以减量。核心稳定练习额外记录杠杆、呼吸与控制。</p></div>';
    }
    const reading = container.querySelector('.knowledge-details');
    if (reading) container.insertBefore(lab, reading);
    else container.appendChild(lab);
  }

  window.FIT_SELECTION = { mount: mount, snapshot: snapshot, restore: restore, normalizeSnapshot: normalizeSnapshot };
}());
