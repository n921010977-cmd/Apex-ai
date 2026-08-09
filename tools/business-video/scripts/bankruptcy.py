"""Профиль «Как не обанкротить свой бизнес?»

Другой персонаж (зрелый финансовый консультант — очки, короткая тёмная
причёска с сединой на висках, чисто выбрит, тёмно-синий пиджак с галстуком
вместо бороды и бежевой рубашки), другая — более сдержанная и настороженная
— подача: медленнее темп речи, ниже тембр, весомее паузы, меньше улыбок и
энергичных жестов, больше «think»/«shrug»/предупреждающего «point». Палитра
сцены сдвинута от жёлто-синей мотивационной к тревожно-янтарной: акцент —
глубокий сине-стальной, подсветка слов — янтарная, а не жёлтая.
"""

TITLE = 'Как не обанкротить свой бизнес?'

PROFILE = dict(
    # --- сцена: тревожно-деловая палитра вместо жёлто-синей ---
    accent='#2E5F8A', accentShadow='rgba(46,95,138,.35)',
    danger='#E43F48', dangerShadow='rgba(228,63,72,.35)', dangerBadgeShadow='rgba(228,63,72,.4)',
    safe='#1FA25E', safeShadow='rgba(31,162,94,.35)', safeBadgeShadow='rgba(31,162,94,.4)',
    highlight='#FFB020', highlightShadow='rgba(255,176,32,.4)',
    gridColor='rgba(140,150,168,.85)',
    # --- персонаж: зрелый консультант, не бородатый парень в фланели ---
    skin='#D9A579', skinSh='#C3915F',
    hair='#232427', hairStyle='short', grey='#9AA0A8',
    beard=False,
    tee='#F4F6F8',
    shirt='#1F3A5A', shirtSh='#152A40', shirtLn='#12233A',
    glasses=True,
    tie='#7A2333', tieDark='#5C1A26',
    musicMood='serious',
)

VOICE = dict(
    length_scale=1.08,      # чуть медленнее — весомее, без спешки
    noise_scale=0.55,       # ровнее, без «бубнящей» вариативности
    noise_w_scale=0.7,
    sentence_silence=0.15,  # более тяжёлые паузы между фразами
    pitch_semitones=-2.0,   # ниже и суше — тон предостережения, а не восторга
)

SEGS = [
    dict(tts='Как не обанкротить свой бизнес?',
         phrases=[(0, 2, set()), (2, 5, {2})], pause=0.55,
         pose='think', brows='knit', smile=False,
         scene=dict(type='sticker', emoji='📉', no=True, size=210,
                    label='риск банкротства', labelStyle='red', rot=-4)),

    dict(tts='Первое правило — не трать больше, чем зарабатываешь.',
         phrases=[(0, 2, {0}), (2, 7, {3, 6})], pause=0.5,
         pose='point', brows='raised', smile=False,
         scene=dict(type='sticker', emoji='💸', size=200, y=170, step='Правило 1',
                    label='трать меньше, чем зарабатываешь', rot=-4)),

    dict(tts='Многие предприниматели видят первые продажи и сразу начинают увеличивать расходы: новый офис, дорогая техника, реклама, сотрудники…',
         phrases=[(0, 5, set()), (5, 10, {8, 9}), (10, 14, set()), (14, 16, set())],
         pause=0.55, pose='shrug', brows='knit', smile=False,
         scene=dict(type='checklist', title='Расходы растут', sub='сразу после первых продаж',
                    headIcon='📈', y=100, rowGap=0.7, rows=[
                        dict(icon='🏢', bg='#ffe9e5', text='новый офис', bad=True),
                        dict(icon='💻', bg='#ffe9e5', text='дорогая техника', bad=True),
                        dict(icon='📢', bg='#ffe9e5', text='реклама', bad=True),
                        dict(icon='👥', bg='#ffe9e5', text='сотрудники', bad=True)]),
         rows_words=[10, 12, 14, 15]),

    dict(tts='А потом оказывается, что денег на развитие уже нет.',
         phrases=[(0, 3, set()), (3, 9, {4, 8})], pause=0.5,
         pose='open', brows='knit', smile=False,
         scene=dict(type='sticker', emoji='🫙', no=True, size=200,
                    label='денег не осталось', labelStyle='red', rot=4)),

    dict(tts='Второе — всегда имей финансовую подушку.',
         phrases=[(0, 1, {0}), (1, 5, {3, 4})], pause=0.5,
         pose='point', brows='raised', smile=False,
         scene=dict(type='sticker', emoji='🛡️', ok=True, size=190, y=170, step='Правило 2',
                    label='подушка на 3-6 месяцев', rot=4)),

    dict(tts='Бизнес должен пережить несколько слабых месяцев без паники.',
         phrases=[(0, 3, set()), (3, 8, {4, 7})], pause=0.55,
         pose='open', brows='normal', smile=True,
         scene=dict(type='sticker', emoji='🌤️', ok=True, size=200,
                    label='это нормально', rot=-4)),

    dict(tts='Третье — контролируй каждую цифру.',
         phrases=[(0, 1, {0}), (1, 4, {3})], pause=0.5,
         pose='point', brows='raised', smile=False,
         scene=dict(type='sticker', emoji='🧮', size=190, y=170, step='Правило 3',
                    label='контроль цифр', rot=-4)),

    dict(tts='Ты должен знать: сколько заработал, сколько потратил, сколько должен и сколько реально осталось.',
         phrases=[(0, 3, set()), (3, 5, {4}), (5, 7, {6}), (7, 9, {8}), (9, 13, {12})],
         pause=0.6, pose='open', brows='normal', smile=False,
         scene=dict(type='checklist', title='Знай свои цифры', sub='каждый месяц',
                    headIcon='🧮', y=110, rowGap=0.85, rows=[
                        dict(icon='📥', bg='#e8f8ef', text='заработал'),
                        dict(icon='📤', bg='#ffe9e5', text='потратил'),
                        dict(icon='📄', bg='#fff6e0', text='должен'),
                        dict(icon='💼', bg='#e5f1ff', text='реально осталось')]),
         rows_words=[4, 6, 8, 12]),

    dict(tts='Четвёртое — не бери большие кредиты ради красивого бизнеса.',
         phrases=[(0, 1, {0}), (1, 5, {4}), (5, 8, {6})], pause=0.5,
         pose='point', brows='knit', smile=False,
         scene=dict(type='sticker', emoji='🏦', no=True, size=200, y=170, step='Правило 4',
                    label='кредиты не спасут', labelStyle='red', rot=4)),

    dict(tts='Сначала докажи, что модель работает, и только потом масштабируйся.',
         phrases=[(0, 2, {0}), (2, 5, {4}), (5, 9, {8})], pause=0.6,
         pose='point', brows='raised', smile=False,
         scene=dict(type='chain', y=300, steps=[
             dict(text='Модель работает'), dict(text='Масштабирование')]),
         chain_words=[4, 8]),

    dict(tts='Пятое — не завись от одного клиента или одного источника дохода.',
         phrases=[(0, 1, {0}), (1, 6, {4, 5}), (6, 10, {7, 9})], pause=0.55,
         pose='point', brows='raised', smile=False,
         scene=dict(type='duo', y=140,
                    a=dict(emoji='🎯', label='один клиент'),
                    b=dict(emoji='🌐', label='разные источники'))),

    dict(tts='Потеря одного клиента не должна уничтожать весь бизнес.',
         phrases=[(0, 3, set()), (3, 8, {5, 7})], pause=0.5,
         pose='shrug', brows='knit', smile=False,
         scene=dict(type='sticker', emoji='🛡️', ok=True, size=200,
                    label='бизнес должен выжить', rot=-4)),

    dict(tts='И самое главное: не путай выручку с прибылью.',
         phrases=[(0, 3, set()), (3, 8, {5, 7})], pause=0.5,
         pose='open', brows='knit', smile=False,
         scene=dict(type='compare', y=150)),

    dict(tts='Сто тысяч рублей продаж — это ещё не сто тысяч рублей заработка.',
         phrases=[(0, 4, set()), (4, 7, {6}), (7, 11, {10})], pause=0.6,
         pose='think', brows='knit', smile=False,
         scene=dict(type='compare', y=150,
                    a=dict(emoji='🧾', label='100 000 ₽ продаж', pillClass='dark'),
                    b=dict(emoji='🪙', label='100 000 ₽ заработка', pillClass='red'))),

    dict(tts='Успешный бизнес — это не тот, который выглядит богатым.',
         phrases=[(0, 4, set()), (4, 8, {6, 7})], pause=0.45,
         pose='shrug', brows='knit', smile=False,
         scene=dict(type='quote', text='Выглядеть богатым', ok=False, emoji='🎭', y=120)),

    dict(tts='Это тот, который умеет переживать кризисы, сохранять деньги и продолжать расти.',
         phrases=[(0, 3, set()), (3, 6, {4, 5}), (6, 11, {6, 10})], pause=0.6,
         pose='fists', brows='normal', smile=True,
         scene=dict(type='checklist', title='Настоящий успех', sub='не витрина, а устойчивость',
                    headIcon='🏆', y=120, rowGap=0.85, rows=[
                        dict(icon='🌩️', bg='#e5f1ff', text='переживает кризисы'),
                        dict(icon='💰', bg='#e8f8ef', text='сохраняет деньги'),
                        dict(icon='📈', bg='#e8f8ef', text='продолжает расти')]),
         rows_words=[5, 7, 10]),

    dict(tts='Сначала — стабильность. Потом — масштабирование.',
         phrases=[(0, 2, {1}), (2, 4, {3})], pause=0.0,
         pose='open', brows='raised', smile=True,
         scene=dict(type='chain', y=340, steps=[
             dict(text='Стабильность'), dict(text='Масштабирование')]),
         chain_words=[1, 3]),
]
