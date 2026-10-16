(function (global) {
  'use strict';

  var COURSE_IDS = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];
  var COURSE_NAMES = { chest: '胸部', back: '背部', shoulders: '肩部', legs: '腿部', arms: '手臂', core: '核心' };
  var DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  var EQUIPMENT = {
    chest: { flat: '哑铃', incline: '哑铃', fly: '哑铃', pushup: '自重' },
    back: { pulldown: '绳索', row: '绳索', pullover: '绳索', chestrow: '哑铃' },
    shoulders: { press: '哑铃', lateral: '哑铃', rearfly: '哑铃', facepull: '绳索' },
    legs: { squat: '哑铃', rdl: '哑铃', legcurl: '器械', calfraise: '自重' },
    arms: { curl: '哑铃', hammer: '哑铃', pushdown: '绳索', overhead: '哑铃' },
    core: { crunch: '自重', deadbug: '自重', pallof: '绳索 / 弹力带', birddog: '自重' }
  };
  var courses = global.FIT_COURSES || {};
  var catalog = [];
  COURSE_IDS.forEach(function (courseId) {
    var course = courses[courseId];
    if (!course || !Array.isArray(course.exercises)) return;
    course.exercises.forEach(function (exercise) {
      if (!exercise || !Object.prototype.hasOwnProperty.call(EQUIPMENT[courseId], exercise.id)) return;
      var secondary = [];
      if (courseId === 'chest' && exercise.type === 'compound') secondary = ['shoulders', 'arms'];
      if (courseId === 'back' && exercise.type === 'compound') secondary = ['arms'];
      if (courseId === 'shoulders' && exercise.id === 'press') secondary = ['arms'];
      catalog.push({
        key: courseId + ':' + exercise.id,
        course: courseId,
        id: exercise.id,
        name: exercise.name,
        english: exercise.english || '',
        pattern: exercise.pattern || '',
        type: exercise.type || 'isolation',
        art: exercise.art || '',
        secondary: secondary,
        equipment: EQUIPMENT[courseId][exercise.id]
      });
    });
  });
  var byKey = Object.create(null);
  catalog.forEach(function (exercise) { byKey[exercise.key] = exercise; });

  function object(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
  function number(value, fallback, min, max, integer) {
    if (typeof value !== 'number' && typeof value !== 'string') return fallback;
    if (typeof value === 'string' && !value.trim()) return fallback;
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    n = Math.min(max, Math.max(min, n));
    return integer ? Math.round(n) : n;
  }
  function string(value, fallback, max) {
    return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) || fallback : fallback;
  }
  function method(value) {
    return ['linear', 'double', 'periodized'].indexOf(value) >= 0 ? value : 'double';
  }
  function rounded(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function normalizePlan(raw) {
    raw = object(raw) ? raw : {};
    var usedUids = Object.create(null);
    var sourceDays = Array.isArray(raw.days) ? raw.days : [];
    return {
      name: string(raw.name, '我的训练计划', 60),
      demoId: string(raw.demoId, '', 80),
      method: method(raw.method),
      increment: number(raw.increment, 2.5, 0.25, 10, false),
      days: DAY_NAMES.map(function (name, dayIndex) {
        var sourceDay = object(sourceDays[dayIndex]) ? sourceDays[dayIndex] : {};
        var sourceItems = Array.isArray(sourceDay.items) ? sourceDay.items : [];
        var items = [];
        sourceItems.forEach(function (item) {
          if (!object(item) || typeof item.key !== 'string' || !byKey[item.key] || items.length >= 10) return;
          var baseUid = string(item.uid, 'plan-' + dayIndex + '-' + items.length, 60).replace(/[^a-zA-Z0-9_-]/g, '-');
          var uid = baseUid;
          var suffix = 1;
          while (usedUids[uid]) uid = baseUid + '-' + suffix++;
          usedUids[uid] = true;
          var repsMin = number(item.repsMin, 8, 1, 30, true);
          var exercise = byKey[item.key];
          var defaultProgression = exercise.course === 'core' ? 'skill' : exercise.type === 'compound' ? 'linear' : 'double';
          items.push({
            uid: uid,
            key: item.key,
            sets: number(item.sets, 3, 1, 5, true),
            repsMin: repsMin,
            repsMax: Math.max(repsMin, number(item.repsMax, 12, 1, 30, true)),
            rir: number(item.rir, 2, 0, 5, true),
            rest: number(item.rest, 120, 30, 300, true),
            progression: ['linear', 'double', 'skill'].indexOf(item.progression) >= 0 ? item.progression : defaultProgression,
            startWeight: number(item.startWeight, 0, 0, 500, false),
            increment: number(item.increment, 2.5, 0.25, 10, false),
            loadBasis: ['total', 'per-hand', 'bodyweight'].indexOf(item.loadBasis) >= 0 ? item.loadBasis : 'total'
          });
        });
        return { name: name, label: string(sourceDay.label, items.length ? '训练日' : '休息日', 60), items: items };
      })
    };
  }

  function structuralErrors(raw) {
    var errors = [];
    if (!object(raw)) return ['计划结构无效，请先建立一份七天计划。'];
    if (!Array.isArray(raw.days) || raw.days.length !== 7) errors.push('计划需要包含周一至周日共七天。');
    var seen = Object.create(null);
    (Array.isArray(raw.days) ? raw.days.slice(0, 7) : []).forEach(function (day, index) {
      if (!object(day) || !Array.isArray(day.items)) {
        errors.push(DAY_NAMES[index] + '的动作列表结构无效。');
        return;
      }
      if (day.items.length > 10) errors.push(DAY_NAMES[index] + '最多安排十个动作。');
      day.items.forEach(function (item) {
        if (!object(item) || typeof item.key !== 'string' || !byKey[item.key]) {
          errors.push(DAY_NAMES[index] + '含有无法识别的动作，请重新选择。');
          return;
        }
        var fields = { sets: [1, 5], repsMin: [1, 30], repsMax: [1, 30], rir: [0, 5], rest: [30, 300] };
        var bad = Object.keys(fields).some(function (key) {
          var n = item[key];
          return typeof n !== 'number' || !Number.isFinite(n) || n !== Math.round(n) || n < fields[key][0] || n > fields[key][1];
        });
        if (bad || item.repsMax < item.repsMin) errors.push(DAY_NAMES[index] + '的' + byKey[item.key].name + '参数超出练习范围。');
        if (typeof item.uid !== 'string' || !item.uid || seen[item.uid]) errors.push('动作标识缺失或重复，请重新整理计划。');
        if (typeof item.uid === 'string') seen[item.uid] = true;
      });
    });
    return Array.from(new Set(errors));
  }

  function analysePlan(raw) {
    var errors = structuralErrors(raw);
    var plan = normalizePlan(raw);
    var warnings = [];
    var strengths = [];
    var weekly = COURSE_IDS.map(function (id) {
      return { course: id, name: (courses[id] || {}).name || COURSE_NAMES[id], directSets: 0, indirectSets: 0, frequency: 0, directDays: [] };
    });
    var weeklyById = Object.create(null);
    weekly.forEach(function (entry) { weeklyById[entry.course] = entry; });
    var covered = { horizontalPush: false, verticalPull: false, horizontalPull: false, squat: false, hinge: false, lateral: false, rear: false, core: false };
    var totalSets = 0;
    var hardSets = 0;
    var zeroRir = false;
    var shortRest = false;
    var largeIsolationIncrement = false;
    var coreLoadProgression = false;
    var days = plan.days.map(function (day, index) {
      var primary = [];
      var total = 0;
      var seconds = 0;
      day.items.forEach(function (item) {
        var exercise = byKey[item.key];
        total += item.sets;
        // Teaching estimate includes working time, between-set rest and transitions; not a timer or a prescription.
        seconds += item.sets * (((item.repsMin + item.repsMax) / 2) * 3 + item.rest) + 60;
        weeklyById[exercise.course].directSets += item.sets;
        if (primary.indexOf(exercise.course) < 0) primary.push(exercise.course);
        exercise.secondary.forEach(function (courseId) { weeklyById[courseId].indirectSets += item.sets; });
        if (exercise.course === 'chest' && exercise.pattern === 'push') covered.horizontalPush = true;
        if (exercise.course === 'back' && exercise.pattern === 'vertical') covered.verticalPull = true;
        if (exercise.course === 'back' && exercise.pattern === 'horizontal') covered.horizontalPull = true;
        if (exercise.course === 'legs' && exercise.pattern === 'squat') covered.squat = true;
        if (exercise.course === 'legs' && exercise.pattern === 'hinge') covered.hinge = true;
        if (exercise.course === 'shoulders' && exercise.id === 'lateral') covered.lateral = true;
        if (exercise.course === 'shoulders' && ['rearfly', 'facepull'].indexOf(exercise.id) >= 0) covered.rear = true;
        if (exercise.course === 'core') covered.core = true;
        if (item.rir <= 1) hardSets += item.sets;
        if (item.rir === 0) zeroRir = true;
        if ((exercise.course !== 'core' && exercise.type === 'compound' && item.rest < 120) || item.rest < 60) shortRest = true;
        if (exercise.type === 'isolation' && item.increment > 2.5 && item.progression !== 'skill') largeIsolationIncrement = true;
        if (exercise.course === 'core' && item.progression !== 'skill') coreLoadProgression = true;
      });
      primary.forEach(function (id) { weeklyById[id].directDays.push(index); });
      totalSets += total;
      if (total > 20) warnings.push(day.name + '有 ' + total + ' 个工作组，单课较长；先检查后半程动作质量和恢复，必要时分配到其他天。');
      return { index: index, totalSets: total, minutes: total ? Math.ceil(seconds / 60) + 5 : 0, primary: primary };
    });
    weekly.forEach(function (entry) {
      entry.frequency = entry.directDays.length;
      var coveredByIndirect = entry.course === 'arms' && entry.indirectSets > 0;
      if (!entry.directSets && !coveredByIndirect) errors.push('本周尚未覆盖' + entry.name + '，请加入相应动作。');
      if (!entry.directSets && coveredByIndirect) warnings.push('手臂目前通过推、拉间接参与；直接训练为 0 组，间接参与不等于同数量的直接训练，可按目标与恢复加入屈肘、伸肘动作。');
      var adjacent = [];
      entry.directDays.forEach(function (dayIndex) {
        if (entry.directDays.indexOf((dayIndex + 1) % 7) >= 0) adjacent.push(DAY_NAMES[dayIndex] + '、' + DAY_NAMES[(dayIndex + 1) % 7]);
      });
      if (adjacent.length) warnings.push(entry.name + '在相邻天直接训练（' + adjacent.join('；') + '），请结合工作组、强度和表现判断是否恢复充分。');
    });
    var patterns = [
      { id: 'horizontal-push', name: '水平推', covered: covered.horizontalPush },
      { id: 'vertical-pull', name: '垂直拉', covered: covered.verticalPull },
      { id: 'horizontal-pull', name: '水平拉', covered: covered.horizontalPull },
      { id: 'squat', name: '蹲类动作', covered: covered.squat },
      { id: 'hinge', name: '髋铰链', covered: covered.hinge },
      { id: 'shoulder-accessory', name: '肩中束与后束', covered: covered.lateral && covered.rear },
      { id: 'core', name: '核心训练', covered: covered.core }
    ];
    patterns.forEach(function (pattern) { if (!pattern.covered) errors.push('基础动作模式尚缺：' + pattern.name + '。'); });
    var trainingDays = days.filter(function (day) { return day.totalSets > 0; }).length;
    var restDays = 7 - trainingDays;
    if (!trainingDays) errors.push('还没有安排训练动作，请先选择动作并分配工作组。');
    if (!restDays) errors.push('本教学计划需要至少保留一天无工作组的休息日。');
    if (totalSets && hardSets >= totalSets / 2) warnings.push('至少一半工作组设为 RIR 0–1；先学会可靠估计余力，并考虑用 RIR 2–3 管理疲劳。');
    if (zeroRir) warnings.push('有动作设为 RIR 0，接近或达到动作标准下的极限；无需每组力竭，技术开始失控就应停止。');
    if (shortRest) warnings.push('部分组间休息较短；复合动作可先参考 2–3 分钟、孤立动作 1–2 分钟，再按下一组表现调整。');
    if (largeIsolationIncrement) warnings.push('部分孤立动作选择的加重量较大；先检查器械最小档位，必要时用次数双进阶，不要为追求加重牺牲控制。');
    if (coreLoadProgression) warnings.push('核心练习优先巩固呼吸、幅度与腰盆控制；能稳定完成后再考虑阻力，不把加重量作为唯一进阶。');
    warnings.push('组间休息与时长均为学习参考，估算不含排队等实际因素；直接工作组和间接参与组分别记录，不按 1∶1 相加。');
    if (patterns.every(function (pattern) { return pattern.covered; })) strengths.push('基础动作模式齐全，包含推、两种拉、蹲、髋铰链、肩中后束与核心。');
    if (weekly.every(function (entry) { return entry.directSets > 0 || (entry.course === 'arms' && entry.indirectSets > 0); })) strengths.push('六个部位均有训练参与，手臂的直接与间接负荷分开统计。');
    if (restDays > 0 && trainingDays > 0) strengths.push('每周安排 ' + trainingDays + ' 个训练日与 ' + restDays + ' 个休息日。');
    strengths.push('这是编排教学检查；组数没有统一的合格下限，需根据目标、能力、训练记录与恢复逐步调整。');
    return {
      valid: errors.length === 0,
      errors: Array.from(new Set(errors)),
      warnings: Array.from(new Set(warnings)),
      strengths: strengths,
      days: days,
      weekly: weekly,
      patterns: patterns,
      trainingDays: trainingDays,
      restDays: restDays,
      totalSets: totalSets
    };
  }

  function projectProgression(input) {
    input = object(input) ? input : {};
    var selectedMethod = method(input.method);
    var startWeight = number(input.startWeight, 40, 0, 1000, false);
    var increment = number(input.increment, 2.5, 0.25, 10, false);
    var weeks = number(input.weeks, 6, 1, 16, true);
    var sets = number(input.sets, 3, 1, 5, true);
    var repsMin = number(input.repsMin, 8, 1, 30, true);
    var repsMax = Math.max(repsMin, number(input.repsMax, 12, 1, 30, true));
    var targetRir = number(input.targetRir, 2, 2, 5, true);
    var notes = [
      '这是条件满足时的教学路径，不是对未来表现的预测；实际记录决定下一次是否进阶，某一行也可能需要重复多次。',
      '所有加重都以无疼痛、技术稳定、目标次数完成并保留计划余力为前提；本工具建议加重前至少保留 RIR 2。',
      '重量单位沿用你的输入，请始终使用同一记法（例如单只哑铃重量或器械标重），增量受器械实际档位限制。'
    ];
    if ((typeof input.targetRir === 'number' || typeof input.targetRir === 'string') && String(input.targetRir).trim() && Number.isFinite(Number(input.targetRir)) && Number(input.targetRir) < 2) {
      notes.push('本课加重路径至少保留 RIR 2；你输入的目标余力低于 2，演示已调整为 RIR 2。真实训练余力较低时，应先巩固或调整，不自动加重。');
    }
    var rows = [];
    var weight = startWeight;
    var reps = repsMin;
    for (var index = 0; index < weeks; index++) {
      var row = { week: index + 1, weight: rounded(weight), sets: sets, reps: repsMin, rir: targetRir, note: '' };
      if (selectedMethod === 'linear') {
        row.weight = rounded(startWeight + index * increment);
        row.note = index ? '上一次达标才尝试小步加重；未达标则维持或回退。' : '建立能稳定完成目标次数和余力的起点。';
      } else if (selectedMethod === 'double') {
        row.weight = rounded(weight);
        row.reps = reps;
        row.note = reps === repsMax ? '各工作组均达到次数上限且余力达标，下一次才尝试加重。' : '先在同一重量下逐步增加高质量次数，不要求各组同时增加。';
        if (reps >= repsMax) { weight += increment; reps = repsMin; }
        else reps += 1;
      } else {
        var phase = index % 4;
        var cycle = Math.floor(index / 4);
        var cycleWeight = startWeight + cycle * increment;
        row.weight = rounded(cycleWeight + Math.min(phase, 2) * increment);
        row.reps = phase === 0 ? repsMax : phase === 1 ? Math.round((repsMin + repsMax) / 2) : repsMin;
        if (phase === 3) {
          row.weight = rounded(cycleWeight);
          row.sets = Math.max(1, Math.ceil(sets / 2));
          row.reps = repsMin;
          row.rir = Math.max(3, targetRir);
          row.note = '减量周示例：减少组数并留出更多余力；时机取决于疲劳与表现。';
        } else row.note = phase === 0 ? '新循环示例：较高次数；起点按上一循环表现调整。' : '示例逐步降次数、升重量，动作质量和余力仍需达标。';
      }
      rows.push(row);
    }
    if (selectedMethod === 'linear') notes.push('线性进阶示例保持次数不变、逐步增加重量；不是每周必须加重，训练经验增加后也可能需要改用其他方式。');
    if (selectedMethod === 'double') notes.push('双进阶先增加次数，所有工作组到达上限后才加重并回到次数下限；图中逐行变化只是便于理解。');
    if (selectedMethod === 'periodized') notes.push('这里采用三周变化加一周减量的演示，并非唯一或强制的科学周期；减量周及新循环起点应按训练记录调整。');
    return { rows: rows, notes: notes };
  }

  function recommendNext(input) {
    input = object(input) ? input : {};
    var weight = number(input.weight, 40, 0, 1000, false);
    var increment = number(input.increment, 2.5, 0.25, 10, false);
    var min = number(input.repsMin, 8, 1, 30, true);
    var max = Math.max(min, number(input.repsMax, 12, 1, 30, true));
    var rir = number(input.rir, 0, 0, 5, false);
    var stalled = number(input.stalledSessions, 0, 0, 100, true);
    var reps = Array.isArray(input.reps) ? input.reps : [];
    var validReps = reps.length > 0 && reps.length <= 10 && reps.every(function (rep) {
      return typeof rep === 'number' && Number.isFinite(rep) && rep >= 0 && rep <= 100 && rep === Math.floor(rep);
    });
    var selectedMethod = method(input.method);
    function result(action, title, explanation, nextWeight) {
      return { action: action, title: title, explanation: explanation, nextWeight: rounded(nextWeight) };
    }
    if (input.pain === true) return result('stop', '先停止当前动作', '疼痛不作为进阶依据。停止并检查动作、负荷与舒适度；反复或持续不适应寻求专业评估。', weight);
    if (input.technique === 'broken') return result('reduce', '先回退负荷，恢复动作质量', '明显借力、幅度失控或技术改变时，不用凑次数。可先尝试降低一个可用档位，或选更容易控制的动作版本。', Math.max(0, weight - increment));
    if (input.recovery === 'poor' && stalled >= 2) return result('reduce', '先减量并评估恢复', '恢复不佳且连续多次停滞，先减少工作组、留出更多余力并检查睡眠和训练安排。可维持当前重量做更少的组；不要求按固定百分比降重。', weight);
    if (input.recovery === 'poor') return result('repeat', '暂缓进阶，先恢复', '本次恢复不佳，先维持或减少训练量，观察下一次的动作与表现，再决定是否调整重量。', weight);
    if (!validReps || input.technique !== 'stable' || input.recovery !== 'good') return result('repeat', '补全记录后再判断', '请记录各工作组次数、动作质量与恢复状态；资料不足时不自动建议加重。', weight);
    if (rir < 2) return result('repeat', '保持重量，留出计划余力', '本次余力不足 RIR 2。先巩固同样质量的次数与控制，不因完成数字就自动加重。', weight);
    var target = selectedMethod === 'double' ? max : min;
    if (reps.every(function (rep) { return rep >= target; })) {
      if (selectedMethod === 'periodized') return result('repeat', '本阶段达标，按周期安排下一次', '各组达到本阶段目标且余力充足。下一次是加重、调整次数还是减量，需要结合周期阶段决定；不要跳过计划直接连续加重。', weight);
      return result('increase', '可尝试小幅加重', selectedMethod === 'double' ? '所有工作组达到次数上限，技术稳定且至少保留 RIR 2。下一次尝试可用的最小增量，加重后回到次数下限并重新观察余力。' : '所有工作组达到本次固定次数目标，技术稳定且至少保留 RIR 2。下一次可尝试小增量；表现未达标时维持或回退。', weight + increment);
    }
    return result('repeat', '先在当前重量下积累次数', stalled >= 2 ? '尚未达到全部工作组的进阶条件，先检查休息、动作质量与恢复。连续停滞可调整工作组或动作，不必强行加重。' : '部分工作组尚未达到目标。维持重量，在动作质量和计划余力允许时逐步增加次数；不要求每次训练都有数字增长。', weight);
  }

  global.FIT_PLAN_ENGINE = {
    catalog: catalog,
    normalizePlan: normalizePlan,
    analysePlan: analysePlan,
    projectProgression: projectProgression,
    recommendNext: recommendNext
  };
})(typeof window !== 'undefined' ? window : globalThis);
