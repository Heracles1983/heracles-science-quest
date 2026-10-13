window.FITNESS_DATA = (() => {
  const sources = {
    acsm2026: {
      label: 'ACSM · 2026 抗阻训练指南',
      url: 'https://acsm.org/resistance-training-guidelines-update-2026/'
    },
    acsmProgress: {
      label: 'ACSM · 抗阻训练进阶模型',
      url: 'https://pubmed.ncbi.nlm.nih.gov/19204579/'
    },
    cdcActivity: {
      label: 'CDC · 成年人活动指南',
      url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html'
    },
    spotReview: {
      label: 'Human Movement · 局部减脂系统综述',
      url: 'https://doi.org/10.5114/hm.2022.110373'
    },
    nihProtein: {
      label: 'NIH ODS · 运动营养与补剂',
      url: 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-Consumer/'
    },
    niddkMyths: {
      label: 'NIH NIDDK · 营养与运动误区',
      url: 'https://www.niddk.nih.gov/health-information/weight-management/myths-nutrition-physical-activity'
    },
    niddkEating: {
      label: 'NIH NIDDK · 饮食与身体活动',
      url: 'https://www.niddk.nih.gov/health-information/weight-management/adult-overweight-obesity/eating-physical-activity'
    },
    cdcSleep: {
      label: 'CDC · 睡眠基础',
      url: 'https://www.cdc.gov/sleep/about/'
    },
    acsmEccentric: {
      label: 'ACSM · 离心运动与酸痛',
      url: 'https://acsm.org/eccentric-contractions-muscle-damage/'
    },
    cochraneStretch: {
      label: 'Cochrane · 拉伸与运动后酸痛',
      url: 'https://www.cochrane.org/evidence/CD004577_stretching-prevent-or-reduce-muscle-soreness-after-exercise'
    },
    ahaWarmup: {
      label: 'AHA · 热身与整理活动',
      url: 'https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/warm-up-cool-down'
    },
    acsmHydration: {
      label: 'ACSM · 运动与补液',
      url: 'https://pubmed.ncbi.nlm.nih.gov/17277604/'
    }
  };

  return {
    chapters: [
      {
        id: 'strength',
        title: '力量试炼',
        subtitle: '掌握节奏，锻造真正的力量',
        boss: '蛮力石像',
        description: '用循序渐进与规律训练，击碎蛮力石像的训练误区。',
        icon: 'sword',
        art: 4
      },
      {
        id: 'nutrition',
        title: '营养炼金',
        subtitle: '均衡补给，点燃身体的能量',
        boss: '饥饿术士',
        description: '揭开神奇补剂与极端节食的幻术，找回均衡饮食之力。',
        icon: 'leaf',
        art: 2
      },
      {
        id: 'recovery',
        title: '月光秘境',
        subtitle: '让休憩成为进步的一部分',
        boss: '不眠之龙',
        description: '读懂睡眠、酸痛与补水，驱散不眠之龙制造的恢复迷雾。',
        icon: 'moon',
        art: 5
      }
    ],
    questions: [
      {
        id: 's5', chapter: 'strength', title: '渐进锻造',
        question: '同样重量能稳定多做几次后，怎样进阶更合理？',
        options: [
          { name: '极限跃进', text: '立即把训练重量翻倍，挑战更强负荷', art: 1 },
          { name: '速度迷思', text: '只追求动作越来越快，不再调整阻力', art: 0 },
          { name: '渐进超负荷', text: '小幅增加训练阻力，同时保持动作控制', art: 3 }
        ],
        correct: 2,
        explanation: '当现有负荷已明显适应，可以逐步提高训练挑战。增加幅度需匹配动作、目标与能力，避免突然大幅加量。',
        source: sources.acsmProgress
      },
      {
        id: 's1', chapter: 'strength', title: '坚持之印',
        question: '入门力量训练，最值得优先建立的是？',
        options: [
          { name: '变幻迷阵', text: '每天更换全部训练动作，追求新鲜感', art: 3 },
          { name: '恒心契约', text: '建立规律、适合自己且能坚持的计划', art: 2 },
          { name: '蛮力冲锋', text: '第一天就挑战自己能举起的最大重量', art: 1 }
        ],
        correct: 1,
        explanation: '从不训练到规律抗阻训练，就能获得明显收益。计划应适合目标与生活，复杂并不自动等于有效。',
        source: sources.acsm2026
      },
      {
        id: 's2', chapter: 'strength', title: '自重之刃',
        question: '没有健身房，哪组也属于抗阻训练？',
        options: [
          { name: '居家锻造', text: '使用弹力带划船，并进行自重俯卧撑', art: 0 },
          { name: '静默冥想', text: '安静坐着深呼吸，不让肌肉对抗阻力', art: 4 },
          { name: '柔韧幻影', text: '只进行轻柔拉伸，不加入抗阻活动', art: 2 }
        ],
        correct: 0,
        explanation: '抗阻训练可以使用自重、弹力带或器械。能让肌肉对抗适当阻力的居家训练，也可以有效。',
        source: sources.acsm2026
      },
      {
        id: 's3', chapter: 'strength', title: '余力守护',
        question: '普通成年人每组都必须练到完全力竭吗？',
        options: [
          { name: '力竭诅咒', text: '必须每组完全力竭，否则没有训练收益', art: 0 },
          { name: '器械迷咒', text: '使用自由重量时，每组就必须完全力竭', art: 3 },
          { name: '余力之盾', text: '并非必须，可根据个人能力安排强度', art: 1 }
        ],
        correct: 2,
        explanation: '完全力竭并不是普通健身者获得力量或增肌收益的必需条件。训练努力程度和安排应结合个人能力。',
        source: sources.acsm2026
      },
      {
        id: 's4', chapter: 'strength', title: '破除幻象',
        question: '只练腹肌，能可靠地指定腹部减脂吗？',
        options: [
          { name: '局部幻术', text: '可以，锻炼哪个部位就优先减少那里的脂肪', art: 5 },
          { name: '全局真知', text: '不能可靠指定，但可以强化相关肌肉', art: 2 },
          { name: '酸痛魔印', text: '可以，但必须把腹肌练到明显酸痛', art: 0 }
        ],
        correct: 1,
        explanation: '腹部训练能强化相关肌肉，但不能可靠指定脂肪从哪里减少。减脂涉及整体能量平衡和个体差异。',
        source: sources.spotReview
      },
      {
        id: 's6', chapter: 'strength', title: '双日契约',
        question: '一般成年人每周建议至少几天做肌肉强化活动？',
        options: [
          { name: '双日之印', text: '每周至少两天，并覆盖身体主要肌群', art: 2 },
          { name: '无休狂战', text: '每周七天，而且每天必须练到力竭', art: 5 },
          { name: '月度幻影', text: '每月只练一天，就能达到每周建议', art: 0 }
        ],
        correct: 0,
        explanation: '公共健康指南建议成年人每周至少 2 天进行肌肉强化活动，并覆盖主要肌群；具体安排可按能力调整。',
        source: sources.cdcActivity
      },
      {
        id: 'n1', chapter: 'nutrition', title: '食物之力',
        question: '想获得足够蛋白质，蛋白粉是必需品吗？',
        options: [
          { name: '粉剂神话', text: '是必需品，日常食物无法提供足够蛋白质', art: 1 },
          { name: '食物之力', text: '不是必需品，日常食物也能提供蛋白质', art: 5 },
          { name: '休训迷咒', text: '只有不训练的日子，才必须喝蛋白粉', art: 4 }
        ],
        correct: 1,
        explanation: '肉、蛋、奶、豆类等都能提供蛋白质。蛋白粉是补充选择，是否需要取决于日常饮食能否满足需求。',
        source: sources.nihProtein
      },
      {
        id: 'n2', chapter: 'nutrition', title: '豆类盟约',
        question: '以下哪种食物通常能提供较丰富的植物蛋白？',
        options: [
          { name: '豆类盟约', text: '豆腐等豆制品，可作为植物蛋白来源', art: 0 },
          { name: '甜蜜幻术', text: '白砂糖，可作为较丰富的植物蛋白来源', art: 2 },
          { name: '油脂迷雾', text: '纯食用油，可作为较丰富的植物蛋白来源', art: 3 }
        ],
        correct: 0,
        explanation: '豆类及豆制品是常见植物蛋白来源。多样搭配植物食物，有助于获得需要的氨基酸与其他营养。',
        source: sources.nihProtein
      },
      {
        id: 'n3', chapter: 'nutrition', title: '谷物补给',
        question: '管理体重时，米饭、面包等主食应一律戒掉吗？',
        options: [
          { name: '断粮诅咒', text: '应该全部戒掉，任何谷物都会让人发胖', art: 0 },
          { name: '补剂幻餐', text: '应该全部戒掉，只能用运动补剂替代', art: 5 },
          { name: '谷物补给', text: '不必一律戒掉，注意分量与整体搭配', art: 3 }
        ],
        correct: 2,
        explanation: '谷物本身不必然导致发胖。分量和整体饮食更关键；全谷物还能提供纤维等营养。',
        source: sources.niddkMyths
      },
      {
        id: 'n4', chapter: 'nutrition', title: '脂质平衡',
        question: '为了健康饮食，需要完全避开所有脂肪吗？',
        options: [
          { name: '零脂魔咒', text: '需要完全避开，因为脂肪没有营养用途', art: 0 },
          { name: '脂质平衡', text: '不必完全避开，合理选择并控制分量', art: 4 },
          { name: '坚果狂宴', text: '只要选择坚果，无论多少都可以放心吃', art: 5 }
        ],
        correct: 1,
        explanation: '脂肪也是饮食所需的营养成分。坚果、植物油等可以适量纳入，但脂肪能量密度高，分量仍重要。',
        source: sources.niddkMyths
      },
      {
        id: 'n5', chapter: 'nutrition', title: '均衡之盾',
        question: '运动补剂能替代长期均衡的日常饮食吗？',
        options: [
          { name: '昂贵幻药', text: '可以替代，只要选择价格足够高的补剂', art: 0 },
          { name: '包装神谕', text: '可以替代，只要包装上写着运动专用', art: 2 },
          { name: '均衡之盾', text: '不能替代，营养基础仍是合理日常饮食', art: 5 }
        ],
        correct: 2,
        explanation: '补剂不能替代健康饮食。不同成分的证据和效果不同，营销承诺不能直接当作训练收益。',
        source: sources.nihProtein
      },
      {
        id: 'n6', chapter: 'nutrition', title: '丰盛餐盘',
        question: '哪种搭配更接近日常训练所需的均衡一餐？',
        options: [
          { name: '丰盛餐盘', text: '米饭搭配豆腐或鸡蛋，再加适量蔬菜', art: 0 },
          { name: '饥饿幻宴', text: '整顿饭只吃一盘黄瓜，不搭配其他食物', art: 1 },
          { name: '单剂晚餐', text: '整顿饭只喝蛋白饮品，不搭配其他食物', art: 3 }
        ],
        correct: 0,
        explanation: '训练饮食需要兼顾能量、蛋白质与多样营养。单一食物通常难以长期满足这些需要。',
        source: sources.niddkEating
      },
      {
        id: 'r1', chapter: 'recovery', title: '月光休憩',
        question: '18—60 岁成年人通常建议每晚至少睡多久？',
        options: [
          { name: '短眠迷咒', text: '每晚四小时，就能满足一般成年人的建议', art: 2 },
          { name: '月光休憩', text: '每晚至少七小时，同时重视睡眠质量', art: 0 },
          { name: '咖啡幻盾', text: '只要一直喝咖啡，就可以完全不用睡觉', art: 4 }
        ],
        correct: 1,
        explanation: 'CDC 建议 18—60 岁成年人每晚至少睡 7 小时。需求因人而异，睡眠质量与规律也很重要。',
        source: sources.cdcSleep
      },
      {
        id: 'r2', chapter: 'recovery', title: '适应之息',
        question: '哪种情况更容易出现延迟性肌肉酸痛？',
        options: [
          { name: '初练之印', text: '首次进行大量离心动作，例如负重下放', art: 4 },
          { name: '清水迷思', text: '训练期间多喝一口水，就容易引起酸痛', art: 2 },
          { name: '衣色幻术', text: '只改变训练服颜色，就容易引起酸痛', art: 0 }
        ],
        correct: 0,
        explanation: '不熟悉的运动，特别是强度高或次数多的离心动作，更容易引起延迟性酸痛；训练量宜循序渐进。',
        source: sources.acsmEccentric
      },
      {
        id: 'r3', chapter: 'recovery', title: '柔韧真知',
        question: '训练后拉伸，能保证第二天不酸痛吗？',
        options: [
          { name: '疼痛幻咒', text: '可以保证，拉伸时越疼就越能消除酸痛', art: 2 },
          { name: '瞬间净化', text: '可以保证，只要持续拉伸一分钟就够', art: 1 },
          { name: '柔韧真知', text: '不能保证，对减少延迟性酸痛的效果有限', art: 5 }
        ],
        correct: 2,
        explanation: '研究未发现训练前后拉伸能明显减少延迟性酸痛。拉伸可以服务柔韧目标，但别把它当作消除酸痛的保证。',
        source: sources.cochraneStretch
      },
      {
        id: 'r4', chapter: 'recovery', title: '唤醒仪式',
        question: '开始主要训练前，哪种热身方式更合适？',
        options: [
          { name: '极限突袭', text: '立刻进入最大训练强度，不留过渡时间', art: 2 },
          { name: '唤醒仪式', text: '先进行低强度活动，再逐渐提高强度', art: 5 },
          { name: '静坐结界', text: '完全静坐直到开始，不进行任何活动', art: 0 }
        ],
        correct: 1,
        explanation: '热身应让心率、呼吸和活动强度逐渐上升。可先进行较轻的相关活动，再进入正式训练。',
        source: sources.ahaWarmup
      },
      {
        id: 'r5', chapter: 'recovery', title: '清泉补给',
        question: '大量出汗后，体重短时间下降应怎样理解？',
        options: [
          { name: '燃脂幻象', text: '短时间下降的体重，全都是减少的脂肪', art: 0 },
          { name: '局部魔印', text: '这能证明，锻炼哪里就会优先瘦哪里', art: 4 },
          { name: '清泉真知', text: '水分变化可能占很大部分，并非全是脂肪', art: 2 }
        ],
        correct: 2,
        explanation: '运动前后的短时体重变化可反映汗液和水分损失。它不能直接当作脂肪减少量，补液也要考虑个体情况。',
        source: sources.acsmHydration
      },
      {
        id: 'r6', chapter: 'recovery', title: '作息结界',
        question: '哪种习惯更有助于建立良好的睡眠规律？',
        options: [
          { name: '作息结界', text: '尽量固定每天的入睡时间和起床时间', art: 0 },
          { name: '随夜漂流', text: '每晚随机决定入睡时间，完全没有规律', art: 5 },
          { name: '屏幕迷雾', text: '睡前一直刷屏，直到困得无法继续为止', art: 3 }
        ],
        correct: 0,
        explanation: '保持相对固定的入睡和起床时间，是改善睡眠习惯的常见建议。周末也尽量保持规律。',
        source: sources.cdcSleep
      }
    ]
  };
})();
