(function () {
  'use strict';
  const COURSES = window.FIT_COURSES;
  const ORDER = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];
  const LESSONS = ['anatomy', 'movement', 'control', 'program'];
  const KEY = 'fitcraft-academy-v2';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let storageOK = true, toastTimer, previousFocus, anatomyRequest = 0;
  const svgCache = new Map();

  function defaults(id) {
    const c = COURSES[id];
    return {lesson:'anatomy', regions:[], exercises:[c.exercises[0].id], currentExercise:c.exercises[0].id,
      rir:3, quality:[], mastered:[], wrong:[], plan:Object.fromEntries(c.exercises.map(e => [e.id,
        {selected:e.defaultSelected === true, sets:e.defaultSets || 2}])),
      planRir:3, compoundRest:c.program.compoundRest[0], isolationRest:c.program.isolationRest[0], planPassed:false};
  }
  function sanitize(id, input) {
    const s = defaults(id), c = COURSES[id];
    if (!input || typeof input !== 'object') return s;
    if (LESSONS.includes(input.lesson)) s.lesson = input.lesson;
    const valid = {regions:c.regions.map(r=>r.id), exercises:c.exercises.map(e=>e.id), quality:[0,1,2],
      mastered:c.questions.map(q=>q.id), wrong:c.questions.map(q=>q.id)};
    for (const k of Object.keys(valid)) if (Array.isArray(input[k])) s[k] = [...new Set(input[k].filter(v=>valid[k].includes(v)))];
    s.mastered = s.mastered.filter(q=>!s.wrong.includes(q));
    if (c.exercises.some(e=>e.id===input.currentExercise)) s.currentExercise = input.currentExercise;
    for (const k of ['rir','planRir']) if (Number.isInteger(input[k]) && input[k]>=0 && input[k]<=5) s[k]=input[k];
    for (const k of ['compoundRest','isolationRest']) if ([30,60,90,120,150,180].includes(input[k])) s[k]=input[k];
    for (const e of c.exercises) {
      const p=input.plan?.[e.id];
      if (p && Number.isInteger(p.sets) && p.sets>=1 && p.sets<=5) s.plan[e.id]={selected:p.selected===true,sets:p.sets};
    }
    s.planPassed=input.planPassed===true;
    return s;
  }
  const fresh = () => ({version:2,course:'chest',courses:Object.fromEntries(ORDER.map(id=>[id,defaults(id)])),quiz:null});
  function cleanQuiz(q) {
    if (!q || !Array.isArray(q.refs) || !q.refs.length || q.refs.length>60 || !['lesson','review','final'].includes(q.mode)) return null;
    if (!q.refs.every(r=>r&&typeof r==='object'&&ORDER.includes(r.course)&&COURSES[r.course].questions.some(x=>x.id===r.id))) return null;
    if (new Set(q.refs.map(r=>r.course+':'+r.id)).size!==q.refs.length) return null;
    if (!Number.isInteger(q.cursor)||q.cursor<0||q.cursor>=q.refs.length) return null;
    const selections=q.refs.map((_,i)=>[0,1,2].includes(q.selections?.[i])?q.selections[i]:null);
    const firstUnanswered=selections.findIndex(x=>x===null);
    return {refs:q.refs.map(r=>({course:r.course,id:r.id})),cursor:firstUnanswered>=0?Math.min(q.cursor,firstUnanswered):q.cursor,
      selections,mode:q.mode,course:ORDER.includes(q.course)?q.course:'chest',lesson:LESSONS.includes(q.lesson)?q.lesson:'anatomy'};
  }
  function cleanRoot(input) {
    const root=fresh();
    if (input && typeof input==='object') {
      if (ORDER.includes(input.course)) root.course=input.course;
      ORDER.forEach(id=>root.courses[id]=sanitize(id,input.courses?.[id]));
      root.quiz=cleanQuiz(input.quiz);
    }
    return root;
  }
  let root=fresh();
  try {
    const saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if (saved?.version===2) root=cleanRoot(saved);
    else {
      const old=JSON.parse(localStorage.getItem('fitcraft-chest-v1')||'null');
      if (old) {
        root.courses.chest=sanitize('chest',old);
        if (old.quiz) root.quiz=cleanQuiz({...old.quiz,course:'chest',refs:(old.quiz.ids||[]).map(id=>({course:'chest',id}))});
      }
    }
  } catch (e) { storageOK=false; }
  let active=root.course, DATA=COURSES[active], state=root.courses[active];
  let region=state.regions.at(-1)||null, currentExercise=state.currentExercise, angle=25;
  function toast(message) {
    $('#toast').textContent=message; $('#toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);
  }
  function save() {
    try { localStorage.setItem(KEY,JSON.stringify(root)); }
    catch(e) { if(storageOK) {storageOK=false;toast('当前浏览器无法保存进度，本次仍可正常学习。');} }
  }
  function planFeedback(id=active) {
    const c=COURSES[id], s=root.courses[id], p=c.program;
    const selected=c.exercises.filter(e=>s.plan[e.id].selected), total=selected.reduce((n,e)=>n+s.plan[e.id].sets,0), messages=[];
    messages.push(selected.length>=p.minExercises&&selected.length<=p.maxExercises
      ?'✓ 动作数量合适：'+selected.length+' 个。':'○ 本章请选择 '+p.minExercises+'–'+p.maxExercises+' 个动作。');
    messages.push(total>=p.minSets&&total<=p.maxSets?'✓ 共 '+total+' 个工作组，热身另计。':'○ 当前 '+total+' 组，本例目标为 '+p.minSets+'–'+p.maxSets+' 个工作组。');
    for (const pattern of p.requiredPatterns||[]) messages.push(selected.some(e=>e.pattern===pattern.id)
      ?'✓ 已包含'+pattern.name+'。':'○ 加入'+pattern.name+'，让动作模式更完整。');
    messages.push([2,3].includes(s.planRir)?'✓ 本例保留约 '+s.planRir+' 次高质量动作余力。':'○ 本例先采用 RIR 2–3，稳定动作以技术质量为先。');
    if(selected.some(e=>e.type==='compound')&&(s.compoundRest<p.compoundRest[0]||s.compoundRest>p.compoundRest[1]))
      messages.push('○ 复合 / 稳定练习休息参考 '+p.compoundRest[0]+'–'+p.compoundRest[1]+' 秒。');
    if(selected.some(e=>e.type==='isolation')&&(s.isolationRest<p.isolationRest[0]||s.isolationRest>p.isolationRest[1]))
      messages.push('○ 单关节 / 辅助练习休息参考 '+p.isolationRest[0]+'–'+p.isolationRest[1]+' 秒。');
    if(!messages.some(m=>m.startsWith('○'))) messages.push('✓ 休息安排符合本例目标，未恢复时可以适当延长。');
    return {valid:!messages.some(m=>m.startsWith('○')),messages,selected,total};
  }
  function taskDone(lesson,id=active) {
    const c=COURSES[id],s=root.courses[id];
    if(lesson==='anatomy') return c.regions.every(r=>s.regions.includes(r.id));
    if(lesson==='movement') return c.exercises.every(e=>s.exercises.includes(e.id));
    if(lesson==='control') return [2,3].includes(s.rir)&&s.quality.length===3;
    return s.planPassed&&planFeedback(id).valid;
  }
  function lessonDone(lesson,id=active) {return taskDone(lesson,id)&&COURSES[id].questions.filter(q=>q.lesson===lesson).every(q=>root.courses[id].mastered.includes(q.id));}
  const completedCount=(id=active)=>LESSONS.filter(l=>lessonDone(l,id)).length;
  function progress(id=active) {
    let value=0; const c=COURSES[id],s=root.courses[id];
    for(const l of LESSONS) {const qs=c.questions.filter(q=>q.lesson===l);value+=(qs.filter(q=>s.mastered.includes(q.id)).length+Number(taskDone(l,id)))/(qs.length+1);}
    return Math.round(value/4*100);
  }
  const allQuestions=()=>ORDER.flatMap(course=>COURSES[course].questions.map(q=>({...q,course})));
  const allWrong=()=>allQuestions().filter(q=>root.courses[q.course].wrong.includes(q.id));
  const totalMastered=()=>ORDER.reduce((n,id)=>n+root.courses[id].mastered.length,0);
  const totalCleared=()=>ORDER.reduce((n,id)=>n+completedCount(id),0);
  const finishedCourses=()=>ORDER.filter(id=>completedCount(id)===4);
  const allComplete=()=>finishedCourses().length===6;
  function updateProgress() {
    const p=Math.round(ORDER.reduce((n,id)=>n+progress(id),0)/6);
    $('#progress-number').innerHTML=p+'<small>%</small>';$('#progress-ring').style.setProperty('--progress',p+'%');
    $('#progress-caption').textContent=allComplete()?'六部位系统训练 · 全部通关':'已完成 '+finishedCourses().length+' / 6 章 · '+totalCleared()+' / 24 关';
    $('#course-progress').textContent='本章 '+progress()+'%';$('#note-count').textContent=totalMastered();$('#wrong-count').textContent=allWrong().length;
    $('#course-badge').textContent=completedCount()===4?'本章已通关':'完整课程';
    renderMap();renderSteps();
    const b=$('#start-quiz');if(b){b.disabled=!taskDone(state.lesson);b.textContent=lessonDone(state.lesson)?'再练一次 ↗':'知识挑战 →';}
  }
  function bodyIcon(index) {
    const shape=['<path d="M18 21q4-3 7 0 4-3 7 0v8q-4 4-7 0-4 4-7 0z"/>','<path d="M18 20h14v13l-7 5-7-5z"/>','<path d="M13 19l6-2 1 9-6 2zm18-2 6 2-1 9-6-2z"/>','<path d="M18 40h14l3 19h-7l-3-15-3 15h-7z"/>','<path d="M11 25l6 2-5 13-6-2zm22 2 6-2 5 13-6 2z"/>','<path d="M20 31h10v11H20z"/>'][index];
    return '<svg viewBox="0 0 50 64" aria-hidden="true"><path d="M20 6h10l1 9 8 4 5 19-6 2-5-13-1 14 3 18h-7l-3-15-3 15h-7l3-18-1-14-5 13-6-2 5-19 8-4z" fill="#7f907041" stroke="#9baa7f77" stroke-width=".8"/><g fill="#c5a06f">'+shape+'</g></svg>';
  }
  function renderMap() {
    const labels=['CHEST','BACK','SHOULDERS','LEGS','ARMS','CORE'];
    $('#body-regions').innerHTML=ORDER.map((id,i)=>'<button class="region-card '+(id===active?'current ':'')+(completedCount(id)===4?'finished':'')+'" data-body="'+id+'" '+(id===active?'aria-current="page"':'')+'>'+bodyIcon(i)+'<span class="region-copy"><b>'+esc(COURSES[id].name)+'</b><small>'+labels[i]+'</small></span><span class="region-status">'+(completedCount(id)===4?'✓ 已通关':id===active?'正在探索':progress(id)?progress(id)+'%':'开始学习')+'</span><span class="region-track"><i style="width:'+progress(id)+'%"></i></span></button>').join('');
  }
  $('#body-regions').addEventListener('click',e=>{const b=e.target.closest('[data-body]');if(b)setCourse(b.dataset.body,true);});
  function renderSteps() {
    const names=['解剖探索','动作实验','强度控制','训练编排'];
    $('#lesson-steps').innerHTML=DATA.lessons.map((l,i)=>'<button class="lesson-step '+(state.lesson===l.id?'active ':'')+(lessonDone(l.id)?'completed':'')+'" data-lesson="'+l.id+'" '+(state.lesson===l.id?'aria-current="step"':'')+'><span>'+(lessonDone(l.id)?'✓':String(i+1).padStart(2,'0'))+'</span><b>'+names[i]+'</b><small>'+(lessonDone(l.id)?'已通关':'0'+(i+1))+'</small></button>').join('');
  }
  function scrollToLesson() {$('#lesson-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
  function switchLesson(id,scroll=false) {
    if(!LESSONS.includes(id))return;state.lesson=id;save();renderLesson();updateProgress();if(scroll)scrollToLesson();
  }
  $('#lesson-steps').addEventListener('click',e=>{const b=e.target.closest('[data-lesson]');if(b)switchLesson(b.dataset.lesson,innerWidth<621);});
  function setCourse(id,scroll=false) {
    if(!ORDER.includes(id))return;
    active=id;root.course=id;DATA=COURSES[id];state=root.courses[id];region=state.regions.at(-1)||null;currentExercise=state.currentExercise;angle=25;
    document.title=DATA.name+'系统训练课 · HERACLES LAB 健身秘典';
    $('#chapter-number').textContent=String(ORDER.indexOf(id)+1).padStart(2,'0');$('#course-english').textContent=DATA.english;
    $('#course-title').innerHTML=esc(DATA.title)+'<span>训练入门</span>';$('#lesson-steps').setAttribute('aria-label',DATA.name+'课程关卡');
    $('#anatomy-zoom').setAttribute('aria-label','放大'+DATA.title+'解剖图');$('#visual-kicker').textContent=DATA.view+' / ANATOMY';
    $('#anatomy-caption').textContent=DATA.intro;
    $('#anatomy-legend').innerHTML=DATA.regions.map(r=>'<span><i style="background:'+r.color+'"></i>'+esc(r.name)+'</span>').join('');
    $('#anatomy-controls').innerHTML=DATA.regions.map((r,i)=>'<button data-region="'+r.id+'" aria-pressed="false">0'+(i+1)+' <span>'+esc(r.name)+'</span> ↗</button>').join('');
    $$('#anatomy-controls [data-region]').forEach(b=>b.addEventListener('click',()=>selectRegion(b.dataset.region)));
    save();renderLesson();updateProgress();loadAnatomy(id);
    if(location.hash!=='#course='+id)history.replaceState(null,'','#course='+id);
    if(scroll)$('#course-title').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }
  function highlightRegion() {
    $$('[data-region]').forEach(el=>{const selected=el.dataset.region===region;
      if(el.tagName.toLowerCase()==='button')el.setAttribute('aria-pressed',selected);
      else{el.classList.toggle('selected',selected);if(el.getAttribute('role')==='button')el.setAttribute('aria-pressed',selected);}});
    $('#anatomy-container').classList.toggle('has-selection',Boolean(region));
  }
  function selectRegion(id) {
    if(!DATA.regions.some(r=>r.id===id))return;
    region=id;if(!state.regions.includes(id))state.regions.push(id);save();highlightRegion();
    if(state.lesson==='anatomy')renderLesson();updateProgress();
  }
  async function loadAnatomy(id) {
    const request=++anatomyRequest,c=COURSES[id];$('#anatomy-container').innerHTML='<p class="loading">正在载入'+esc(c.name)+'解剖图…</p>';
    try {
      let svg=svgCache.get(id);if(!svg){const r=await fetch(c.anatomy);if(!r.ok)throw Error('anatomy');svg=await r.text();svgCache.set(id,svg);}
      if(request!==anatomyRequest||active!==id)return;
      $('#anatomy-container').innerHTML=svg;
      $$('#anatomy-container [data-region]').forEach(g=>{
        const item=c.regions.find(r=>r.id===g.dataset.region);if(!item)return;
        g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label','探索'+item.name);
        g.addEventListener('click',()=>selectRegion(g.dataset.region));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRegion(g.dataset.region);}});
      });highlightRegion();
    } catch(e) {
      if(request!==anatomyRequest)return;
      $('#anatomy-container').innerHTML='<img src="'+esc(c.anatomy)+'" alt="'+esc(c.title)+'解剖示意" style="width:100%;height:100%;object-fit:contain">';
      toast('解剖交互图未载入，可用下方肌肉按钮继续学习。');
    }
  }
  function concept(n,title,copy) {return '<div class="concept-card"><span class="concept-index">'+n+'</span><div><h4>'+esc(title)+'</h4><p>'+esc(copy)+'</p></div></div>';}
  function actions(hint) {return '<div class="lesson-actions"><small>'+esc(hint)+'</small><button id="start-quiz" class="primary" '+(!taskDone(state.lesson)?'disabled':'')+'>'+(lessonDone(state.lesson)?'再练一次 ↗':'知识挑战 →')+'</button></div>';}
  function renderLesson() {
    const l=DATA.lessons.find(x=>x.id===state.lesson),i=LESSONS.indexOf(l.id);
    let html='<div class="lesson-kicker"><span>LEVEL 0'+(i+1)+' / '+['认识结构','理解动作','控制负荷','连接知识'][i]+'</span>约 '+l.minutes+' 分钟 · '+DATA.questions.filter(q=>q.lesson===l.id).length+' 道挑战</div><h3>'+esc(l.title)+'</h3><p class="lesson-intro">'+esc(l.subtitle)+'</p>';
    if(l.id==='anatomy') {
      const selected=DATA.regions.find(r=>r.id===region);
      html+='<div class="concept-cards">'+DATA.concepts.map((c,i)=>concept('0'+(i+1),c.title,c.copy)).join('')+'</div><div class="explore-task"><div class="task-label">✧ 解剖探索任务</div><p>'+(selected?esc(selected.name+'：'+selected.description):'点击图中的肌肉，或下方按钮，逐一认识各个区域。')+'</p><div class="checklist">'+DATA.regions.map(r=>'<span class="'+(state.regions.includes(r.id)?'done':'')+'">'+(state.regions.includes(r.id)?'✓':'○')+' '+esc(r.name)+'</span>').join('')+'</div></div><p class="callout">'+esc(DATA.anatomyNote)+'</p>'+actions(taskDone(l.id)?'探索完成，试试你的理解。':'先观察全部肌肉分区，再开启挑战。');
    } else if(l.id==='movement') {
      html+='<div class="exercise-tabs" aria-label="选择训练动作">'+DATA.exercises.map(e=>'<button class="exercise-tab '+(e.id===currentExercise?'active':'')+'" data-exercise="'+e.id+'" aria-pressed="'+(e.id===currentExercise)+'">'+esc(e.name)+(state.exercises.includes(e.id)?' ·':'')+'</button>').join('')+'</div><div id="exercise-detail"></div><div class="checklist">已探索 '+state.exercises.length+' / '+DATA.exercises.length+' 个动作</div>'+actions(taskDone(l.id)?'四种动作已探索，进入情境挑战。':'依次切换四个动作，比较特点和练习方法。');
    } else if(l.id==='control') {
      html+='<div class="rir-number" id="rir-number">'+state.rir+'</div><p class="rir-caption">RIR · 预计还能完成的高质量次数</p><div class="range-control"><label class="range-label" for="rir-slider"><span>调整结束这一组时的余力</span><output id="rir-output">RIR '+state.rir+'</output></label><input id="rir-slider" type="range" min="0" max="5" step="1" value="'+state.rir+'"><p class="range-feedback" id="rir-feedback"></p></div><div class="control-cues"><p class="task-label">'+esc(DATA.name)+'训练的三项自检</p>'+DATA.quality.map((x,i)=>'<label><input type="checkbox" data-quality="'+i+'" '+(state.quality.includes(i)?'checked':'')+'>'+esc(x)+'</label>').join('')+'</div><p class="callout">'+esc(active==='core'?'动态核心动作可按剩余高质量次数估计余力。抗伸展、抗旋转练习在呼吸或腰盆控制变差前停止；等长支撑的秒数不能直接换算为 RIR。':'本课先练习 RIR 2–3。估计还能再做 2–3 次同样质量的动作时停下，不需要每组练到失败。')+'</p>'+actions('选择 RIR 2–3，并完成三项动作质量自检。');
    } else {
      html+='<div class="builder" aria-label="训练动作与组数">'+DATA.exercises.map(e=>'<div class="builder-row '+(state.plan[e.id].selected?'active':'')+'"><input type="checkbox" aria-label="选择'+esc(e.name)+'" data-plan="'+e.id+'" '+(state.plan[e.id].selected?'checked':'')+'><span class="builder-copy"><b>'+esc(e.name)+'</b><small>'+esc(e.reps)+' · '+(e.type==='compound'?'复合 / 稳定练习':'单关节 / 辅助练习')+'</small></span><label>组数 <select data-sets="'+e.id+'" aria-label="'+esc(e.name)+'工作组数">'+[1,2,3,4,5].map(n=>'<option '+(state.plan[e.id].sets===n?'selected':'')+'>'+n+'</option>').join('')+'</select></label></div>').join('')+'</div><div class="builder-settings"><label>目标余力 <select id="plan-rir" aria-label="训练计划目标RIR">'+[0,1,2,3,4,5].map(n=>'<option value="'+n+'" '+(state.planRir===n?'selected':'')+'>RIR '+n+'</option>').join('')+'</select></label><label>复合 / 稳定 '+restSelect('compound-rest',state.compoundRest)+'</label><label>单关节 / 辅助 '+restSelect('isolation-rest',state.isolationRest)+'</label></div><p class="builder-summary" id="builder-summary"></p><button class="secondary" id="check-plan">检验我的编排 ↗</button><div id="builder-feedback"></div><p class="program-notes">本章目标：'+DATA.program.minExercises+'–'+DATA.program.maxExercises+' 个动作、'+DATA.program.minSets+'–'+DATA.program.maxSets+' 个工作组、RIR 2–3。'+esc(DATA.program.note)+'</p>'+actions('检验动作模式、组数、余力和休息，再进入挑战。');
    }
    const reading='<details class="knowledge-details"><summary>本关知识 · 展开完整讲解</summary><ol>'+l.points.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ol><p>'+esc(l.summary)+'</p></details>';
    html=html.replace('<div class="lesson-actions">',reading+'<div class="lesson-actions">');
    $('#lesson-panel').innerHTML=html;$('#start-quiz').addEventListener('click',()=>startQuiz('lesson',active,state.lesson));
    if(l.id==='movement') {
      $$('[data-exercise]').forEach(b=>b.addEventListener('click',()=>{
        currentExercise=b.dataset.exercise;state.currentExercise=currentExercise;if(!state.exercises.includes(currentExercise))state.exercises.push(currentExercise);
        const e=DATA.exercises.find(e=>e.id===currentExercise);region=DATA.regions.some(r=>r.id===e.region)?e.region:null;
        save();renderLesson();highlightRegion();updateProgress();
      }));renderExercise();
    }
    if(l.id==='control') {
      updateRir();$('#rir-slider').addEventListener('input',e=>{state.rir=Number(e.target.value);save();updateRir();updateProgress();});
      $$('[data-quality]').forEach(c=>c.addEventListener('change',()=>{const n=Number(c.dataset.quality);state.quality=state.quality.filter(x=>x!==n);if(c.checked)state.quality.push(n);save();updateProgress();}));
    }
    if(l.id==='program') {
      updateBuilderSummary();
      $$('[data-plan],[data-sets],#plan-rir,#compound-rest,#isolation-rest').forEach(c=>c.addEventListener('change',()=>{
        if(c.dataset.plan)state.plan[c.dataset.plan].selected=c.checked;if(c.dataset.sets)state.plan[c.dataset.sets].sets=Number(c.value);
        if(c.id==='plan-rir')state.planRir=Number(c.value);if(c.id==='compound-rest')state.compoundRest=Number(c.value);if(c.id==='isolation-rest')state.isolationRest=Number(c.value);
        state.planPassed=false;$('#builder-feedback').innerHTML='';$$('[data-plan]').forEach(c=>c.closest('.builder-row').classList.toggle('active',c.checked));save();updateBuilderSummary();updateProgress();
      }));
      $('#check-plan').addEventListener('click',()=>{const f=planFeedback();state.planPassed=f.valid;$('#builder-feedback').innerHTML='<div class="builder-feedback">'+f.messages.map(m=>'<span>'+esc(m)+'</span>').join('')+(f.valid?'<span>进阶方法：保持动作质量，先在目标次数内提高表现，稳定达到上沿并保留目标余力后再小幅加重或进阶。</span>':'')+'</div>';save();updateProgress();});
      if(taskDone('program'))$('#builder-feedback').innerHTML='<div class="builder-feedback">✓ 这套编排已通过本章目标检验。</div>';
    }
  }
  function renderExercise() {
    const e=DATA.exercises.find(x=>x.id===currentExercise);
    $('#exercise-detail').innerHTML='<img class="exercise-illustration" src="'+esc(e.art)+'" alt="'+esc(e.name)+'起止位置与动作路径示意"><div class="exercise-detail"><h4>'+esc(e.name)+' <small>'+esc(e.english.toUpperCase())+'</small></h4><p class="exercise-focus">'+esc(e.focus)+'</p><p>'+esc(e.description)+'</p><ul class="exercise-cues">'+e.cues.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul></div>'+(active==='chest'&&e.id==='incline'?'<div class="range-control"><label class="range-label" for="angle-slider"><span>探索靠背角度</span><output id="angle-output">'+angle+'°</output></label><input type="range" min="0" max="60" step="5" value="'+angle+'" id="angle-slider"><svg viewBox="0 0 240 70" width="100%" height="60" aria-label="可调靠背角度示意"><path d="M40 58H215" stroke="#83916e" stroke-width="1" stroke-dasharray="3 3"/><g id="angle-bench" transform="rotate(-'+angle+' 65 58)"><path d="M65 58H195" stroke="#d7b781" stroke-width="5" stroke-linecap="round"/><path d="M70 47H172" stroke="#a7b796" stroke-width="7" stroke-linecap="round"/><circle cx="187" cy="47" r="8" fill="#a7b796"/></g></svg><p class="range-feedback" id="angle-feedback"></p></div>':'<p class="callout">常见误区：'+esc(e.mistake)+'</p>');
    if(active==='chest'&&e.id==='incline'){updateAngle();$('#angle-slider').addEventListener('input',ev=>{angle=Number(ev.target.value);$('#angle-output').textContent=angle+'°';$('#angle-bench').setAttribute('transform','rotate(-'+angle+' 65 58)');updateAngle();});}
  }
  function updateAngle() {$('#angle-feedback').textContent=angle===0?'0° 接近平板位置，不同角度改变上臂相对躯干的路径。':angle<15?'较低上斜角度：结合身体比例和器械，观察是否舒适可控。':angle<=30?'15–30° 是常见的尝试起点，可增加锁骨部训练侧重，并非唯一最佳角度。':'角度进一步升高也会改变肩部参与，不能把越陡理解成胸肌效果越好。';}
  function updateRir() {$('#rir-number').textContent=state.rir;$('#rir-output').textContent='RIR '+state.rir;$('#rir-feedback').textContent=state.rir===0?'预计无法再完成一次同样质量的动作，新手不需要每组都到这里。':state.rir===1?'还剩约 1 次余力，努力程度较高。本课先尝试保留 2–3 次。':state.rir<=3?'✓ 本课目标：预计还能再做 '+state.rir+' 次同样质量的动作。保持控制，不需要真的做至失败。':'还剩约 '+state.rir+' 次余力，挑战相对较小。为学习本课目标，请尝试 RIR 2–3。';}
  function restSelect(id,value) {return '<select id="'+id+'" aria-label="'+(id==='compound-rest'?'复合或稳定练习':'单关节或辅助练习')+'组间休息">'+[30,60,90,120,150,180].map(n=>'<option value="'+n+'" '+(n===value?'selected':'')+'>'+n+' 秒</option>').join('')+'</select>';}
  function updateBuilderSummary() {const f=planFeedback();$('#builder-summary').innerHTML='已选 <strong>'+f.selected.length+'</strong> 个动作 · 共 <strong>'+f.total+'</strong> 个工作组';}

  const dialog=$('#learning-dialog');
  function openDialog(html) {if(!dialog.open)previousFocus=document.activeElement;$('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();$('#dialog-close').focus();}
  function closeDialog() {dialog.close();if(previousFocus?.isConnected)previousFocus.focus();}
  $('#dialog-close').addEventListener('click',closeDialog);
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  dialog.addEventListener('cancel',()=>{if(previousFocus?.isConnected)previousFocus.focus();});
  function startQuiz(mode,course=active,lesson=state.lesson) {
    if(mode==='lesson'&&!taskDone(lesson,course))return;
    let refs=mode==='review'?allWrong().map(q=>({course:q.course,id:q.id})):COURSES[course].questions.filter(q=>q.lesson===lesson).map(q=>({course,id:q.id}));
    if(mode==='final')refs=ORDER.flatMap(id=>[0,4,7,9].map(i=>({course:id,id:COURSES[id].questions[i].id})));
    if(!refs.length){toast('暂时没有错题，继续探索课程吧。');return;}
    root.quiz={refs,cursor:0,selections:refs.map(()=>null),mode,course,lesson};save();renderQuiz();
  }
  function renderQuiz() {
    const quiz=root.quiz;if(!quiz)return;const ref=quiz.refs[quiz.cursor],c=COURSES[ref.course],q=c.questions.find(q=>q.id===ref.id);
    const selected=quiz.selections[quiz.cursor],answered=selected!==null;
    openDialog('<p class="eyebrow">'+(quiz.mode==='review'?'REVISIT / 全课程错题复习':quiz.mode==='final'?'FINAL CHALLENGE / 六部位综合挑战':'KNOWLEDGE CHALLENGE / 知识挑战')+'</p><div class="quiz-progress">'+quiz.refs.map((_,i)=>'<i class="'+(i<=quiz.cursor?'done':'')+'"></i>').join('')+'</div><p class="lesson-kicker">'+esc(c.name)+' · 第 '+(quiz.cursor+1)+' / '+quiz.refs.length+' 题 <span>不计时 · 理解比速度重要</span></p><h3 class="quiz-prompt">'+esc(q.prompt)+'</h3><div class="quiz-options">'+q.options.map((o,i)=>'<button class="quiz-option '+(answered&&i===q.correct?'correct ':'')+(answered&&i===selected&&i!==q.correct?'wrong':'')+'" data-answer="'+i+'" '+(answered?'disabled':'')+'><span>'+['A','B','C'][i]+'</span>'+esc(o)+'</button>').join('')+'</div>'+(answered?'<div class="quiz-feedback" role="status"><h4>'+(selected===q.correct?'✓ 理解正确，收下一条知识。':'再想一想，正确答案是 '+['A','B','C'][q.correct]+'。')+'</h4><p>'+esc(q.explanation)+'</p></div><div class="quiz-next"><button class="primary" id="quiz-next">'+(quiz.cursor===quiz.refs.length-1?'查看学习成果':'理解了，下一题')+' →</button></div>':''));
    $$('[data-answer]').forEach(b=>b.addEventListener('click',()=>answerQuiz(Number(b.dataset.answer))));if(answered)$('#quiz-next').addEventListener('click',advanceQuiz);
  }
  function answerQuiz(index) {
    const quiz=root.quiz;if(!quiz||quiz.selections[quiz.cursor]!==null||![0,1,2].includes(index))return;
    const ref=quiz.refs[quiz.cursor],q=COURSES[ref.course].questions.find(q=>q.id===ref.id),s=root.courses[ref.course];quiz.selections[quiz.cursor]=index;
    if(index===q.correct){if(!s.mastered.includes(q.id))s.mastered.push(q.id);s.wrong=s.wrong.filter(id=>id!==q.id);}
    else{s.mastered=s.mastered.filter(id=>id!==q.id);if(!s.wrong.includes(q.id))s.wrong.push(q.id);}
    save();updateProgress();renderQuiz();$('#quiz-next')?.focus();
  }
  function advanceQuiz() {if(!root.quiz||root.quiz.selections[root.quiz.cursor]===null)return;if(root.quiz.cursor<root.quiz.refs.length-1){root.quiz.cursor++;save();renderQuiz();}else finishQuiz();}
  function nextUnfinishedCourse(start=active) {for(let n=1;n<=6;n++){const id=ORDER[(ORDER.indexOf(start)+n)%6];if(completedCount(id)<4)return id;}return null;}
  function finishQuiz() {
    const quiz=root.quiz,correct=quiz.refs.filter((r,i)=>COURSES[r.course].questions.find(q=>q.id===r.id).correct===quiz.selections[i]).length;
    const missed=quiz.refs.filter(r=>root.courses[r.course].wrong.includes(r.id)),chapterComplete=completedCount(quiz.course)===4,all=allComplete();root.quiz=null;save();updateProgress();
    const title=all?'六部位系统训练，全部通关':quiz.mode==='review'?(missed.length?'还剩 '+missed.length+' 道，继续巩固':'本轮错题已掌握'):quiz.mode==='final'?(missed.length?'综合挑战完成，继续巩固':'综合挑战，全部答对'):chapterComplete?COURSES[quiz.course].name+'入门徽章，已获得':missed.length?'带着新理解，再试一次':'这一关，你学会了';
    openDialog('<div class="result"><p class="eyebrow" style="justify-content:center">YOUR KNOWLEDGE IS GROWING</p><div class="result-seal">'+(all||chapterComplete?'✧':missed.length?'◇':'✓')+'</div><h2 class="dialog-title">'+esc(title)+'</h2><p>本轮答对 <strong>'+correct+' / '+quiz.refs.length+'</strong> 题。'+(missed.length?'错题已记录，复习答对后计入掌握。':'知识已收进学习笔记。')+'</p><div class="result-actions">'+(missed.length?'<button class="primary" id="result-review">复习错题 →</button>':'')+(!all&&!missed.length?'<button class="primary" id="result-continue">'+(chapterComplete?'学习下个部位':'继续学习')+' →</button>':'')+'<button class="secondary" id="result-back">返回课程</button></div></div>');
    $('#result-back').addEventListener('click',closeDialog);$('#result-review')?.addEventListener('click',()=>startQuiz('review',quiz.course,quiz.lesson));
    $('#result-continue')?.addEventListener('click',()=>{closeDialog();let id=quiz.course;if(completedCount(id)===4)id=nextUnfinishedCourse(id)||id;setCourse(id);switchLesson(LESSONS.find(l=>!lessonDone(l,id))||'anatomy',true);});
  }
  $('#review-open').addEventListener('click',()=>startQuiz('review'));
  function notebook(filter='all') {
    const questions=allQuestions().filter(q=>root.courses[q.course].mastered.includes(q.id)&&(filter==='all'||q.course===filter));
    openDialog('<p class="eyebrow">YOUR COMPLETE TRAINING NOTEBOOK</p><h2 class="dialog-title">我的学习笔记</h2><p class="dialog-copy">已掌握 '+totalMastered()+' / 60 个知识点 · 通关 '+totalCleared()+' / 24 关</p><div class="badge-grid">'+ORDER.map(id=>'<div class="course-medal '+(completedCount(id)===4?'earned':'')+'"><span>'+(completedCount(id)===4?'✧':'◇')+'</span><b>'+esc(COURSES[id].name)+'</b><small>'+completedCount(id)+' / 4 关</small></div>').join('')+'</div><div class="notebook-filters" aria-label="按部位筛选笔记">'+['all',...ORDER].map(id=>'<button class="'+(id===filter?'active':'')+'" data-note-filter="'+id+'">'+(id==='all'?'全部':esc(COURSES[id].name))+'</button>').join('')+'</div>'+(questions.length?'<div class="dialog-list">'+questions.map(q=>'<article class="note-card"><small>'+esc(COURSES[q.course].name+' · '+COURSES[q.course].lessons.find(l=>l.id===q.lesson).title)+'</small><h4>'+esc(q.options[q.correct])+'</h4><p>'+esc(q.explanation)+'</p></article>').join('')+'</div>':'<p class="empty-note">这里还没有笔记。每答对一题，就会留下一个可以带去训练的知识点。</p>')+'<div class="notebook-actions"><button class="secondary" id="export-progress">导出六部位学习备份</button><label class="secondary" style="cursor:pointer">导入学习备份<input id="import-progress" type="file" accept="application/json" class="sr-only"></label><button class="secondary" id="final-challenge">六部位综合挑战 ↗</button></div><p class="program-notes">进度仅保存在当前浏览器，换设备或域名前请先导出。支持导入之前的胸大肌学习备份。综合挑战抽取每章 4 题，共 24 题。</p>');
    $$('[data-note-filter]').forEach(b=>b.addEventListener('click',()=>notebook(b.dataset.noteFilter)));$('#final-challenge').addEventListener('click',()=>startQuiz('final'));
    $('#export-progress').addEventListener('click',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({kind:'heracles-academy',version:2,state:root},null,2)],{type:'application/json'}));a.download='heracles-six-part-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
    $('#import-progress').addEventListener('change',async e=>{
      const f=e.target.files[0];if(!f)return;
      try {
        if(f.size>300000)throw Error();const data=JSON.parse(await f.text());let imported;
        if(data.kind==='heracles-academy'&&data.version===2&&data.state?.version===2&&data.state.courses)imported=cleanRoot(data.state);
        else if(data.kind==='heracles-chest'&&data.version===1&&data.state&&typeof data.state==='object'){
          imported=cleanRoot(root);imported.courses.chest=sanitize('chest',data.state);imported.course='chest';imported.quiz=null;
        }else throw Error();
        localStorage.setItem(KEY,JSON.stringify(imported));location.reload();
      }catch(err){toast('无法导入，请选择本游戏导出的有效学习备份，并确认浏览器允许保存。');}
    });
  }
  $('#notebook-open').addEventListener('click',()=>notebook());
  $('#anatomy-zoom').addEventListener('click',()=>openDialog('<p class="eyebrow">'+esc(DATA.english)+' / 解剖图谱</p><h2 class="dialog-title">'+esc(DATA.title)+' · '+esc(DATA.view)+'</h2><img class="zoom-art" src="'+esc(DATA.anatomy)+'" alt="'+esc(DATA.title)+'各区域解剖示意"><p class="program-notes">'+esc(DATA.anatomyNote)+'</p><a class="zoom-link" href="'+esc(DATA.anatomy)+'" target="_blank" rel="noopener">在新窗口查看原图并缩放 ↗</a>'));
  $('#sources-open').addEventListener('click',()=>openDialog('<p class="eyebrow">LEARN WITH EVIDENCE</p><h2 class="dialog-title">理解背后的依据</h2><p class="dialog-copy">用基础解剖、关节运动和阻力训练原则讲解六部位训练。图中深层窗口仅用于说明肌肉层次，不代表都能在体表看到。</p><div class="sources-list"><a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/11-introduction" target="_blank" rel="noopener noreferrer">OpenStax · 肌肉系统解剖学，第 11 章 ↗</a><p>躯干、肩带、上肢和下肢肌肉的起止、功能与协同。页面中的中文讲解可直接阅读，外部链接仅用于进一步查阅。</p><a href="https://pubmed.ncbi.nlm.nih.gov/19204579/" target="_blank" rel="noopener noreferrer">ACSM · 健康成人阻力训练渐进模型（2009）↗</a><p>负荷、次数、休息和进阶的总体原则。课程中的单堂例子应结合每周频率和恢复调整。</p><a href="https://pubmed.ncbi.nlm.nih.gov/33497853/" target="_blank" rel="noopener noreferrer">Grgic 等 · 力竭与非力竭训练的系统综述（2022）↗</a><p>不要求每组做到力竭。稳定练习以动作控制为先，不将支撑秒数直接等同于 RIR 次数。</p></div><p class="callout">课程的角度、组数、次数与休息范围都是教学参考，并非唯一标准。尖锐或持续的关节疼痛不是训练目标，应停止相关动作并寻求合适的专业评估。</p>'));
  function schedule(mode='three') {
    const weeks={three:[['周一 · 全身 A','蹲类 + 水平推 + 水平拉 + 侧平举 + 核心抗伸展'],['周三 · 全身 B','髋铰链 + 垂直拉 + 上斜推 + 屈肘 / 伸肘辅助 + 抗旋转'],['周五 · 全身 A / B 交替','重复已掌握的基础模式，按恢复调整工作组，下一周交换 A / B 次数。']],four:[['周一 / 周四 · 上肢','胸部推举 + 垂直 / 水平拉 + 侧 / 后束 + 少量屈肘 / 伸肘辅助'],['周二 / 周五 · 下肢与核心','蹲类 + 髋铰链 + 屈腿 / 小腿辅助 + 核心抗伸展 / 抗旋转'],['其余日 · 恢复与日常活动','根据疲劳调整间隔，轻松走路或其他舒适活动，不把恢复日变成另一堂高强度课。']]};
    openDialog('<p class="eyebrow">BUILD A WEEK, NOT JUST A WORKOUT</p><h2 class="dialog-title">把六部位连成一周</h2><p class="dialog-copy">先选可持续的训练天数。推举也会训练肩前束和三头肌，拉类动作也会训练屈肘肌，别重复堆叠所有章节的组数。</p><div class="notebook-filters"><button data-schedule="three" class="'+(mode==='three'?'active':'')+'">每周 3 天 · 全身</button><button data-schedule="four" class="'+(mode==='four'?'active':'')+'">每周 4 天 · 上下肢</button></div><div class="dialog-list">'+weeks[mode].map(([title,copy])=>'<article class="note-card"><h4>'+title+'</h4><p>'+copy+'</p></article>').join('')+'</div><p class="callout">这是动作模式分配示例。可先为每次选择的动作安排少量工作组，再结合表现和恢复调整；不要把六章的单堂教学组数直接相加。热身不计工作组，增加次数或重量应循序渐进。</p><div class="notebook-actions"><button class="secondary" id="weekly-export">下载周训练思路</button></div>');
    $$('[data-schedule]').forEach(b=>b.addEventListener('click',()=>schedule(b.dataset.schedule)));
    $('#weekly-export').addEventListener('click',()=>{const content='HERACLES LAB · 周训练思路（教学示例）\n\n'+weeks[mode].map(x=>x.join('\n')).join('\n\n')+'\n\n不要将六章教学组数直接相加。先学习稳定动作，结合频率与恢复安排总量。\n';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));a.download='heracles-weekly-training.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
  }
  $('#schedule-open').addEventListener('click',()=>schedule());
  document.addEventListener('keydown',e=>{if(!dialog.open||!root.quiz||!$('#dialog-content [data-answer]'))return;if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(['1','2','3'].includes(e.key)){e.preventDefault();answerQuiz(Number(e.key)-1);}else if(e.key==='Enter'&&$('#quiz-next')&&e.target.id!=='quiz-next'){e.preventDefault();advanceQuiz();}});
  window.addEventListener('hashchange',()=>{const id=new URLSearchParams(location.hash.slice(1)).get('course');if(ORDER.includes(id)&&id!==active)setCourse(id);});
  const hashCourse=new URLSearchParams(location.hash.slice(1)).get('course');setCourse(ORDER.includes(hashCourse)?hashCourse:active);
  if(!storageOK)toast('当前浏览器未启用进度存储，本次仍可正常学习。');if(root.quiz)renderQuiz();
  if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
