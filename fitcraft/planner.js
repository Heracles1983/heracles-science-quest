(function () {
  'use strict';
  const D=window.FIT_PLANNER_DATA,E=window.FIT_PLAN_ENGINE,KEY='fitcraft-planning-v1';
  const host=document.querySelector('#planner');if(!host||!D||!E)return;
  const ORDER=['chest','back','shoulders','legs','arms','core'];
  const NAMES={chest:'胸部',back:'背部',shoulders:'肩部',legs:'腿部',arms:'手臂',core:'核心'};
  const TABS=['principles','cases','builder','challenge'];
  const TAB_NAMES=['进阶原理','经典计划','亲手编排','结课挑战'];
  const RULES={linear:'达标后线性加重',double:'先次数后重量',skill:'先控制再进阶'};
  const BASIS={total:'总外加负荷 kg', 'per-hand':'单只哑铃 kg',bodyweight:'自重 / 动作版本'};
  const $=s=>host.querySelector(s),$$=s=>Array.from(host.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone=o=>JSON.parse(JSON.stringify(o));
  const validObject=o=>o&&typeof o==='object'&&!Array.isArray(o);
  const catalog=new Map(E.catalog.map(e=>[e.key,e]));
  let storageOK=true,noticeTimer;

  function canonicalPlan(raw) {
    const p=E.normalizePlan(raw);for(const day of p.days)for(const item of day.items)if(item.progression==='linear')item.repsMax=item.repsMin;return p;
  }
  function fromTemplate(t) {
    return canonicalPlan({...clone(t),demoId:t.id,method:'double',days:t.days.map(day=>({...day,items:day.items.map(item=>{
      const ex=catalog.get(item.key),body=ex.equipment==='自重';
      return {...item,progression:ex.course==='core'||body?'skill':'double',startWeight:0,increment:ex.type==='compound'?1:0.5,loadBasis:body?'bodyweight':ex.equipment==='哑铃'&&!['legs:squat','arms:overhead'].includes(ex.key)?'per-hand':'total'};
    })}))});
  }
  function defaults() {
    return {version:1,tab:'principles',caseId:'full3',casesSeen:[],scenarioAnswers:{},quizAnswers:{},quizIndex:0,
      draft:fromTemplate(D.templates[0]),previousDraft:null,activeDay:0,filter:'chest',candidate:'chest:flat',
      ruleEdited:false,planReviewed:false,simulated:false,sim:{method:'double',startWeight:20,increment:1,weeks:6,sets:3,repsMin:8,repsMax:12,targetRir:2},decision:null};
  }
  function normalize(raw) {
    const s=defaults();if(!validObject(raw)||raw.version!==1)return s;
    if(TABS.includes(raw.tab))s.tab=raw.tab;
    if(D.templates.some(t=>t.id===raw.caseId))s.caseId=raw.caseId;
    if(Array.isArray(raw.casesSeen))s.casesSeen=[...new Set(raw.casesSeen.filter(id=>D.templates.some(t=>t.id===id)))];
    for(const [field,items] of [['scenarioAnswers',D.scenarios],['quizAnswers',D.questions]])
      for(const q of items)if([0,1,2].includes(raw[field]?.[q.id]))s[field][q.id]=raw[field][q.id];
    if(Number.isInteger(raw.quizIndex))s.quizIndex=Math.max(0,Math.min(D.questions.length-1,raw.quizIndex));
    if(validObject(raw.draft)&&Array.isArray(raw.draft.days))s.draft=canonicalPlan(raw.draft);
    if(validObject(raw.previousDraft)&&Array.isArray(raw.previousDraft.days))s.previousDraft=canonicalPlan(raw.previousDraft);
    if(Number.isInteger(raw.activeDay))s.activeDay=Math.max(0,Math.min(6,raw.activeDay));
    if(ORDER.includes(raw.filter))s.filter=raw.filter;
    if(catalog.has(raw.candidate))s.candidate=raw.candidate;
    for(const k of ['ruleEdited','planReviewed','simulated'])s[k]=raw[k]===true;
    if(validObject(raw.sim)) {
      if(['linear','double','periodized'].includes(raw.sim.method))s.sim.method=raw.sim.method;
      const ranges={startWeight:[0.25,500],increment:[0.25,10],weeks:[3,12],sets:[1,5],repsMin:[1,30],repsMax:[1,30],targetRir:[2,5]};
      for(const [key,[min,max]] of Object.entries(ranges))if(typeof raw.sim[key]==='number'&&Number.isFinite(raw.sim[key]))s.sim[key]=Math.min(max,Math.max(min,raw.sim[key]));
      for(const k of ['weeks','sets','repsMin','repsMax','targetRir'])s.sim[k]=Math.round(s.sim[k]);
      s.sim.repsMax=Math.max(s.sim.repsMin,s.sim.repsMax);
    }
    return s;
  }
  let state=defaults();try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved)state=normalize(saved);}catch(e){storageOK=false;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){storageOK=false;}}
  function announce(message){const toast=document.querySelector('#toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>toast.classList.remove('visible'),3500);}
  function stageStatus() {
    return {
      principles:state.simulated&&D.scenarios.some(q=>state.scenarioAnswers[q.id]===q.correct),
      cases:['PPL3','PPL6','body5'].every(id=>state.casesSeen.includes(id)),
      builder:state.ruleEdited&&state.planReviewed&&E.analysePlan(state.draft).valid,
      challenge:D.questions.every(q=>state.quizAnswers[q.id]===q.correct)
    };
  }
  function countStages(){return Object.values(stageStatus()).filter(Boolean).length;}
  function updateHeading() {
    const b=$('#planner-stage-count');if(b)b.textContent=countStages()===4?'计划设计入门 · 已通关':countStages()+' / 4 项学习任务';
    const f=window.FIT_ACADEMY?.getProgress?.()||{finishedCourses:0};
    const note=$('#planner-foundation');if(note)note.textContent=f.finishedCourses===6?'✓ 六部位基础篇已完成。现在把肌肉、动作与负荷连成可执行的计划。':'基础篇已通关 '+f.finishedCourses+' / 6 章。推荐学完六部位后实践，也可以先预览计划案例。';
    const stages=stageStatus();$$('[data-planner-tab]').forEach(b=>{const i=b.querySelector('i');if(i)i.textContent=stages[b.dataset.plannerTab]?'✓ 已完成':'';});
  }
  function shell() {
    const stages=stageStatus();
    host.innerHTML='<div class="planner-heading"><div class="chapter-number">07<span>CHAPTER</span></div><div><p class="eyebrow">FROM EXERCISES TO A TRAINING PLAN</p><h2 id="planner-title">把知识，编成计划。</h2><p>动作怎么选、下一次怎么进步、一周怎么安排，亲手做一遍。</p></div><div class="planner-status"><b id="planner-stage-count"></b><span>部位基础篇之后 · 计划设计毕业章</span></div></div><p class="planner-foundation" id="planner-foundation"></p><nav class="planner-tabs" aria-label="训练计划学习步骤">'+TABS.map((tab,i)=>'<button data-planner-tab="'+tab+'" class="'+(state.tab===tab?'active':'')+'" '+(state.tab===tab?'aria-current="step"':'')+'><span>0'+(i+1)+'</span>'+TAB_NAMES[i]+'<i>'+(stages[tab]?'✓ 已完成':'')+'</i></button>').join('')+'</nav><div class="planner-content" id="planner-content"></div><div class="planner-footer"><span>教学练习：规则和模板用于理解编排，实际进阶取决于表现与恢复。</span><button data-planner-action="backup">保存 / 备份 ↗</button></div>';
    renderTab();updateHeading();
  }
  function changeTab(tab,scroll=false) {
    if(!TABS.includes(tab))return;state.tab=tab;
    if(tab==='cases'&&!state.casesSeen.includes(state.caseId))state.casesSeen.push(state.caseId);
    save();shell();if(scroll)host.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }
  function intro(title,copy,action=''){return '<div class="planner-intro"><div><h3>'+title+'</h3><p>'+copy+'</p></div>'+action+'</div>';}
  function renderTab() {
    const content=$('#planner-content');
    if(state.tab==='principles')content.innerHTML=renderPrinciples();
    if(state.tab==='cases')content.innerHTML=renderCases();
    if(state.tab==='builder')content.innerHTML=renderBuilder();
    if(state.tab==='challenge')content.innerHTML=renderChallenge();
    if(state.tab==='principles')renderProjection();
  }
  function option(value,label,current){return '<option value="'+esc(value)+'" '+(value===current?'selected':'')+'>'+esc(label)+'</option>';}
  function numeric(id,label,value,min,max,step=1){return '<label>'+label+'<input id="'+id+'" type="number" value="'+value+'" min="'+min+'" max="'+max+'" step="'+step+'"></label>';}
  function renderPrinciples() {
    return intro('先有进阶规则，再有重量数字','渐进超负荷不等于每次都加重。区分逐次线性加重、双重进阶与线性周期，先把推进条件说清楚。')+
      '<div class="planner-reading">'+D.principles.map((p,i)=>'<article class="planner-principle"><span>0'+(i+1)+' / PRINCIPLE</span><h4>'+esc(p.title)+'</h4><p>'+esc(p.body)+'</p><div class="planner-example">'+esc(p.example)+'</div></article>').join('')+'</div>'+
      '<section class="planner-box" aria-labelledby="sim-title"><h4 id="sim-title">亲手推演：下一步怎样增加挑战？</h4><p>选择一个动态负重动作的教学起点。图表仅演示规则的走向，不是对实际增长速度的预测。</p><div class="planner-controls"><label>进阶方式<select id="sim-method">'+option('linear','逐次线性加重',state.sim.method)+option('double','双重进阶',state.sim.method)+option('periodized','线性周期示意',state.sim.method)+'</select></label>'+numeric('sim-start','起始负荷 kg',state.sim.startWeight,.25,500,.25)+numeric('sim-step','最小可用增量 kg',state.sim.increment,.25,10,.25)+numeric('sim-weeks','演示节点数',state.sim.weeks,3,12)+numeric('sim-sets','工作组数',state.sim.sets,1,5)+numeric('sim-min','次数下限',state.sim.repsMin,1,30)+numeric('sim-max','次数上限',state.sim.repsMax,1,30)+numeric('sim-rir','目标 RIR',state.sim.targetRir,2,5)+'</div><button class="primary" data-planner-action="simulate">更新模拟路径 →</button><div id="sim-error" role="status"></div><div id="projection-result"></div></section>'+
      '<section class="planner-box" aria-labelledby="decision-title"><h4 id="decision-title">输入真实表现，做一次进阶决策</h4><p>适用于可记录负荷的动态动作。输入每个工作组实际完成的次数，并同时判断质量、余力和恢复。</p><div class="planner-controls"><label>采用的规则<select id="decision-method"><option value="double">双重进阶</option><option value="linear">固定目标次数的线性加重</option></select></label>'+numeric('decision-weight','当前负荷 kg',20,.25,500,.25)+numeric('decision-step','可用增量 kg',1,.25,10,.25)+'<label>各组次数（逗号分隔）<input id="decision-reps" value="12,12,10" inputmode="text"></label>'+numeric('decision-min','目标次数下限',8,1,30)+numeric('decision-max','目标次数上限',12,1,30)+numeric('decision-rir','各工作组最低 RIR',2,0,5)+'<label>动作质量<select id="decision-quality"><option value="stable">稳定且可控</option><option value="broken">已明显变形</option></select></label><label>关节疼痛<select id="decision-pain"><option value="no">没有</option><option value="yes">有疼痛</option></select></label><label>近期恢复<select id="decision-recovery"><option value="good">总体良好</option><option value="poor">疲劳 / 恢复不足</option></select></label>'+numeric('decision-stalled','连续未进步的训练次数',0,0,8)+'</div><button class="secondary" data-planner-action="recommend">判断下一次安排 ↗</button><div id="decision-result" role="status"></div><p class="planner-note">保持相同记录口径，例如哑铃始终按每只记录。线性加重在本练习以“下限次数”为固定目标；双重进阶要求全部工作组达上限。疼痛优先处理，不用进阶表硬推。</p></section>'+
      '<section class="planner-box"><h4>决策练习：把原则用在情境里</h4><p>至少做对一道，并完成上方模拟，即完成本页学习任务。每次选择后都可以阅读解释、重新尝试。</p><div class="planner-scenario-grid">'+D.scenarios.map(q=>{
        const a=state.scenarioAnswers[q.id],answered=Number.isInteger(a);
        return '<article class="planner-scenario"><h5>'+esc(q.title)+'</h5><p>'+esc(q.description)+'</p>'+q.options.map((o,i)=>'<button data-scenario="'+q.id+'" data-scenario-answer="'+i+'" aria-pressed="'+(a===i)+'" class="'+(a===i?'selected ':'')+(answered&&i===q.correct?'correct':'')+'">'+['A','B','C'][i]+' · '+esc(o)+'</button>').join('')+(answered?'<div class="planner-feedback">'+(a===q.correct?'✓ 判断正确。':'再看一下选择依据。')+esc(q.explanation)+'</div>':'')+'</article>';
      }).join('')+'</div></section><div class="planner-actions"><button class="primary" data-planner-go="cases">看看经典计划怎样运用 →</button></div>';
  }
  function renderProjection() {
    const target=$('#projection-result');if(!target)return;const result=E.projectProgression(state.sim),rows=result.rows;
    if(!rows.length){target.innerHTML='<p class="planner-note">请填写有效的模拟条件。</p>';return;}
    const weights=rows.map(r=>r.weight),lo=Math.min(...weights),hi=Math.max(...weights),span=hi-lo||Math.max(1,hi*.1);
    const points=rows.map((r,i)=>({x:55+i*650/Math.max(1,rows.length-1),y:135-(r.weight-lo)/span*90,r}));
    const axis=state.sim.method==='periodized'?'周次示意':'训练节点';
    target.innerHTML='<div class="planner-chart"><svg viewBox="0 0 760 180" role="img" aria-label="'+axis+'的条件性负荷变化示意"><path d="M55 30V143H714" stroke="#9faa7a66" stroke-width="1" fill="none"/><text x="15" y="23" fill="#bfa976" font-size="10">kg</text><text x="13" y="50" fill="#9eae8a" font-size="10">'+hi+'</text><text x="13" y="136" fill="#9eae8a" font-size="10">'+lo+'</text><polyline points="'+points.map(p=>p.x+','+p.y).join(' ')+'" stroke="#cfb77f" stroke-width="2" fill="none"/>'+points.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="3.2" fill="#d2bd88"/><text x="'+p.x+'" y="165" fill="#9faa8c" text-anchor="middle" font-size="9">'+p.r.week+'</text><text x="'+p.x+'" y="'+(p.y-10)+'" fill="#d2bd88" text-anchor="middle" font-size="9">'+p.r.weight+'</text>').join('')+'</svg></div><div class="planner-table-wrap"><table class="planner-table"><thead><tr><th>'+axis+'</th><th>负荷 kg</th><th>工作组 × 次数</th><th>RIR</th><th>推进条件 / 调整</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+r.week+'</td><td>'+r.weight+'</td><td>'+r.sets+' × '+r.reps+'</td><td>'+r.rir+'</td><td>'+esc(r.note)+'</td></tr>').join('')+'</tbody></table></div><p class="planner-note">'+result.notes.map(esc).join('<br>')+'</p>';
  }
  function renderCases() {
    const t=D.templates.find(t=>t.id===state.caseId),report=E.analysePlan(fromTemplate(t));
    return intro('同一套原理，可以有不同的周安排','三分化是三类课，五分化是五类主题；训练天数、总量与恢复需要分开考虑。比较推拉腿三练、六练和五分化，完成本页学习任务。')+
      '<div class="planner-case-tabs" aria-label="选择经典计划案例">'+D.templates.map(t=>'<button data-case="'+t.id+'" class="'+(t.id===state.caseId?'active':'')+'" aria-pressed="'+(t.id===state.caseId)+'">'+esc(t.name)+'</button>').join('')+'</div><div class="planner-case-title"><div><p class="eyebrow">CLASSIC SPLIT / '+esc(t.split)+'</p><h4>'+esc(t.title||t.name)+'</h4><p>'+esc(t.overview)+'</p><p>'+esc(t.audience)+'</p></div><button class="primary" data-load-template="'+t.id+'">用此案例开始编排 →</button></div><div class="planner-chips"><span class="planner-chip">每周 '+report.trainingDays+' 练 / '+report.restDays+' 休</span><span class="planner-chip">本例共 '+report.totalSets+' 个工作组</span><span class="planner-chip">教学起点，不是固定处方</span></div><div class="planner-week">'+t.days.map(day=>'<article class="planner-day-preview '+(!day.items.length?'rest':'')+'"><small>'+esc(day.name)+'</small><h5>'+esc(day.label)+'</h5>'+(day.items.length?day.items.map(item=>'<p><b>'+esc(catalog.get(item.key).name)+'</b>'+item.sets+' 组 × '+item.repsMin+'–'+item.repsMax+' 次<br>RIR '+item.rir+' · 休息 '+item.rest+' 秒</p>').join(''):'<p>留出恢复空间<br>舒适日常活动</p>')+'</article>').join('')+'</div><div class="planner-split-warning"><b>如何进阶：</b>'+esc(t.progression)+'<br><b>如何调整：</b>'+esc(t.warning)+'</div>'+weeklyTable(report)+'<details class="knowledge-details"><summary>计组、恢复与案例使用说明</summary><ul>'+D.notes.map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul></details><div class="planner-actions"><button class="secondary" data-planner-go="builder">进入我的计划草稿 ↗</button><small>学习过 '+state.casesSeen.length+' / 5 个案例 · 必看：推拉腿三练、六练、五分化</small></div>';
  }
  function weeklyTable(report) {
    return '<div class="planner-table-wrap"><table class="planner-table"><thead><tr><th>部位</th><th>直接工作组</th><th>间接参与组</th><th>直接训练天数</th></tr></thead><tbody>'+report.weekly.map(w=>'<tr><td>'+esc(w.name)+'</td><td>'+w.directSets+'</td><td>'+w.indirectSets+'</td><td>'+w.frequency+'</td></tr>').join('')+'</tbody></table></div><p class="planner-note">间接参与组按部分常见推拉协同关系简化统计，不与直接组 1:1 相加；0 不代表完全不参与。这里按部位归类，腿部总数不等于股四头、腘绳肌各自都做了这些组；核心稳定练习也不靠公斤数评价。</p>';
  }
  function itemField(item,field,label,type,min,max,step=1) {
    const uid=esc(item.uid);return '<label>'+label+'<input type="'+type+'" data-item="'+uid+'" data-item-field="'+field+'" value="'+item[field]+'" '+((field==='repsMax'&&item.progression==='linear')?'readonly':(['startWeight','increment'].includes(field)&&item.loadBasis==='bodyweight'?'disabled':''))+' min="'+min+'" max="'+max+'" step="'+step+'"></label>';
  }
  function renderBuilder() {
    const p=state.draft,day=p.days[state.activeDay],report=E.analysePlan(p);
    const options=E.catalog.filter(e=>e.course===state.filter);
    if(!options.some(e=>e.key===state.candidate))state.candidate=options[0].key;
    return intro('轮到你：安排日期、动作和推进条件','可以从经典案例开始，也可以从空白周计划搭建。至少亲手调整一个动作的进阶规则，再检验整周分配。','<button class="secondary" data-planner-go="cases">返回案例 ↗</button>')+
      '<div class="planner-actions"><button class="secondary" data-planner-action="blank">新建空白草稿</button>'+(state.previousDraft?'<button class="secondary" data-planner-action="undo">撤销最近一次修改</button>':'')+'<button class="secondary" data-planner-action="export-json">导出计划 JSON</button><label class="secondary" style="cursor:pointer">导入计划<input id="planner-import-plan" type="file" accept="application/json" class="sr-only"></label><button class="secondary" data-planner-action="export-text">下载计划 TXT</button></div>'+
      '<div class="planner-editor-layout"><div class="planner-editor-main"><div class="planner-controls" style="grid-template-columns:1fr"><label>我的计划名称<input id="planner-plan-name" maxlength="60" value="'+esc(p.name)+'"></label></div><div class="planner-day-tabs" aria-label="选择编排日期">'+p.days.map((d,i)=>'<button data-plan-day="'+i+'" class="'+(i===state.activeDay?'active':'')+'" aria-pressed="'+(i===state.activeDay)+'"><b>'+d.name+'</b><span>'+(!d.items.length?'休息':d.items.reduce((n,x)=>n+x.sets,0)+' 组')+'</span></button>').join('')+'</div><div class="planner-day-tools"><label for="planner-day-label">'+day.name+'主题</label><input id="planner-day-label" class="planner-input" maxlength="60" value="'+esc(day.label)+'"><small class="program-notes">先安排主要任务，再加入辅助动作。</small></div>'+
      (day.items.length?day.items.map((item,i)=>{
        const e=catalog.get(item.key),r=item.progression;
        return '<article class="planner-item"><div class="planner-item-heading"><span>'+String(i+1).padStart(2,'0')+'</span><b>'+esc(e.name)+'</b><small>'+esc(NAMES[e.course])+' · '+esc(e.equipment)+'</small><div class="planner-item-buttons"><button data-item-up="'+esc(item.uid)+'" aria-label="上移'+esc(e.name)+'" '+(i===0?'disabled':'')+'>↑</button><button data-item-down="'+esc(item.uid)+'" aria-label="下移'+esc(e.name)+'" '+(i===day.items.length-1?'disabled':'')+'>↓</button><button data-item-remove="'+esc(item.uid)+'" aria-label="移除'+esc(e.name)+'">×</button></div></div><div class="planner-item-fields">'+itemField(item,'sets','工作组','number',1,5)+itemField(item,'repsMin','次数下限','number',1,30)+itemField(item,'repsMax','次数上限','number',1,30)+itemField(item,'rir','目标 RIR','number',0,5)+itemField(item,'rest','休息（秒）','number',30,300,15)+'</div><details class="planner-item-rule" open><summary>进阶规则 · '+esc(RULES[r])+'</summary><div class="planner-item-fields"><label>这个动作怎样推进<select data-item="'+esc(item.uid)+'" data-item-field="progression">'+Object.entries(RULES).map(([k,v])=>option(k,v,r)).join('')+'</select></label>'+itemField(item,'startWeight','起始负荷 / 未定填 0','number',0,500,.25)+itemField(item,'increment','可用增量 kg','number',.25,10,.25)+'<label>记录口径<select data-item="'+esc(item.uid)+'" data-item-field="loadBasis">'+Object.entries(BASIS).map(([k,v])=>option(k,v,item.loadBasis)).join('')+'</select></label></div><p class="planner-item-note">'+esc(r==='skill'?'以呼吸、幅度和控制稳定为先，再小步增加杠杆难度或阻力；不把难度级别当成公斤。':r==='linear'?'固定目标为下限次数。全部工作组完成，动作稳定且保有目标余力后，下一次才尝试最小可用增量。':'在设定区间内先增加次数。所有工作组到上限、动作与余力达标后，再小幅加重回到下沿附近。')+'</p><button class="secondary" data-item-simulate="'+esc(item.uid)+'" style="font-size:10px;padding:6px 10px;margin-top:7px">用这个动作的条件演示进阶 ↗</button></details><label class="planner-item-note">移至 <select data-item-move="'+esc(item.uid)+'" aria-label="移动'+esc(e.name)+'的训练日">'+p.days.map((d,n)=>option(n,d.name,n===state.activeDay?n:-1)).join('')+'</select></label></article>';
      }).join(''):'<p class="planner-empty">这一天目前是休息日。若要训练，先选择下面的部位和动作加入；留白也可以作为恢复安排。</p>')+
      '<div class="planner-add"><select id="planner-filter" aria-label="按部位选择待加入动作">'+ORDER.map(id=>option(id,NAMES[id],state.filter)).join('')+'</select><select id="planner-candidate" aria-label="选择要加入的训练动作">'+options.map(e=>option(e.key,e.name+' · '+e.equipment,state.candidate)).join('')+'</select><button class="secondary" data-planner-action="add">加入'+day.name+' ＋</button></div><p class="planner-note">计划中的单侧次数按每侧记录，左右完成后计一组。起始负荷 0 表示先找到可控重量；它不代表所有动作都不需负重。自重与控制进阶优先记录动作版本。</p><div class="planner-actions"><button class="primary" data-planner-action="analyse">检验整周分配 →</button><small>'+(state.ruleEdited?'✓ 已亲手设置进阶规则':'还需要亲手修改至少一个动作的进阶规则或增量')+'</small></div><div id="planner-analysis" role="status">'+(state.planReviewed?diagnostics(report):'')+'</div></div>'+
      '<aside class="planner-sidebar"><h4>你的整周分配</h4><p>随修改即时更新，校验用于本章的基础练习目标。</p><div class="planner-stats"><div class="planner-stat"><b>'+report.trainingDays+'</b><small>训练日</small></div><div class="planner-stat"><b>'+report.restDays+'</b><small>休息日</small></div><div class="planner-stat"><b>'+report.totalSets+'</b><small>工作组</small></div></div>'+report.weekly.map(w=>'<div class="planner-mini-row"><span>'+esc(w.name)+'</span><div class="planner-mini-bar"><i style="width:'+Math.min(100,w.directSets/Math.max(1,...report.weekly.map(x=>x.directSets))*100)+'%"></i></div><small>直接 '+w.directSets+' · 间接 '+w.indirectSets+'</small></div>').join('')+'<p class="planner-note">直接、间接分别观察；仅列部分常见协同，0 不等于完全不参与，不按固定比例折算。</p><div class="planner-patterns">'+report.patterns.map(p=>'<span class="'+(p.covered?'covered':'')+'">'+(p.covered?'✓':'○')+' '+esc(p.name)+'</span>').join('')+'</div><div class="planner-table-wrap"><table class="planner-table"><thead><tr><th>日期</th><th>组数</th><th>粗估时长</th></tr></thead><tbody>'+report.days.map((d,i)=>'<tr><td>'+p.days[i].name+'</td><td>'+d.totalSets+'</td><td>'+ (d.totalSets?d.minutes+' 分':'恢复')+'</td></tr>').join('')+'</tbody></table></div><p class="program-notes">时长为课堂估算，不含所有排队与个人热身差异。</p></aside></div>';
  }
  function diagnostics(report) {
    return '<div class="planner-box"><h4>'+(report.valid?'基础模式已覆盖，继续检查恢复':'还有几处需要调整')+'</h4><div class="planner-diagnostic">'+report.errors.map(t=>'<p class="error">○ '+esc(t)+'</p>').join('')+report.warnings.map(t=>'<p class="warning">△ '+esc(t)+'</p>').join('')+report.strengths.map(t=>'<p>✓ '+esc(t)+'</p>').join('')+'</div><p class="planner-note">这是教学结构检查，不是对计划个体适用性、安全性或效果的保证。提醒需要结合实际表现处理，不能只为了“通过”忽略疲劳。</p></div>';
  }
  function renderChallenge() {
    const q=D.questions[state.quizIndex],a=state.quizAnswers[q.id],answered=Number.isInteger(a),correctCount=D.questions.filter(q=>state.quizAnswers[q.id]===q.correct).length;
    return intro('用十二个决策，检验你的计划思路','可以来回切题、重做错题。结课需要完成进阶模拟、案例比较、亲手编排与全部知识挑战。')+
      '<div class="planner-quiz"><div class="planner-quiz-status"><span>第 '+(state.quizIndex+1)+' / '+D.questions.length+' 题</span><span>已掌握 '+correctCount+' / '+D.questions.length+' 个计划知识点</span></div><h4 class="quiz-prompt">'+esc(q.prompt)+'</h4><div class="quiz-options">'+q.options.map((o,i)=>'<button class="quiz-option '+(answered&&i===q.correct?'correct ':'')+(answered&&i===a&&a!==q.correct?'wrong':'')+'" data-planner-answer="'+i+'" aria-pressed="'+(a===i)+'"><span>'+['A','B','C'][i]+'</span>'+esc(o)+'</button>').join('')+'</div>'+(answered?'<div class="quiz-feedback" role="status"><h4>'+(a===q.correct?'✓ 判断正确':'再理解一下，正确答案是 '+['A','B','C'][q.correct])+'</h4><p>'+esc(q.explanation)+'</p></div>':'')+'<div class="planner-actions">'+(state.quizIndex?'<button class="secondary" data-quiz-index="'+(state.quizIndex-1)+'">← 上一题</button>':'')+(state.quizIndex<D.questions.length-1?'<button class="primary" data-quiz-index="'+(state.quizIndex+1)+'">下一题 →</button>':'<button class="primary" data-planner-action="finish">查看结课状态 →</button>')+'</div><nav class="planner-quiz-nav" aria-label="切换计划知识题目">'+D.questions.map((q,i)=>'<button data-quiz-index="'+i+'" class="'+(state.quizAnswers[q.id]===q.correct?'correct ':'')+(i===state.quizIndex?'active':'')+'" aria-label="第'+(i+1)+'题">'+(i+1)+'</button>').join('')+'</nav>'+graduation()+'</div>';
  }
  function graduation() {
    const s=stageStatus(),labels=['模拟路径 + 一道情境判断','比较三练、六练、五分化','设置进阶规则并检验计划','掌握十二个计划知识点'];
    return '<div class="planner-completion-checks">'+TABS.map((k,i)=>'<div class="'+(s[k]?'done':'')+'">'+(s[k]?'✓':'○')+' '+labels[i]+'</div>').join('')+'</div><div class="planner-graduation"><div><h4>'+(countStages()===4?'计划设计入门徽章 · 已获得':'已完成 '+countStages()+' / 4 项学习任务')+'</h4><p>'+(countStages()===4?'你已练习从动作选择、周分配到进阶条件的完整流程。保留记录，让实际表现指导下一次调整。':'按上方清单继续练习。模板可以作为起点，自己的进阶条件才让计划真正可执行。')+'</p></div><span class="badge">'+(countStages()===4?'✧':'◇')+'</span></div>';
  }
  function draftChange(change,rule=false) {
    state.previousDraft=clone(state.draft);change(state.draft);state.draft=canonicalPlan(state.draft);state.planReviewed=false;
    if(rule)state.ruleEdited=true;save();shell();
  }
  function findItem(uid) {for(const [dayIndex,day] of state.draft.days.entries()){const index=day.items.findIndex(x=>x.uid===uid);if(index>=0)return{dayIndex,index,item:day.items[index]};}return null;}
  function loadTemplate(id) {
    const t=D.templates.find(t=>t.id===id);if(!t)return;
    state.previousDraft=clone(state.draft);state.draft=fromTemplate(t);state.ruleEdited=false;state.planReviewed=false;state.activeDay=0;
    if(!state.casesSeen.includes(id))state.casesSeen.push(id);changeTab('builder',true);announce('案例已载入草稿。请给至少一个动作亲手设置进阶条件。');
  }
  function runSimulation() {
    const ids={method:'sim-method',startWeight:'sim-start',increment:'sim-step',weeks:'sim-weeks',sets:'sim-sets',repsMin:'sim-min',repsMax:'sim-max',targetRir:'sim-rir'},input={};
    for(const [k,id] of Object.entries(ids))input[k]=k==='method'?$('#'+id).value:Number($('#'+id).value);
    const valid=Number.isFinite(input.startWeight)&&input.startWeight>=.25&&input.startWeight<=500&&input.increment>=.25&&input.increment<=10&&Number.isInteger(input.weeks)&&input.weeks>=3&&input.weeks<=12&&Number.isInteger(input.sets)&&input.sets>=1&&input.sets<=5&&Number.isInteger(input.repsMin)&&input.repsMin>=1&&Number.isInteger(input.repsMax)&&input.repsMax>=input.repsMin&&input.repsMax<=30&&Number.isInteger(input.targetRir)&&input.targetRir>=2&&input.targetRir<=5;
    if(!valid){$('#sim-error').innerHTML='<p class="planner-feedback">请填写有效数值：次数上限不低于下限，增量 0.25–10 kg，3–12 个演示节点。</p>';return;}
    state.sim=input;state.simulated=true;save();$('#sim-error').innerHTML='<p class="planner-feedback">✓ 已按你的条件更新。未达到动作质量与余力条件时，应停留在原节点。</p>';renderProjection();updateHeading();
  }
  function runDecision() {
    if($('#decision-pain').value==='yes'){const result=E.recommendNext({pain:true});$('#decision-result').innerHTML='<div class="planner-feedback"><strong>'+esc(result.title)+'</strong><br>'+esc(result.explanation)+'</div>';return;}
    const reps=$('#decision-reps').value.trim().split(/[,，\s]+/).map(Number),weight=Number($('#decision-weight').value),increment=Number($('#decision-step').value),min=Number($('#decision-min').value),max=Number($('#decision-max').value),rir=Number($('#decision-rir').value),stalled=Number($('#decision-stalled').value);
    if(!reps.length||reps.length>5||reps.some(x=>!Number.isInteger(x)||x<1||x>30)||!Number.isFinite(weight)||weight<=0||weight>500||increment<.25||increment>10||!Number.isInteger(min)||min<1||!Number.isInteger(max)||max<min||max>30||!Number.isInteger(rir)||rir<0||rir>5||!Number.isInteger(stalled)||stalled<0||stalled>8){$('#decision-result').innerHTML='<p class="planner-feedback">请填写 1–5 个工作组的实际次数（每组 1–30 次），并检查重量、增量、目标区间与余力。</p>';return;}
    const result=E.recommendNext({method:$('#decision-method').value,weight,increment,reps,repsMin:min,repsMax:max,rir,targetRir:2,technique:$('#decision-quality').value,pain:$('#decision-pain').value==='yes',recovery:$('#decision-recovery').value,stalledSessions:stalled});
    $('#decision-result').innerHTML='<div class="planner-feedback"><strong>'+esc(result.title)+'</strong><br>'+esc(result.explanation)+(result.action==='increase'?'<br>可尝试的下一档：'+result.nextWeight+' kg（按同一口径记录）。':'')+'</div>';
  }
  function download(name,content,type) {const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  function exportText() {
    const p=state.draft,report=E.analysePlan(p);
    const text='HERACLES LAB · '+p.name+'\n教学计划草稿 · '+(report.valid?'基础结构已覆盖':'仍有结构待调整')+'\n\n'+p.days.map(d=>d.name+' · '+d.label+'\n'+(d.items.length?d.items.map((x,i)=>{const e=catalog.get(x.key);return (i+1)+'. '+e.name+'：'+x.sets+'组 × '+x.repsMin+'–'+x.repsMax+'次；RIR '+x.rir+'；休息 '+x.rest+'秒\n   规则：'+RULES[x.progression]+(x.loadBasis==='bodyweight'?'；记录动作版本与质量，控制稳定后再小步提高难度':'；'+BASIS[x.loadBasis]+'；起始 '+(x.startWeight||'待确定')+'；可用增量 '+x.increment+' kg');}).join('\n'):'休息 / 恢复')).join('\n\n')+'\n\n直接与间接参与\n'+report.weekly.map(w=>w.name+'：直接 '+w.directSets+' 组，间接参与 '+w.indirectSets+' 组，直接训练 '+w.frequency+' 天').join('\n')+'\n\n检查与提醒\n'+[...report.errors,...report.warnings].join('\n')+'\n\n进阶条件：动作可控、完成计划次数、保留目标余力后才尝试推进。自重 / 控制动作先稳定质量，再增加杠杆或阻力。间接组不与直接组 1:1 相加；计划并非个体处方。\n';
    download('heracles-my-training-plan.txt',text,'text/plain;charset=utf-8');
  }
  host.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.plannerTab)return changeTab(b.dataset.plannerTab);
    if(b.dataset.plannerGo)return changeTab(b.dataset.plannerGo,true);
    if(b.dataset.case){state.caseId=b.dataset.case;if(!state.casesSeen.includes(state.caseId))state.casesSeen.push(state.caseId);save();shell();return;}
    if(b.dataset.loadTemplate)return loadTemplate(b.dataset.loadTemplate);
    if(b.dataset.planDay!==undefined){state.activeDay=Number(b.dataset.planDay);save();shell();return;}
    if(b.dataset.scenario){const q=D.scenarios.find(q=>q.id===b.dataset.scenario);state.scenarioAnswers[q.id]=Number(b.dataset.scenarioAnswer);save();const scroll=scrollY;shell();window.scrollTo({top:scroll,behavior:'instant'});return;}
    if(b.dataset.plannerAnswer!==undefined){const q=D.questions[state.quizIndex];state.quizAnswers[q.id]=Number(b.dataset.plannerAnswer);save();shell();return;}
    if(b.dataset.quizIndex!==undefined){state.quizIndex=Number(b.dataset.quizIndex);save();shell();return;}
    if(b.dataset.itemSimulate){const f=findItem(b.dataset.itemSimulate);if(!f)return;const item=f.item;if(item.progression==='skill'||item.loadBasis==='bodyweight'){announce('这个动作先记录版本、呼吸与控制，不把难度换算为公斤进阶。');return;}if(item.startWeight<=0){announce('请先填写这个动作的起始负荷，再演示条件路径。');return;}state.sim={method:item.progression,startWeight:item.startWeight,increment:item.increment,weeks:6,sets:item.sets,repsMin:item.repsMin,repsMax:item.repsMax,targetRir:Math.max(2,item.rir)};changeTab('principles',true);runSimulation();$('#sim-title').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});return;}
    if(b.dataset.itemRemove){const f=findItem(b.dataset.itemRemove);if(f)draftChange(p=>p.days[f.dayIndex].items.splice(f.index,1));return;}
    if(b.dataset.itemUp||b.dataset.itemDown){const f=findItem(b.dataset.itemUp||b.dataset.itemDown);if(f)draftChange(p=>{const items=p.days[f.dayIndex].items,j=f.index+(b.dataset.itemUp?-1:1);if(j>=0&&j<items.length)[items[f.index],items[j]]=[items[j],items[f.index]];});return;}
    switch(b.dataset.plannerAction) {
      case 'simulate':return runSimulation();case 'recommend':return runDecision();
      case 'blank':state.previousDraft=clone(state.draft);state.draft=canonicalPlan({name:'我的第一份周计划',days:Array.from({length:7},()=>({items:[]}))});state.ruleEdited=false;state.planReviewed=false;save();shell();return;
      case 'undo':if(state.previousDraft){const old=state.previousDraft;state.previousDraft=clone(state.draft);state.draft=canonicalPlan(old);state.planReviewed=false;save();shell();}return;
      case 'add':{
        const day=state.draft.days[state.activeDay];if(day.items.length>=10){announce('本练习每一天最多安排 10 个动作，先调整现有选择。');return;}
        const e=catalog.get(state.candidate);draftChange(p=>{p.days[state.activeDay].items.push({uid:'item-'+Date.now(),key:e.key,sets:2,repsMin:8,repsMax:12,rir:3,rest:e.type==='compound'?150:90,progression:e.course==='core'||e.equipment==='自重'?'skill':'double',startWeight:0,increment:.5,loadBasis:e.equipment==='自重'?'bodyweight':e.equipment==='哑铃'&&!['legs:squat','arms:overhead'].includes(e.key)?'per-hand':'total'});if(day.items.length===1)p.days[state.activeDay].label=NAMES[e.course]+'训练';});return;
      }
      case 'analyse':state.planReviewed=true;save();shell();$('#planner-analysis').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});return;
      case 'export-json':return download('heracles-my-training-plan.json',JSON.stringify({kind:'heracles-training-plan',version:1,plan:state.draft},null,2),'application/json');
      case 'export-text':return exportText();
      case 'backup':return download('heracles-planning-learning.json',JSON.stringify({kind:'heracles-planning-learning',version:1,state},null,2),'application/json');
      case 'finish':save();shell();$('.planner-graduation').scrollIntoView({behavior:'smooth',block:'center'});return;
    }
  });
  host.addEventListener('change',async event=>{
    const el=event.target;
    if(el.id==='planner-plan-name'){const name=el.value.trim().slice(0,60)||'我的训练计划';draftChange(p=>p.name=name);return;}
    if(el.id==='planner-day-label'){const label=el.value.trim().slice(0,60)||'训练日';draftChange(p=>p.days[state.activeDay].label=label);return;}
    if(el.id==='planner-filter'){state.filter=el.value;state.candidate=E.catalog.find(e=>e.course===el.value).key;save();shell();return;}
    if(el.id==='planner-candidate'){state.candidate=el.value;save();return;}
    if(el.dataset.item&&el.dataset.itemField){const f=findItem(el.dataset.item);if(!f)return;const field=el.dataset.itemField;draftChange(p=>{p.days[f.dayIndex].items[f.index][field]=['progression','loadBasis'].includes(field)?el.value:Number(el.value);const item=p.days[f.dayIndex].items[f.index];if(item.progression==='linear')item.repsMax=item.repsMin;},['progression','increment','loadBasis','startWeight'].includes(field));return;}
    if(el.dataset.itemMove){const f=findItem(el.dataset.itemMove),dest=Number(el.value);if(f&&dest!==f.dayIndex){if(state.draft.days[dest].items.length>=10){announce('目标日期已有 10 个动作，先调整安排。');shell();return;}draftChange(p=>{const item=p.days[f.dayIndex].items.splice(f.index,1)[0];p.days[dest].items.push(item);});}return;}
    if(el.id==='planner-import-plan'){
      const f=el.files[0];if(!f)return;
      try{if(f.size>150000)throw Error();const data=JSON.parse(await f.text());
        if(data.kind==='heracles-planning-learning'&&data.version===1&&data.state?.version===1){state=normalize(data.state);save();shell();announce('已恢复计划章节学习备份。');return;}
        if(data.kind!=='heracles-training-plan'||data.version!==1||!validObject(data.plan)||!Array.isArray(data.plan.days)||data.plan.days.length!==7)throw Error();
        const next=canonicalPlan(data.plan),count=next.days.reduce((n,d)=>n+d.items.length,0);if(!count)throw Error();
        state.previousDraft=clone(state.draft);state.draft=next;state.planReviewed=false;state.ruleEdited=false;save();shell();announce('计划已导入，请检查动作、数值与进阶条件。');
      }catch(e){announce('无法导入，请选择本课程导出的有效计划或计划学习备份。');}
    }
  });
  window.addEventListener('fitcraft:progress',updateHeading);
  window.FIT_PLANNER={
    open:tab=>changeTab(TABS.includes(tab)?tab:'principles',true),
    snapshot:()=>clone(state),
    normalizeSnapshot:normalize,
    restore:raw=>{if(!validObject(raw)||raw.version!==1)return false;state=normalize(raw);save();shell();return true;}
  };
  shell();if(!storageOK)announce('计划练习仍可使用；当前浏览器无法保存进度，请及时导出备份。');
})();
