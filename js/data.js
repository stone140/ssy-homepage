/* ============================================================
 * data.js —— 页面所有文案 / 多语言 / 子页面内容 (v2.7)
 * 结构变化: 由「长页滚动」改为「顶部背景画面 + 页面选择(4 页)」
 *   - 个人介绍 intro / 个人专业 major / 个人兴趣 hobbies / 联系我 contact
 * ============================================================ */

const SITE_DATA = {
  /* ---------- 中英双语文案 ---------- */
  lang: {
    zh: {
      /* 页面选择(顶部导航 + 画面菜单共用) */
      nav: { intro: "个人介绍", major: "个人专业", hobbies: "个人兴趣", contact: "联系我", board: "留言板" },
      heroKicker: "PIXEL FOREST · v4.0",
      heroSub: "tju-polyu · 计算机科学与技术",
      heroIntro: "一个从甘肃来的懵懂无知、充满好奇、非常幽默的大一新生。",
      menuHint: "按 A/B/X/Y 选栏目 · 绿屏进留言板 · L/R 切明暗",

      /* 四个页面的标题/副标题/卡片 */
      panels: {
        intro: {
          title: "个人介绍",
          sub: "About Me · 关于这个来自西北的少年",
          photoCap: "嗨，我是石胜元 · 甘肃 → 天津",
          pixelCap: "像素版的我",
          cards: [
            { icon: "📍", title: "来自甘肃", text: "从西北大地出发，带着西北人的质朴与豪爽，一路向东求学。" },
            { icon: "😄", title: "幽默的大一新生", text: "懵懂、好奇、爱笑。喜欢用幽默对抗平淡，把日子过得有滋有味。" },
            { icon: "🧭", title: "目标与信念", text: "保持好奇，认真生活。用思考丈量世界，做一个有趣的人。" },
          ],
        },
        major: {
          title: "个人专业",
          sub: "Computer Science · 天津大学 - 香港理工大学联合培养",
          cards: [
            { icon: "🎓", title: "tju-polyu", text: "就读于天津大学 - 香港理工大学联合培养项目，在两座城市之间求学与成长。" },
            { icon: "💻", title: "计算机科学与技术", text: "主修计算机科学与技术，从编程基础到算法思维，一点点搭建自己的知识地图。" },
            { icon: "🧩", title: "正在学习", text: "C 语言、数据结构、离散数学……也在自学前端，把想法变成看得见的页面。" },
            { icon: "🚀", title: "未来方向", text: "对人工智能与系统方向充满兴趣，希望有一天能做出真正有用的东西。" },
          ],
        },
        hobbies: {
          title: "个人兴趣",
          sub: "点击卡片，听听我和它们的故事",
        },
        contact: {
          title: "联系我",
          sub: "欢迎留言交流",
        },
        board: {
          title: "留言板",
          sub: "留下你的足迹，我会看到的",
        },
      },

      hobbyCards: {
        badminton: { emoji: "🏸", title: "羽毛球", more: "点击了解 →" },
        philosophy: { emoji: "🌌", title: "哲学", more: "点击了解 →" },
        music: { emoji: "🎵", title: "音乐", more: "点击了解 →" },
        comedy: { emoji: "🎭", title: "相声", more: "点击了解 →" },
      },
      contact: [
        { icon: "✉️", label: "邮箱", value: "ssy080724@qq.com", href: "mailto:ssy080724@qq.com" },
        { icon: "💬", label: "微信", value: "ssyishappy", href: "" },
        { icon: "🐧", label: "QQ", value: "663579961", href: "" },
      ],
      footer: { text: "石胜元 · 用热爱与好奇，认真生活", note: "本项目为课程作业 · 静态页面 + Serverless 分身 · 零构建依赖" },
      theme: { dark: "切换到黑夜模式", light: "切换到明亮模式" },
      chat: {
        title: "有什么想对我说的？",
        placeholder: "输入你的话...",
        send: "发送",
        note: "留言保存在本地浏览器 · 后续可接入 Supabase 后端",
        empty: "还没有留言，来说第一句吧～",
      },
      modalClose: "关闭",
      music: {
        title: "最爱音乐",
        track: "Christina Kuong · Forest Mixtape",
        play: "播放最爱音乐",
        pause: "暂停音乐",
      },
      /* v4.0: 分身的 UI 文案 / 知识库 / 提示词已移到 data/persona.json，
         由 tools/build_persona.py 生成 js/persona.js 与云函数。 */
      board: {
        namePlaceholder: "你的昵称",
        msgPlaceholder: "写下你想说的话...",
        send: "发布留言",
        empty: "还没有留言，来当第一个吧～",
        note: "留言保存在本地浏览器 · 后续可接入后端",
      },

      /* ---------- v3.0 反馈功能 ----------
         注意：relationOptions / deviceOptions 的 value 是入库用的规范值，
         zh 与 en 两份必须完全一致（数据库有 check 约束），只有 label 随语言变。 */
      feedback: {
        entryTitle: "给这个网站提反馈",
        entryDesc: "哪里不好用？告诉我，下一版就改",
        entryGo: "填写 →",
        boardLink: "想提具体建议？填一张反馈表 →",
        title: "反馈",
        intro: "这个网站还在改。你的意见会直接决定我下一步改什么。",
        nicknameLabel: "名字或昵称",
        nicknameHint: "可不填 · 昵称就行，不用真名",
        nicknamePlaceholder: "怎么称呼你？（可不填）",
        relationLabel: "你是我的……",
        deviceLabel: "你是在什么设备上看的？",
        contentLabel: "想反馈的内容",
        contentPlaceholder: "例如：手机上看「个人介绍」时，照片下面的字有点挤……（说得越具体越好）",
        contentHint: "说说具体位置、你的体验和遇到的问题",
        autoNote: "提交时间与网站版本会自动带上 ✦",
        submit: "提交反馈",
        cancel: "取消",
        sending: "正在提交…",
        ok: "收到啦，谢谢！我会认真看的。",
        queued: "网络好像不通，已先存在本机，等联网后自动补交。",
        fail: "提交失败，请稍后再试。",
        invalidRelation: "选一个吧",
        invalidDevice: "选一个吧",
        invalidContent: "写点什么吧，随便一句也行",
        tooLong: "有点太长啦，精简一下？",
        countSuffix: " 字",
        close: "关闭",
        outboxPending: "本机还有 {n} 条反馈没送出去，联网后会自动补交",
        relationOptions: [
          { value: "同学", label: "同学" },
          { value: "老师", label: "老师" },
          { value: "家人", label: "家人" },
          { value: "朋友", label: "朋友" },
          { value: "同事", label: "同事" },
          { value: "其他", label: "其他" },
          { value: "不便透露", label: "不便透露" },
        ],
        deviceOptions: [
          { value: "电脑", label: "电脑" },
          { value: "手机", label: "手机" },
          { value: "平板", label: "平板" },
          { value: "其他", label: "其他" },
        ],
      },
    },
    en: {
      nav: { intro: "About", major: "Major", hobbies: "Interests", contact: "Contact", board: "Board" },
      heroKicker: "PIXEL FOREST · v4.0",
      heroSub: "tju-polyu · Computer Science",
      heroIntro: "A naive, curious, and humorous freshman from Gansu.",
      menuHint: "Press A/B/X/Y for sections · Screen → board · L/R theme",

      panels: {
        intro: {
          title: "About Me",
          sub: "A young man from the northwest",
          photoCap: "Hi, I'm Shishengyuan · Gansu → Tianjin",
          pixelCap: "Me, in pixels",
          cards: [
            { icon: "📍", title: "From Gansu", text: "Setting out from the northwest, carrying the simplicity and warmth of the region, traveling east to study." },
            { icon: "😄", title: "A humorous freshman", text: "Naive, curious, and always smiling. I use humor against the mundane and make every day lively." },
            { icon: "🧭", title: "Goals & Beliefs", text: "Stay curious, live with purpose. Measure the world with thought, and be an interesting person." },
          ],
        },
        major: {
          title: "My Major",
          sub: "Computer Science · TJU - PolyU joint program",
          cards: [
            { icon: "🎓", title: "tju-polyu", text: "A joint program between Tianjin University and Hong Kong Polytechnic University, studying and growing between two cities." },
            { icon: "💻", title: "Computer Science", text: "Majoring in Computer Science, building my knowledge map step by step, from programming basics to algorithmic thinking." },
            { icon: "🧩", title: "Currently learning", text: "C, data structures, discrete math... and teaching myself front-end to turn ideas into visible pages." },
            { icon: "🚀", title: "Future direction", text: "Deeply interested in AI and systems, hoping to build something truly useful one day." },
          ],
        },
        hobbies: {
          title: "My Interests",
          sub: "Click a card to hear my story",
        },
        contact: {
          title: "Contact",
          sub: "Feel free to leave a message",
        },
        board: {
          title: "Message Board",
          sub: "Leave your footprint — I'll see it",
        },
      },

      hobbyCards: {
        badminton: { emoji: "🏸", title: "Badminton", more: "Learn more →" },
        philosophy: { emoji: "🌌", title: "Philosophy", more: "Learn more →" },
        music: { emoji: "🎵", title: "Music", more: "Learn more →" },
        comedy: { emoji: "🎭", title: "Crosstalk", more: "Learn more →" },
      },
      contact: [
        { icon: "✉️", label: "Email", value: "ssy080724@qq.com", href: "mailto:ssy080724@qq.com" },
        { icon: "💬", label: "WeChat", value: "ssyishappy", href: "" },
        { icon: "🐧", label: "QQ", value: "663579961", href: "" },
      ],
      footer: { text: "Shi Shengyuan · Live with passion and curiosity", note: "Course project · Static site + serverless avatar · Zero build deps" },
      theme: { dark: "Switch to dark mode", light: "Switch to light mode" },
      chat: {
        title: "What would you like to say?",
        placeholder: "Type your message...",
        send: "Send",
        note: "Messages are stored locally · Supabase backend coming soon",
        empty: "No messages yet — say hi!",
      },
      modalClose: "Close",
      music: {
        title: "Favorite Music",
        track: "Christina Kuong · Forest Mixtape",
        play: "Play favorite music",
        pause: "Pause music",
      },
      /* v4.0: avatar copy / knowledge / prompt live in data/persona.json. */
      board: {
        namePlaceholder: "Your nickname",
        msgPlaceholder: "Write something...",
        send: "Post",
        empty: "No messages yet — be the first!",
        note: "Stored locally in your browser · backend coming soon",
      },

      /* ---------- v3.0 feedback ----------
         value stays the canonical Chinese value (matches the DB check constraint);
         only `label` changes with the language. */
      feedback: {
        entryTitle: "Send feedback",
        entryDesc: "Something awkward or broken? Tell me — I'll fix it next version",
        entryGo: "Write →",
        boardLink: "Have a concrete suggestion? Use the feedback form →",
        title: "Feedback",
        intro: "This site is still being revised. Your feedback decides what I change next.",
        nicknameLabel: "Name or nickname",
        nicknameHint: "Optional · a nickname is fine, no real name needed",
        nicknamePlaceholder: "What should I call you? (optional)",
        relationLabel: "You are my…",
        deviceLabel: "Which device are you viewing on?",
        contentLabel: "Your feedback",
        contentPlaceholder: "e.g. On my phone, the text under the photo on the About page feels cramped… (the more specific, the better)",
        contentHint: "Mention the exact spot, what you experienced, and what went wrong",
        autoNote: "Submit time and site version are attached automatically ✦",
        submit: "Submit",
        cancel: "Cancel",
        sending: "Sending…",
        ok: "Got it — thank you! I'll read it carefully.",
        queued: "Looks offline. Saved on this device and it will be sent automatically once you're back online.",
        fail: "Submit failed, please try again later.",
        invalidRelation: "Please pick one",
        invalidDevice: "Please pick one",
        invalidContent: "Please write something — even one line helps",
        tooLong: "That's a bit long — could you trim it?",
        countSuffix: " chars",
        close: "Close",
        outboxPending: "{n} feedback item(s) still unsent on this device; will retry automatically",
        relationOptions: [
          { value: "同学", label: "Classmate" },
          { value: "老师", label: "Teacher" },
          { value: "家人", label: "Family" },
          { value: "朋友", label: "Friend" },
          { value: "同事", label: "Colleague" },
          { value: "其他", label: "Other" },
          { value: "不便透露", label: "Prefer not to say" },
        ],
        deviceOptions: [
          { value: "电脑", label: "Computer" },
          { value: "手机", label: "Phone" },
          { value: "平板", label: "Tablet" },
          { value: "其他", label: "Other" },
        ],
      },
    },
  },

  /* ---------- 子页面(弹窗)内容 ---------- */
  pages: {
    badminton: {
      zh: {
        title: "羽毛球",
        paragraphs: [
          "三年前，我在高中体育课上第一次握起羽毛球拍。没有专业教练指导，没有系统训练规划，全凭一腔热情——从最初接不住对手的扣杀，到如今能稳定打出高远球、网前小球，甚至与球友打出多拍回合。三年间，学校体育馆成了我的“第二教室”：课间十分钟的快速对打，放学后两小时的实战积累，周末与校外爱好者的切磋交流……每一次挥拍都见证着成长。",
          "如今我的水平处于业余3级（掌握基本步法和技术，具备初阶对抗能力），虽然动作仍不够规范，但通过比赛和视频自学积累的经验，让我在前后场移动、线路变化中逐渐找到节奏。更重要的是，羽毛球教会我专注与坚持——每局比分落后时的反超，每次失误后的自我调整，都是比输赢更珍贵的收获。",
          "未来，我希望能接受一次正规技术指导，补足反手高远球和被动球处理短板。毕竟，与羽毛球的故事，才刚写到第三章。",
        ],
      },
      en: {
        title: "Badminton",
        paragraphs: [
          "Three years ago, I held a badminton racket for the first time in a high school PE class. Without a coach or any systematic training plan, I went on sheer passion — from failing to return a smash to now consistently hitting clears, net shots, and even long rallies. Over three years, the school gym became my \"second classroom\": quick games during ten-minute breaks, two-hour sessions after school, and weekend exchanges with players outside school... every swing has witnessed my growth.",
          "I am currently at amateur level 3 (mastering basic footwork and technique, with entry-level competitive ability). My form is still not perfect, but the experience built through matches and self-study has let me find rhythm in front-and-back court movement and shot variation. More importantly, badminton has taught me focus and persistence — turning a deficit with every point, adjusting after every mistake, these matter far more than winning or losing.",
          "In the future, I hope to receive proper technical coaching, especially to strengthen my backhand clears and handling of defensive shots. After all, my story with badminton is only reaching its third chapter.",
        ],
      },
    },
    philosophy: {
      zh: {
        title: "哲学",
        paragraphs: [
          "我与哲学的相遇，始于对“人应该如何生活”这一古老问题的困惑。高中时偶然读到《道德经》，“道可道，非常道”一句如当头棒喝，让我意识到语言与真理之间的鸿沟。从此，我踏上了一条漫长的求索之路。",
          "在道学中，我着迷于“无为”与“自然”的张力——不刻意干涉，却非消极放任，而是一种更深的顺应与洞察。佛学的“空性”则让我重新审视执念：苦并非来自外境，而是来自我们对“常”的妄想。读《中论》时，我曾反复思量“八不中道”，在破与立之间寻找平衡。后来接触康德，又被其严谨的批判精神震撼。《纯粹理性批判》让我明白，我们的认知自有其边界，而道德法则却指向一个超越性的自由领域。休谟的怀疑、康德的建构、东方的不二，这三条线索在我心中交织，形成一种既冲突又互补的思想图景。",
          "哲学于我，不是职业，而是一种生活方式。它教会我质疑理所当然，也教会我在不确定性中保持从容。未来，我希望继续深耕东西方比较哲学，尤其关注康德与佛学在“主体性”问题上的对话可能。思考从未停止，而每一步追问本身，就已是最诚实的回答。",
        ],
      },
      en: {
        title: "Philosophy",
        paragraphs: [
          "My encounter with philosophy began with the puzzle of an ancient question: \"How should one live?\" In high school, I happened upon the Tao Te Ching. The line \"The Tao that can be spoken is not the eternal Tao\" struck me like a wake-up call, making me realize the gap between language and truth. From then on, I set out on a long path of inquiry.",
          "In Taoism, I am drawn to the tension between \"wu-wei\" (effortless action) and \"naturalness\" — not forceful interference, yet not passive resignation, but a deeper attunement and insight. Buddhism's concept of \"emptiness\" led me to reconsider attachment: suffering does not come from external circumstances but from our illusion of permanence. Reading the \"Mulamadhyamakakarika\", I pondered the \"Eight Negations\" repeatedly, seeking balance between deconstruction and reconstruction. Later I came to Kant and was struck by his rigorous critical spirit. The \"Critique of Pure Reason\" showed me that our cognition has its own limits, while moral law points toward a transcendent realm of freedom. Hume's skepticism, Kant's construction, and the Eastern doctrine of non-duality — these three threads weave together in my mind into a picture that is at once conflicting and complementary.",
          "Philosophy, for me, is not a profession but a way of living. It teaches me to question what seems obvious, and to remain composed amid uncertainty. In the future, I hope to keep exploring comparative philosophy between East and West, focusing especially on the possible dialogue between Kant and Buddhism on the question of \"subjectivity.\" Thinking never stops, and every step of questioning itself is already the most honest answer.",
        ],
      },
    },
    music: {
      zh: {
        title: "音乐",
        paragraphs: [
          "旋律是情绪的另一种语言。开心时它是跳跃的节拍，安静时它是流淌的溪流。",
          "音乐陪伴我度过每一个专注的时刻，也在疲惫时给我重新出发的力量。希望有一天，我也能创作出属于自己的旋律。",
        ],
      },
      en: {
        title: "Music",
        paragraphs: [
          "Melody is another language of emotion. When happy, it is a bouncing beat; when calm, it is a flowing stream.",
          "Music accompanies me through every focused moment and gives me strength to set out again when I am tired. I hope one day to compose a melody of my own.",
        ],
      },
    },
    comedy: {
      zh: {
        title: "相声",
        paragraphs: [
          "在说学逗唱里，我体会到了语言的艺术。一个包袱的抖动、一句台词的妙用，都能让人会心一笑。",
          "相声教会我节奏、表达与幽默。我也把这份幽默带进生活，希望用它点亮身边人的一天。",
        ],
      },
      en: {
        title: "Crosstalk",
        paragraphs: [
          "In the art of speech, imitation, wit, and song, I came to appreciate the craft of language. A well-timed punchline or a clever line can bring a knowing smile.",
          "Crosstalk taught me rhythm, expression, and humor. I carry this humor into daily life, hoping to brighten someone's day with it.",
        ],
      },
    },
  },
};
