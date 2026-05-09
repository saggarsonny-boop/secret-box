export type Lang = 'en' | 'es' | 'pt' | 'fr' | 'ar' | 'hi' | 'zh';

type Strings = {
  title: string;
  tagline: string;
  read: string;
  share: string;
  showTruth: string;
  all: string;
  howFeeling: string;
  anonymous: string;
  justTruth: string;
  permanent: string;
  placeholder: string;
  addImage: string;
  release: string;
  sending: string;
  checkingImage: string;
  outThere: string;
  lessAlone: string;
  sayMore: string;
  morePlaceholder: string;
  noDone: string;
  releaseThis: string;
  heard: string;
  courage: string;
  readOthers: string;
  next: string;
  feltThis: string;
  copy: string;
  copied: string;
  mostFelt: string;
  secretsShared: string;
  peopleSaidMeToo: string;
  remove: string;
  checkingImg: string;
  notAllowed: string;
  uploadFailed: string;
  nothingHere: string;
  newSecrets: string;
  someoneSharing: string;
  activeNow: string;
  meToo: string;
  meTooed: string;
  youAreNotAlone: string;
  shareCityLabel: string;
  shareCityHelp: string;
  somewhereInWorld: string;
  someoneIn: string;
  whenLabel: string;
  postNow: string;
  post24h: string;
  post7d: string;
  scheduleHelp: string;
  pendingTitle: string;
  pendingHelp: string;
  cancel: string;
  rateLimited: string;
  captchaFailed: string;
  dailyLink: string;
};

const en: Strings = {
  title: 'THE SECRET BOX',
  tagline: 'you are not alone',
  read: 'READ',
  share: 'SHARE',
  showTruth: "✦ SHOW ME SOMEONE'S TRUTH",
  all: 'ALL',
  howFeeling: 'HOW ARE YOU FEELING RIGHT NOW?',
  anonymous: 'Anonymous. No account. No trace.',
  justTruth: 'Just your truth.',
  permanent: 'Once shared, secrets are permanent. Never include your name, email, or phone number. Images must not show recognizable faces.',
  placeholder: 'your secret... (Ctrl+Enter to submit)',
  addImage: '+ ADD AN IMAGE (optional)',
  release: 'RELEASE IT',
  sending: 'SENDING...',
  checkingImage: 'CHECKING IMAGE...',
  outThere: "it's out there now",
  lessAlone: 'someone will feel less alone because of you',
  sayMore: 'do you want to say more?',
  morePlaceholder: "there's more space here if you need it...",
  noDone: "NO, I'M DONE",
  releaseThis: 'RELEASE THIS TOO',
  heard: "you've been heard",
  courage: 'that took courage',
  readOthers: 'READ THE OTHERS',
  next: '→ NEXT',
  feltThis: 'me too',
  copy: '⧉ COPY',
  copied: '✓ COPIED',
  mostFelt: '✦ MOST FELT THIS WEEK',
  secretsShared: 'secrets shared',
  peopleSaidMeToo: 'people said me too',
  remove: 'REMOVE',
  checkingImg: 'checking image...',
  notAllowed: 'That image cannot be shared here.',
  uploadFailed: 'Upload failed. Try another image.',
  nothingHere: 'Nothing here yet.',
  newSecrets: 'new secrets — tap to load',
  someoneSharing: 'someone is sharing right now',
  activeNow: 'active now',
  meToo: 'me too',
  meTooed: '✓ me too',
  youAreNotAlone: 'you are not alone — {n} others share this',
  shareCityLabel: 'share my city',
  shareCityHelp: 'shows as "someone in {city}". never your IP, never stored beyond city name.',
  somewhereInWorld: 'somewhere in the world',
  someoneIn: 'someone in {city}',
  whenLabel: 'WHEN',
  postNow: 'post now',
  post24h: 'in 24 hours',
  post7d: 'in 7 days',
  scheduleHelp: 'time-released secrets sit until release. cancel anytime from this device.',
  pendingTitle: 'YOUR QUEUED SECRETS',
  pendingHelp: 'these will release on their own. tap to cancel.',
  cancel: 'CANCEL',
  rateLimited: 'too many secrets. please come back later.',
  captchaFailed: "couldn't verify you're human. please try again.",
  dailyLink: '✦ DAILY DROP',
};

const es: Strings = {
  ...en,
  tagline: 'no estás solo',
  read: 'LEER', share: 'COMPARTIR',
  showTruth: '✦ MUÉSTRAME LA VERDAD DE ALGUIEN',
  all: 'TODO', howFeeling: '¿CÓMO TE SIENTES AHORA MISMO?',
  anonymous: 'Anónimo. Sin cuenta. Sin rastro.',
  justTruth: 'Solo tu verdad.',
  permanent: 'Una vez compartido, los secretos son permanentes. Nunca incluyas tu nombre, email o teléfono. Las imágenes no deben mostrar rostros reconocibles.',
  placeholder: 'tu secreto...', addImage: '+ AGREGAR UNA IMAGEN (opcional)',
  release: 'LIBERARLO', sending: 'ENVIANDO...', checkingImage: 'VERIFICANDO IMAGEN...',
  outThere: 'ya está ahí fuera', lessAlone: 'alguien se sentirá menos solo gracias a ti',
  sayMore: '¿quieres decir más?', morePlaceholder: 'hay más espacio aquí si lo necesitas...',
  noDone: 'NO, YA TERMINÉ', releaseThis: 'LIBERAR ESTO TAMBIÉN',
  heard: 'has sido escuchado', courage: 'eso requirió valentía',
  readOthers: 'LEER LOS DEMÁS', next: '→ SIGUIENTE',
  feltThis: 'yo también', copy: '⧉ COPIAR', copied: '✓ COPIADO',
  mostFelt: '✦ MÁS SENTIDO ESTA SEMANA',
  secretsShared: 'secretos compartidos', peopleSaidMeToo: 'personas dijeron yo también',
  remove: 'ELIMINAR', checkingImg: 'verificando imagen...',
  notAllowed: 'Esa imagen no se puede compartir aquí.',
  uploadFailed: 'Error al subir. Intenta con otra imagen.',
  nothingHere: 'Nada aquí todavía.',
  newSecrets: 'nuevos secretos — toca para cargar',
  someoneSharing: 'alguien está compartiendo ahora', activeNow: 'activo ahora',
  meToo: 'yo también', meTooed: '✓ yo también',
  youAreNotAlone: 'no estás solo — {n} más sienten lo mismo',
  shareCityLabel: 'compartir mi ciudad',
  shareCityHelp: 'aparece como "alguien en {city}". nunca tu IP, sólo el nombre de la ciudad.',
  somewhereInWorld: 'en algún lugar del mundo',
  someoneIn: 'alguien en {city}',
  whenLabel: 'CUÁNDO', postNow: 'publicar ahora', post24h: 'en 24 horas', post7d: 'en 7 días',
  scheduleHelp: 'los secretos programados esperan hasta su hora. cancela desde este dispositivo.',
  pendingTitle: 'TUS SECRETOS EN COLA',
  pendingHelp: 'se publicarán solos. toca para cancelar.',
  cancel: 'CANCELAR',
  rateLimited: 'demasiados secretos. vuelve más tarde.',
  captchaFailed: 'no pudimos verificarte. inténtalo de nuevo.',
  dailyLink: '✦ DROP DIARIO',
};

const pt: Strings = {
  ...en,
  tagline: 'você não está sozinho',
  read: 'LER', share: 'COMPARTILHAR',
  showTruth: '✦ ME MOSTRE A VERDADE DE ALGUÉM',
  all: 'TUDO', howFeeling: 'COMO VOCÊ ESTÁ SE SENTINDO AGORA?',
  anonymous: 'Anônimo. Sem conta. Sem rastro.',
  justTruth: 'Apenas sua verdade.',
  permanent: 'Uma vez compartilhados, os segredos são permanentes. Nunca inclua seu nome, email ou telefone. As imagens não devem mostrar rostos reconhecíveis.',
  placeholder: 'seu segredo...', addImage: '+ ADICIONAR UMA IMAGEM (opcional)',
  release: 'LIBERAR', sending: 'ENVIANDO...', checkingImage: 'VERIFICANDO IMAGEM...',
  outThere: 'já está lá fora', lessAlone: 'alguém vai se sentir menos sozinho por sua causa',
  sayMore: 'você quer dizer mais?', morePlaceholder: 'há mais espaço aqui se precisar...',
  noDone: 'NÃO, JÁ TERMINEI', releaseThis: 'LIBERAR ISSO TAMBÉM',
  heard: 'você foi ouvido', courage: 'isso exigiu coragem',
  readOthers: 'LER OS OUTROS', next: '→ PRÓXIMO',
  feltThis: 'eu também', copy: '⧉ COPIAR', copied: '✓ COPIADO',
  mostFelt: '✦ MAIS SENTIDO ESTA SEMANA',
  secretsShared: 'segredos compartilhados', peopleSaidMeToo: 'pessoas disseram eu também',
  remove: 'REMOVER', checkingImg: 'verificando imagem...',
  notAllowed: 'Essa imagem não pode ser compartilhada aqui.',
  uploadFailed: 'Falha no upload. Tente outra imagem.',
  nothingHere: 'Nada aqui ainda.',
  newSecrets: 'novos segredos — toque para carregar',
  someoneSharing: 'alguém está compartilhando agora', activeNow: 'ativo agora',
  meToo: 'eu também', meTooed: '✓ eu também',
  youAreNotAlone: 'você não está sozinho — {n} sentem o mesmo',
  shareCityLabel: 'compartilhar minha cidade',
  shareCityHelp: 'aparece como "alguém em {city}". nunca seu IP, só o nome da cidade.',
  somewhereInWorld: 'em algum lugar do mundo',
  someoneIn: 'alguém em {city}',
  whenLabel: 'QUANDO', postNow: 'publicar agora', post24h: 'em 24 horas', post7d: 'em 7 dias',
  scheduleHelp: 'segredos programados esperam até a hora. cancele neste dispositivo.',
  pendingTitle: 'SEUS SEGREDOS NA FILA',
  pendingHelp: 'serão publicados sozinhos. toque para cancelar.',
  cancel: 'CANCELAR',
  rateLimited: 'muitos segredos. volte mais tarde.',
  captchaFailed: 'não conseguimos te verificar. tente de novo.',
  dailyLink: '✦ DROP DIÁRIO',
};

const fr: Strings = {
  ...en,
  tagline: "vous n'êtes pas seul",
  read: 'LIRE', share: 'PARTAGER',
  showTruth: "✦ MONTRE-MOI LA VÉRITÉ DE QUELQU'UN",
  all: 'TOUT', howFeeling: 'COMMENT VOUS SENTEZ-VOUS EN CE MOMENT?',
  anonymous: 'Anonyme. Sans compte. Sans trace.',
  justTruth: 'Juste votre vérité.',
  permanent: "Une fois partagés, les secrets sont permanents. N'incluez jamais votre nom, email ou téléphone. Les images ne doivent pas montrer de visages reconnaissables.",
  placeholder: 'votre secret...', addImage: '+ AJOUTER UNE IMAGE (optionnel)',
  release: 'LIBÉRER', sending: 'ENVOI...', checkingImage: 'VÉRIFICATION IMAGE...',
  outThere: "c'est là-dehors maintenant", lessAlone: 'quelqu\'un se sentira moins seul grâce à vous',
  sayMore: 'voulez-vous en dire plus?', morePlaceholder: "il y a plus d'espace ici si vous en avez besoin...",
  noDone: "NON, J'AI FINI", releaseThis: 'LIBÉRER CECI AUSSI',
  heard: 'vous avez été entendu', courage: 'cela a demandé du courage',
  readOthers: 'LIRE LES AUTRES', next: '→ SUIVANT',
  feltThis: 'moi aussi', copy: '⧉ COPIER', copied: '✓ COPIÉ',
  mostFelt: '✦ PLUS RESSENTI CETTE SEMAINE',
  secretsShared: 'secrets partagés', peopleSaidMeToo: 'personnes ont dit moi aussi',
  remove: 'SUPPRIMER', checkingImg: 'vérification image...',
  notAllowed: 'Cette image ne peut pas être partagée ici.',
  uploadFailed: 'Échec du téléchargement. Essayez une autre image.',
  nothingHere: 'Rien ici encore.',
  newSecrets: 'nouveaux secrets — appuyez pour charger',
  someoneSharing: "quelqu'un partage maintenant", activeNow: 'actif maintenant',
  meToo: 'moi aussi', meTooed: '✓ moi aussi',
  youAreNotAlone: "vous n'êtes pas seul — {n} ressentent la même chose",
  shareCityLabel: 'partager ma ville',
  shareCityHelp: "apparaît comme \"quelqu'un à {city}\". jamais votre IP, seulement le nom de la ville.",
  somewhereInWorld: 'quelque part dans le monde',
  someoneIn: "quelqu'un à {city}",
  whenLabel: 'QUAND', postNow: 'publier maintenant', post24h: 'dans 24 heures', post7d: 'dans 7 jours',
  scheduleHelp: 'les secrets programmés attendent leur heure. annulez depuis cet appareil.',
  pendingTitle: 'VOS SECRETS EN ATTENTE',
  pendingHelp: 'se publieront seuls. appuyez pour annuler.',
  cancel: 'ANNULER',
  rateLimited: 'trop de secrets. revenez plus tard.',
  captchaFailed: "impossible de vous vérifier. réessayez.",
  dailyLink: '✦ DROP QUOTIDIEN',
};

const ar: Strings = {
  ...en,
  tagline: 'لست وحدك',
  read: 'اقرأ', share: 'شارك',
  showTruth: '✦ أرني حقيقة شخص ما',
  all: 'الكل', howFeeling: 'بماذا تشعر الآن؟',
  anonymous: 'مجهول. بدون حساب. بدون أثر.',
  justTruth: 'فقط حقيقتك.',
  permanent: 'بمجرد المشاركة، تصبح الأسرار دائمة. لا تذكر اسمك أو بريدك أو هاتفك. يجب ألا تُظهر الصور وجوهًا يمكن التعرف عليها.',
  placeholder: 'سرّك...', addImage: '+ إضافة صورة (اختياري)',
  release: 'أطلقه', sending: 'جاري الإرسال...', checkingImage: 'جاري فحص الصورة...',
  outThere: 'لقد خرج للعالم الآن', lessAlone: 'سيشعر شخص ما بأنه أقل وحدة بفضلك',
  sayMore: 'هل تريد قول المزيد؟', morePlaceholder: 'هناك مساحة أكبر إن احتجت...',
  noDone: 'لا، انتهيت', releaseThis: 'أطلق هذا أيضًا',
  heard: 'لقد سُمعت', courage: 'تطلب ذلك شجاعة',
  readOthers: 'اقرأ الآخرين', next: '→ التالي',
  feltThis: 'وأنا أيضًا', copy: '⧉ نسخ', copied: '✓ تم النسخ',
  mostFelt: '✦ الأكثر إحساسًا هذا الأسبوع',
  secretsShared: 'أسرار مشاركة', peopleSaidMeToo: 'قالوا وأنا أيضًا',
  remove: 'إزالة', checkingImg: 'جاري الفحص...',
  notAllowed: 'لا يمكن مشاركة هذه الصورة هنا.',
  uploadFailed: 'فشل الرفع. جرّب صورة أخرى.',
  nothingHere: 'لا شيء هنا بعد.',
  newSecrets: 'أسرار جديدة — اضغط للتحميل',
  someoneSharing: 'شخص ما يشارك الآن', activeNow: 'نشط الآن',
  meToo: 'وأنا أيضًا', meTooed: '✓ وأنا أيضًا',
  youAreNotAlone: 'لست وحدك — {n} يشاركونك هذا الشعور',
  shareCityLabel: 'مشاركة مدينتي',
  shareCityHelp: 'يظهر كـ "شخص في {city}". لا يُحفظ عنوان IP، اسم المدينة فقط.',
  somewhereInWorld: 'في مكان ما في العالم',
  someoneIn: 'شخص في {city}',
  whenLabel: 'متى', postNow: 'انشر الآن', post24h: 'بعد 24 ساعة', post7d: 'بعد 7 أيام',
  scheduleHelp: 'الأسرار المجدولة تنتظر حتى وقتها. ألغِ من هذا الجهاز.',
  pendingTitle: 'أسرارك في الانتظار',
  pendingHelp: 'ستُنشر تلقائيًا. اضغط للإلغاء.',
  cancel: 'إلغاء',
  rateLimited: 'أسرار كثيرة. عُد لاحقًا.',
  captchaFailed: 'تعذر التحقق منك. حاول مجددًا.',
  dailyLink: '✦ الإصدار اليومي',
};

const hi: Strings = {
  ...en,
  tagline: 'आप अकेले नहीं हैं',
  read: 'पढ़ें', share: 'साझा करें',
  showTruth: '✦ किसी का सच दिखाओ',
  all: 'सब', howFeeling: 'अभी आप कैसा महसूस कर रहे हैं?',
  anonymous: 'गुमनाम. कोई खाता नहीं. कोई निशान नहीं.',
  justTruth: 'केवल आपका सच.',
  permanent: 'एक बार साझा करने के बाद, राज़ स्थायी हैं। अपना नाम, ईमेल या फ़ोन कभी न डालें। छवियाँ पहचानने योग्य चेहरे न दिखाएँ।',
  placeholder: 'आपका राज़...', addImage: '+ छवि जोड़ें (वैकल्पिक)',
  release: 'छोड़ दो', sending: 'भेज रहे हैं...', checkingImage: 'छवि की जाँच...',
  outThere: 'अब यह बाहर है', lessAlone: 'किसी को कम अकेलापन महसूस होगा आपकी वजह से',
  sayMore: 'और कुछ कहना चाहेंगे?', morePlaceholder: 'यहाँ और जगह है यदि आपको चाहिए...',
  noDone: 'नहीं, हो गया', releaseThis: 'इसे भी छोड़ दो',
  heard: 'आपको सुना गया', courage: 'इसमें साहस लगा',
  readOthers: 'दूसरों को पढ़ें', next: '→ अगला',
  feltThis: 'मैं भी', copy: '⧉ कॉपी', copied: '✓ कॉपी हुआ',
  mostFelt: '✦ इस सप्ताह सबसे महसूस किया गया',
  secretsShared: 'राज़ साझा किए गए', peopleSaidMeToo: 'लोगों ने कहा मैं भी',
  remove: 'हटाएँ', checkingImg: 'जाँच हो रही है...',
  notAllowed: 'यह छवि यहाँ साझा नहीं हो सकती.',
  uploadFailed: 'अपलोड विफल. दूसरी छवि आज़माएँ.',
  nothingHere: 'अभी यहाँ कुछ नहीं.',
  newSecrets: 'नए राज़ — लोड करने के लिए टैप करें',
  someoneSharing: 'अभी कोई साझा कर रहा है', activeNow: 'अभी सक्रिय',
  meToo: 'मैं भी', meTooed: '✓ मैं भी',
  youAreNotAlone: 'आप अकेले नहीं हैं — {n} और भी यही महसूस करते हैं',
  shareCityLabel: 'मेरा शहर साझा करें',
  shareCityHelp: '"{city} में कोई" के रूप में दिखता है. आपका IP कभी नहीं, सिर्फ़ शहर का नाम.',
  somewhereInWorld: 'दुनिया में कहीं',
  someoneIn: '{city} में कोई',
  whenLabel: 'कब', postNow: 'अभी पोस्ट करें', post24h: '24 घंटे में', post7d: '7 दिनों में',
  scheduleHelp: 'अनुसूचित राज़ अपने समय की प्रतीक्षा करते हैं. इस डिवाइस से रद्द करें.',
  pendingTitle: 'आपके कतार में राज़',
  pendingHelp: 'खुद ही प्रकाशित होंगे. रद्द करने के लिए टैप करें.',
  cancel: 'रद्द करें',
  rateLimited: 'बहुत सारे राज़. बाद में आएँ.',
  captchaFailed: 'सत्यापन नहीं हो सका. फिर से कोशिश करें.',
  dailyLink: '✦ दैनिक ड्रॉप',
};

const zh: Strings = {
  ...en,
  tagline: '你并不孤单',
  read: '阅读', share: '分享',
  showTruth: '✦ 让我看看某人的真心话',
  all: '全部', howFeeling: '此刻你感觉如何？',
  anonymous: '匿名。无账户。无踪迹。',
  justTruth: '只有你的真相。',
  permanent: '一旦分享，秘密就是永久的。请勿包含姓名、邮箱或电话。图片不得显示可识别的面孔。',
  placeholder: '你的秘密...', addImage: '+ 添加图片（可选）',
  release: '释放它', sending: '发送中...', checkingImage: '正在检查图片...',
  outThere: '它已经在世上了', lessAlone: '有人会因你而觉得不那么孤单',
  sayMore: '想再说一些吗？', morePlaceholder: '这里还有空间，如果你需要...',
  noDone: '不，我说完了', releaseThis: '把这个也释放',
  heard: '你被听见了', courage: '这需要勇气',
  readOthers: '读别人的', next: '→ 下一个',
  feltThis: '我也是', copy: '⧉ 复制', copied: '✓ 已复制',
  mostFelt: '✦ 本周最有共鸣',
  secretsShared: '已分享的秘密', peopleSaidMeToo: '人说我也是',
  remove: '移除', checkingImg: '正在检查...',
  notAllowed: '此图片不能在此分享。',
  uploadFailed: '上传失败。换一张图试试。',
  nothingHere: '这里还没有东西。',
  newSecrets: '新的秘密 — 点击加载',
  someoneSharing: '有人正在分享', activeNow: '当前在线',
  meToo: '我也是', meTooed: '✓ 我也是',
  youAreNotAlone: '你不孤单 — {n} 个人也有同样感受',
  shareCityLabel: '分享我的城市',
  shareCityHelp: '显示为"{city}的某人"。从不存IP，只存城市名。',
  somewhereInWorld: '世界某处',
  someoneIn: '{city}的某人',
  whenLabel: '何时', postNow: '现在发布', post24h: '24小时后', post7d: '7天后',
  scheduleHelp: '定时秘密会等到时间。可从此设备取消。',
  pendingTitle: '你排队中的秘密',
  pendingHelp: '它们会自动发布。点击取消。',
  cancel: '取消',
  rateLimited: '秘密太多。请稍后再来。',
  captchaFailed: '无法验证你是真人。请再试一次。',
  dailyLink: '✦ 每日精选',
};

export const t: Record<Lang, Strings> = { en, es, pt, fr, ar, hi, zh };
