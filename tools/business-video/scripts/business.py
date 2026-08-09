"""Профиль «Как построить успешный бизнес?» — исходный ролик.

PROFILE и VOICE пустые: буквально означает «используй параметры персонажа
и голоса по умолчанию», зашитые в template.html / build.py, чтобы уже
отрендеренный и закоммиченный ролик не поменялся ни на пиксель.
"""

TITLE = 'Как построить успешный бизнес?'
PROFILE = {}
VOICE = {}

SEGS = [
    dict(tts='Успешный бизнес начинается не с миллиона долларов.',
         phrases=[(0, 3, set()), (3, 7, {5, 6})], pause=0.5,
         pose='open', brows='normal', smile=False,
         scene=dict(type='sticker', emoji='💵', no=True, size=210,
                    label='миллион не нужен', labelStyle='red', rot=-4)),

    dict(tts='Он начинается с проблемы, которую ты умеешь решать.',
         phrases=[(0, 4, {3}), (4, 8, {7})], pause=0.55,
         pose='point', brows='raised', smile=True,
         scene=dict(type='sticker', emoji='🧩', size=210,
                    label='проблема = возможность', rot=4)),

    dict(tts='Первое — найди реальную потребность людей.',
         phrases=[(0, 1, {0}), (1, 5, {3})], pause=0.5,
         pose='point', brows='raised', smile=False,
         scene=dict(type='sticker', emoji='🔍', size=190, y=170, step='Шаг 1',
                    label='реальная потребность', rot=-4)),

    dict(tts='Не спрашивай: что я хочу продавать?',
         phrases=[(0, 2, set()), (2, 6, set())], pause=0.4,
         pose='think', brows='knit', smile=False,
         scene=dict(type='quote', text='Что я хочу продавать?', ok=False,
                    emoji='🤔', y=120)),

    dict(tts='Спроси: за что люди готовы платить?',
         phrases=[(0, 1, set()), (1, 6, {4, 5})], pause=0.6,
         pose='open', brows='raised', smile=True,
         scene=dict(type='quote', text='За что люди готовы платить?', ok=True,
                    emoji='💳', y=120)),

    dict(tts='Второе — создай простой продукт.',
         phrases=[(0, 1, {0}), (1, 4, {2})], pause=0.5,
         pose='point', brows='raised', smile=False,
         scene=dict(type='sticker', emoji='📦', size=190, y=170, step='Шаг 2',
                    label='простой продукт · MVP', rot=4)),

    dict(tts='Не пытайся сделать идеально с первого раза.',
         phrases=[(0, 4, {3}), (4, 7, set())], pause=0.4,
         pose='shrug', brows='knit', smile=False,
         scene=dict(type='sticker', emoji='💎', no=True, size=200,
                    label='идеально с первого раза', labelStyle='red', rot=-5)),

    dict(tts='Запусти, получи обратную связь и улучшай.',
         phrases=[(0, 6, {0, 5})], pause=0.6,
         pose='fists', brows='raised', smile=True,
         scene=dict(type='cycle', y=180, items=[
             dict(emoji='🚀', label='запусти'),
             dict(emoji='💬', label='фидбек'),
             dict(emoji='🔧', label='улучшай')]),
         cycle_words=[0, 1, 5]),

    dict(tts='Третье — научись продавать.',
         phrases=[(0, 1, {0}), (1, 3, {2})], pause=0.5,
         pose='point', brows='raised', smile=False,
         scene=dict(type='sticker', emoji='📢', size=190, y=170, step='Шаг 3',
                    label='продажи решают', rot=-4)),

    dict(tts='Даже лучший продукт не станет успешным, если о нём никто не знает.',
         phrases=[(0, 3, set()), (3, 6, set()), (6, 12, {9, 10, 11})], pause=0.55,
         pose='shrug', brows='knit', smile=False,
         scene=dict(type='sticker', emoji='🔇', size=210,
                    label='о нём молчат', rot=4)),

    dict(tts='Четвёртое — считай деньги.',
         phrases=[(0, 1, {0}), (1, 3, {1, 2})], pause=0.5,
         pose='point', brows='raised', smile=False,
         scene=dict(type='sticker', emoji='🧮', size=190, y=170, step='Шаг 4',
                    label='финансы под контролем', rot=4)),

    dict(tts='Выручка — это не прибыль.',
         phrases=[(0, 4, {2, 3})], pause=0.45,
         pose='open', brows='knit', smile=False,
         scene=dict(type='compare', y=150)),

    dict(tts='Знай свои расходы, маржу и сколько ты зарабатываешь с каждой продажи.',
         phrases=[(0, 5, {2, 3}), (5, 11, {7})], pause=0.6,
         pose='open', brows='normal', smile=False,
         scene=dict(type='checklist', title='Юнит-экономика', sub='знай свои цифры',
                    y=110, rowGap=0.9, rows=[
                        dict(icon='🧾', bg='#ffe9e5', text='расходы'),
                        dict(icon='📊', bg='#e5f1ff', text='маржа'),
                        dict(icon='💰', bg='#e8f8ef', text='прибыль с продажи')])),

    dict(tts='И главное — не сдавайся после первой неудачи.',
         phrases=[(0, 2, set()), (2, 7, {2, 3})], pause=0.5,
         pose='fists', brows='normal', smile=True,
         scene=dict(type='sticker', emoji='💪', size=210,
                    label='не сдавайся', rot=-4)),

    dict(tts='Большинство людей останавливаются там, где успешные предприниматели только начинают учиться.',
         phrases=[(0, 4, {2}), (4, 10, {8, 9})], pause=0.6,
         pose='open', brows='raised', smile=False,
         scene=dict(type='duo', y=140,
                    a=dict(emoji='🛑', label='большинство сдаётся'),
                    b=dict(emoji='🚀', label='успешные учатся'))),

    dict(tts='Запомни эту формулу: проблема, решение, продажи, анализ, улучшение.',
         phrases=[(0, 3, {2})], pause=0.65,
         pose='point', brows='raised', smile=True,
         scene=dict(type='chain', y=64, steps=[
             dict(text='Проблема'), dict(text='Решение'), dict(text='Продажи'),
             dict(text='Анализ'), dict(text='Улучшение')]),
         chain_words=[3, 4, 5, 6, 7]),

    dict(tts='Не жди идеального момента.',
         phrases=[(0, 4, {2, 3})], pause=0.35,
         pose='think', brows='knit', smile=False,
         scene=dict(type='sticker', emoji='⏳', size=200,
                    label='идеального момента нет', rot=4)),

    dict(tts='Начни с малого, но начни сегодня.',
         phrases=[(0, 3, set()), (3, 6, {4, 5})], pause=0.0,
         pose='fists', brows='raised', smile=True,
         scene=dict(type='sticker', emoji='🚀', size=220,
                    label='начни сегодня', labelStyle='green', rot=-4)),
]
