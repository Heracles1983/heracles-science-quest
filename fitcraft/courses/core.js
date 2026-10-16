window.FIT_COURSES = window.FIT_COURSES || {};
window.FIT_COURSES.core = {
  id: 'core', name: '核心', title: '核心肌群', english: 'CORE & TRUNK',
  view: '前面观 / 深层示意', anatomy: './assets/core-anatomy.svg',
  intro: '从腹部的层次，到屈曲、抗伸展与抗旋转：学会在四肢运动时控制腰盆，让核心训练有清晰的目标。',
  concepts: [
    { title: '核心是一套协作系统', copy: '腹直肌、腹斜肌、腹横肌和背侧肌群共同参与躯干运动与稳定，膈肌与盆底也参与压力调节。本图重点认识腹壁三层，并不代表核心只有腹肌。' },
    { title: '既能运动，也能抵抗运动', copy: '卷腹练习可控的躯干屈曲，死虫练习抗伸展，Pallof 推练习抗旋转。没有一个动作能包办所有功能，也不能靠练腹定点减少腹部脂肪。' }
  ],
  anatomyNote: '前面观为教学示意，非医学比例图。腹横肌位于腹壁深层，只在标明移除浅层的窗口展示；背侧肌群、膈肌与盆底未完整绘出。',
  regions: [
    { id: 'rectus', name: '腹直肌', description: '位于腹壁前方，左右分布在腹白线两侧。参与躯干屈曲，也与其他肌群共同抵抗腰椎过度伸展。“上腹”和“下腹”不是两块独立肌肉。', color: '#C3915D', exerciseIds: ['crunch', 'deadbug'] },
    { id: 'obliques', name: '腹外斜肌 / 腹内斜肌', description: '腹外斜肌位于较浅层，腹内斜肌在其深面，肌纤维走向不同。它们参与躯干旋转、侧屈，也在 Pallof 推中共同抵抗旋转；不能只凭动作名称认定某一层被完全隔离。', color: '#A96258', exerciseIds: ['pallof', 'birddog'] },
    { id: 'transverse', name: '腹横肌 · 深层', description: '腹横肌位于腹壁深层，肌纤维大体横向走行。它与其他核心肌群协作调节腹内压和躯干稳定，不能把它理解成需要一直用力收紧的“天然束腰”。', color: '#88A493', exerciseIds: ['deadbug', 'pallof', 'birddog'] }
  ],
  quality: [
    '动作中能持续自然呼吸，适度绷紧腹部，不以持续憋气换取稳定。',
    '腰盆位置可控；死虫和鸟狗以四肢移动时躯干不明显塌腰、扭转为准，必要时缩短伸展距离。',
    '在可控幅度内缓慢完成；颈部不过度前探，出现尖锐或持续不适时结束动作并调整。'
  ],
  program: {
    minExercises: 2, maxExercises: 3, minSets: 4, maxSets: 6,
    requiredPatterns: [{ id: 'anti-extension', name: '抗伸展练习' }, { id: 'anti-rotation', name: '抗旋转练习' }],
    compoundRest: [60, 120], isolationRest: [60, 120],
    note: '单课教学例子，动态动作以还可完成的高质量次数估计 RIR，稳定练习技术失控前停；这不是适用于所有人的每周处方。'
  },
  lessons: [
    { id: 'anatomy', title: '核心不只是六块腹肌', subtitle: '看懂腹壁层次，区分动作与稳定', minutes: 3,
      points: [
        '腹直肌位于腹壁前方，参与躯干屈曲；左右肌腹由腹白线分隔，腱划形成常见的分块外观。',
        '腹外斜肌在浅层，腹内斜肌在其深面，两层纤维走向不同；它们参与旋转、侧屈和抵抗不必要的运动。',
        '腹横肌在更深层，肌纤维大体横向分布。图中的放大窗口移除了浅层组织，不能把它当成表面可见的肌肉。',
        '核心还包括背侧肌群等结构，并与膈肌、盆底协作。可控呼吸和躯干稳定需要多块肌肉配合。',
        '练腹不会决定脂肪从哪个部位减少。腹肌可见度还受整体体脂、肌肉大小和个体结构影响。'
      ], summary: '先分清腹壁层次，再理解功能。核心训练既能练习产生运动，也能练习抵抗运动。' },
    { id: 'movement', title: '四个动作，三种任务', subtitle: '屈曲、抗伸展、抗旋转各有目标', minutes: 3,
      points: [
        '卷腹让胸廓缓慢靠近骨盆，肩胛轻离垫面，再受控返回；它练习的是小幅躯干屈曲，不是用手把头拉起来。可控的屈曲不应被一概认定为有害。',
        '死虫在仰卧时交替伸出对侧手脚，目标是四肢移动而腰盆仍可控。伸展距离越大通常越难，可先只移动脚跟或一侧肢体。',
        'Pallof 推让绳索或弹力带从身体侧面拉扯。双手向胸前推出时抵抗身体转向锚点，两侧都要练。',
        '鸟狗从四点支撑出发，对侧手脚伸长；保持骨盆大致朝向地面，避免为了抬高四肢而塌腰或转髋。',
        '每个动作都由多块肌肉协作。腹部酸胀并不是唯一标准，先观察轨迹、呼吸和腰盆是否可控。'
      ], summary: '卷腹练屈曲，死虫侧重抗伸展，Pallof 推侧重抗旋转，鸟狗练习四肢运动中的腰盆控制。' },
    { id: 'control', title: '稳定比硬撑更有用', subtitle: '呼吸、幅度与停止时机', minutes: 3,
      points: [
        '开始前找到舒适的躯干位置，腹部适度绷紧，同时能自然呼吸；不用把腹部一直吸到最紧或持续憋气。',
        '腰盆失控、明显塌腰或扭转、动作越来越快，提示应停止这一组或降低难度。稳定练习不以坚持到身体变形为目标。',
        '对卷腹、反复伸展的死虫等动态练习，RIR 2–3 指预计还能完成 2–3 次同样质量的重复；它不是用剩余秒数换算次数。',
        '做等长停留时，重点记录能保持姿势与呼吸的时间，在技术失控前停；不要机械套用动态动作的 RIR 数字。',
        '可先缩短手脚伸展距离、减轻侧向阻力或减少次数。控制稳定后，再增加次数、伸展距离或负荷，每次只调整一个主要变量。'
      ], summary: '努力程度必须服从动作质量。稳定练习以可控姿势和呼吸决定是否继续，动态次数才适合用高质量重复估计 RIR。' },
    { id: 'program', title: '编排一堂核心课', subtitle: '用不同任务组成一个小计划', minutes: 3,
      points: [
        '本关教学目标：选择 2–3 个动作，共 4–6 个工作组，覆盖抗伸展与抗旋转；热身和熟悉动作的练习不计入工作组。',
        '简洁例子：死虫 2 组、Pallof 推 2 组，共 4 组；需要增加屈曲练习时可加入卷腹 2 组，共 6 组。',
        '单侧动作的“1 组”按左右各完成一次计划次数计，避免在本关把左右两侧重复计为 2 组。实际训练记录也应注明计数方法。',
        '动作间或组间可休息约 60–120 秒，直到呼吸与控制能力恢复；如果仍不能保持姿势，就延长休息或降低难度。',
        '动态练习可参考 RIR 2–3，但稳定动作必须在姿势或呼吸失控前停。本关组数是单课教学范围，实际每周安排需结合其他训练和恢复。'
      ], summary: '先保证任务覆盖和动作控制，再调整组数和难度。无需在一堂课中练完所有核心动作。' }
  ],
  questions: [
    { id: 'core-01', lesson: 'anatomy', prompt: '腹横肌在这张解剖图中应如何展示？', options: ['作为皮肤下最表面的横向肌肉', '在标明移除浅层组织的深层窗口中展示', '与腹直肌合并成同一块肌肉'], correct: 1, explanation: '腹横肌位于腹壁深层，浅层有腹外斜肌与腹内斜肌等组织覆盖，因此要使用明确标注的深层窗口。' },
    { id: 'core-02', lesson: 'anatomy', prompt: '关于核心训练，哪种理解更准确？', options: ['核心只包括腹直肌', '每天卷腹能指定腹部先减脂', '多块肌肉协作完成躯干运动与稳定'], correct: 2, explanation: '腹直肌、腹斜肌、腹横肌和背侧肌群等协作完成核心功能；局部训练不能指定脂肪从腹部减少。' },
    { id: 'core-03', lesson: 'movement', prompt: '卷腹时，哪个动作线索更合适？', options: ['胸廓缓慢靠近骨盆，肩胛轻离垫面', '用手拉头，尽量让下巴碰到胸口', '用甩动尽快坐起'], correct: 0, explanation: '卷腹是可控的小幅躯干屈曲。手部轻放、颈部舒适，避免拉头或用惯性坐起；躯干屈曲本身并非一概有害。' },
    { id: 'core-04', lesson: 'movement', prompt: '死虫伸腿时腰部明显拱起，下一步应怎么做？', options: ['把腿继续伸得更低，追求最大幅度', '缩短伸展距离，恢复腰盆控制', '屏住呼吸直到这一组结束'], correct: 1, explanation: '死虫的目标是四肢移动时维持腰盆控制。减小幅度或只移动一个肢体，通常比硬撑更适合当前能力。' },
    { id: 'core-05', lesson: 'movement', prompt: 'Pallof 推主要要求你抵抗哪一种趋势？', options: ['身体被侧向拉力带着旋转', '双脚离开地面的趋势', '肘关节完全不动的趋势'], correct: 0, explanation: '弹力带或绳索从侧面牵拉，手臂向前伸时需要抵抗躯干旋转。保持骨盆和胸廓大致朝向前方，两侧都练。' },
    { id: 'core-06', lesson: 'movement', prompt: '鸟狗动作中，哪种表现更符合训练目标？', options: ['抬腿越高越好，腰部可以明显下塌', '伸手伸腿时骨盆明显朝侧面打开', '对侧手脚伸长，同时骨盆大致朝向地面'], correct: 2, explanation: '鸟狗练习的是四肢移动时的躯干控制。向远处伸长比追求抬高更有帮助，必要时只移动一侧手或脚。' },
    { id: 'core-07', lesson: 'control', prompt: '关于核心练习中的 RIR，哪项正确？', options: ['等长动作剩余 3 秒就一定等于 RIR 3', '动态练习按高质量剩余次数估计，等长稳定练习在技术失控前停', '所有核心练习都必须做到无法呼吸才结束'], correct: 1, explanation: 'RIR 描述预计还能完成的同样质量的重复次数，不能把等长秒数直接换算成次数。稳定练习更需要观察姿势和呼吸。' },
    { id: 'core-08', lesson: 'control', prompt: 'Pallof 推最后几次需要憋气并转动身体才能完成，应如何处理？', options: ['结束这一组，下组减轻阻力或减少次数', '只要次数没做完就继续转着推', '增加阻力迫使核心更用力'], correct: 0, explanation: '憋气和躯干被带转说明当前动作质量下降。先结束这一组，再调整阻力或次数，恢复可控呼吸与姿势。' },
    { id: 'core-09', lesson: 'program', prompt: '哪个方案符合本关 2–3 动作、4–6 组，并覆盖抗伸展和抗旋转？', options: ['卷腹 4 组', '卷腹 3 组、鸟狗 4 组', '死虫 2 组、Pallof 推 2 组'], correct: 2, explanation: '死虫与 Pallof 推分别覆盖抗伸展和抗旋转，2 个动作共 4 组，符合本关的单课教学目标。' },
    { id: 'core-10', lesson: 'program', prompt: '本关 Pallof 推安排 2 组，每侧 8–12 次，如何计数？', options: ['左侧做 1 次、右侧做 1 次，共 2 组', '每组左右各做 8–12 次，完成两轮计 2 组', '只做惯用侧 2 组即可'], correct: 1, explanation: '本关将左右各完成计划次数计为 1 组，完成两轮就是 2 组。计数规则需明确，两侧都练；实际安排可按恢复与控制调整。' }
  ],
  exercises: [
    { id: 'crunch', name: '卷腹', english: 'CRUNCH', type: 'isolation', pattern: 'flexion', focus: '腹直肌 · 可控躯干屈曲', description: '仰卧屈膝，胸廓缓慢靠近骨盆，肩胛轻离地后受控返回。', cues: ['双手轻放胸前或头侧，不拉颈部。', '呼气时缓慢卷起，不必追求坐起。', '在舒适范围内返回，避免用惯性反弹。'], mistake: '用手拉头、颈部前探，或借甩动完成大幅仰卧起坐。', reps: '10–15 次', art: './assets/exercise-core-crunch.svg', region: 'rectus', defaultSelected: true, defaultSets: 2 },
    { id: 'deadbug', name: '死虫', english: 'DEAD BUG', type: 'compound', pattern: 'anti-extension', focus: '腹壁协作 · 抗伸展', description: '仰卧抬起四肢，交替伸出对侧手脚，在腰盆可控的范围内返回。', cues: ['找到舒适腰盆位置，适度绷紧腹部并持续呼吸。', '对侧手脚缓慢伸长，躯干不明显拱起。', '控制不住时缩短距离，或先只移动一条腿。'], mistake: '手脚急速落下，或用明显拱腰换取更低的落点。', reps: '6–10 次 / 侧', art: './assets/exercise-core-deadbug.svg', region: 'transverse', defaultSelected: true, defaultSets: 2 },
    { id: 'pallof', name: 'Pallof 抗旋转推', english: 'PALLOF PRESS', type: 'compound', pattern: 'anti-rotation', focus: '腹斜肌与深层协作 · 抗旋转', description: '让固定在侧面的绳索或弹力带产生侧向拉力，双手从胸前推出并收回，身体保持朝前。', cues: ['锚点牢固，站在锚点侧方，双脚稳定支撑。', '双手推出时，胸廓与骨盆大致保持朝前。', '阻力以能自然呼吸、完成两侧控制为准。'], mistake: '身体被带转、向侧面倾斜，或用过大阻力迫使全程憋气。', reps: '8–12 次 / 侧', art: './assets/exercise-core-pallof.svg', region: 'obliques', defaultSelected: true, defaultSets: 2 },
    { id: 'birddog', name: '鸟狗', english: 'BIRD DOG', type: 'compound', pattern: 'anti-extension', focus: '前后侧核心协作 · 腰盆控制', description: '四点支撑，缓慢伸出对侧手脚；让四肢伸长而躯干与骨盆尽量稳定。', cues: ['双手大致在肩下、双膝大致在髋下。', '手脚向远处伸长，避免以抬高代替控制。', '保持呼吸与骨盆朝向地面，再缓慢收回换侧。'], mistake: '抬腿过高导致塌腰，或伸手时骨盆明显向一侧翻开。', reps: '6–10 次 / 侧', art: './assets/exercise-core-birddog.svg', region: 'obliques', defaultSelected: false, defaultSets: 2 }
  ]
};
