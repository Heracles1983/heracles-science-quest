window.FIT_COURSES=window.FIT_COURSES||{};
window.FIT_COURSES.chest={
 ...window.CHEST_DATA,
 id:'chest',name:'胸部',title:'胸大肌',english:'PECTORALIS MAJOR',view:'前面观',anatomy:'./assets/chest-anatomy.svg',
 intro:'胸大肌连接胸廓与上臂。从肌纤维方向理解推举与飞鸟，让动作选择更有依据。',
 concepts:[{title:'一块肌肉，两大分区',copy:'锁骨部起于锁骨内侧，胸肋部主要起于胸骨与肋软骨区域。两部分肌纤维共同向肱骨汇聚。'},{title:'让上臂向胸前合拢',copy:'这叫肩关节水平内收，是胸大肌的重要功能之一。它牵拉上臂，而非直接牵拉双手。'}],
 anatomyNote:'“内侧胸肌”不是一块独立肌肉。改变角度可调整训练侧重，但不能完全隔离某个区域。',
 regions:[{id:'clavicular',name:'锁骨部',description:'上方铜金色肌束，从锁骨内侧区域汇向肱骨，也参与肩关节屈曲。',color:'#c9945c',exerciseIds:['incline']},{id:'sternocostal',name:'胸肋部',description:'较大的扇形肌束，从胸骨和肋软骨区域向外侧上臂汇聚。',color:'#a3544e',exerciseIds:['flat','fly','pushup']}],
 quality:['身体支撑稳定，手腕与前臂合理对齐','下降可控，动作幅度舒适且能保持','发现明显变形时结束这一组，调整负荷'],
 program:{minExercises:2,maxExercises:3,minSets:6,maxSets:8,requiredPatterns:[],compoundRest:[120,180],isolationRest:[60,120],note:'单堂胸部编排教学例子，热身另计；实际总量还需结合一周频率、肩部与手臂的间接训练和恢复。'},
 exercises:window.CHEST_DATA.exercises.map((e,i)=>({...e,art:'./assets/exercise-'+e.id+'.svg',region:e.id==='incline'?'clavicular':'sternocostal',pattern:e.id==='fly'?'adduction':'push',defaultSelected:i<3,defaultSets:i===0?3:2}))
};
