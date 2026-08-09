#!/usr/bin/env python3
"""Build the vertical explainer video «Как построить успешный бизнес?».

Pipeline:
  1. Piper TTS per segment  ->  per-segment wav + measured durations
  2. Word-level timing estimate -> timeline.json for the HTML stage
  3. Soft lo-fi background music synthesized with numpy
  4. node render.js pipes JPEG frames straight into ffmpeg (H.264)
  5. ffmpeg muxes video + voice + music into output.mp4

Usage:  python3 build.py [--voice path/to/model.onnx] [--skip-render]
"""
import argparse
import json
import math
import os
import struct
import subprocess
import sys
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
FPS = 30
SR = 22050          # piper medium models output 22050 Hz
LEAD = 0.45         # scene pops in this many seconds before speech
TAIL = 0.35         # ...and lingers after it
INTRO = 0.6
OUTRO = 1.4

# ---------------------------------------------------------------------------
# The script, split into TTS units. Phrases: (first_word, last_word_excl,
# {highlighted word indices}). Word indices ignore pure-punctuation tokens.
# ---------------------------------------------------------------------------
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

PUNCT = '«»"“”…'


def tokenize(tts):
    """Return display tokens with pause weights. Pure punctuation tokens
    (like a standalone em dash) fold their pause into the previous word."""
    words = []
    for raw in tts.split():
        core = raw.strip(PUNCT)
        if all(not c.isalnum() for c in core):
            if words:
                words[-1]['w'] += 1.6   # em dash / colon pause
            continue
        weight = len(core) + 0.7
        if core[-1] in ',:;':
            weight += 1.4
        elif core[-1] in '.?!':
            weight += 0.8
        display = core.rstrip('.,:;').upper()
        words.append(dict(text=display, w=weight))
    return words


def wav_duration(path):
    with wave.open(path, 'rb') as w:
        return w.getnframes() / w.getframerate()


def synth(voice, text, path):
    subprocess.run([sys.executable, '-m', 'piper', '-m', voice, '-f', path],
                   input=text.encode(), check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def build_timeline(voice):
    os.makedirs(OUT, exist_ok=True)
    t = INTRO
    segments = []
    seg_wavs = []
    for i, s in enumerate(SEGS):
        wav_path = os.path.join(OUT, f'seg_{i:02d}.wav')
        if not os.path.exists(wav_path):
            synth(voice, s['tts'], wav_path)
        dur = wav_duration(wav_path)
        seg_wavs.append((wav_path, t, dur))

        words = tokenize(s['tts'])
        speech = max(dur - 0.12, 0.1)          # trim trailing pad
        total_w = sum(w['w'] for w in words)
        cum = 0.0
        for w in words:
            w['t'] = round(t + cum / total_w * speech, 3)
            w['d'] = round(w['w'] / total_w * speech, 3)
            cum += w['w']

        phrases = []
        for pi, (a, b, hl) in enumerate(s['phrases']):
            ph_words = []
            for wi in range(a, b):
                w = words[wi]
                ph_words.append(dict(text=w['text'], t=w['t'], d=w['d'],
                                     hl=wi in hl))
            start = words[a]['t']
            end = (words[s['phrases'][pi + 1][0]]['t']
                   if pi + 1 < len(s['phrases']) else t + dur)
            chars = sum(len(w['text']) + 1 for w in ph_words)
            fs = 56 if chars <= 22 else 50 if chars <= 30 else 44 if chars <= 40 else 40
            phrases.append(dict(key=pi, start=round(start, 3), end=round(end, 3),
                                fs=fs, words=ph_words))

        scene = dict(s['scene'])
        scene_start = t - LEAD
        if 'chain_words' in s:
            for st, wi in zip(scene['steps'], s['chain_words']):
                st['at'] = round(words[wi]['t'] - scene_start, 3)
        if 'cycle_words' in s:
            # cycle items reveal on their spoken word
            base = [round(words[wi]['t'] - scene_start, 3) for wi in s['cycle_words']]
            scene['itemAt'] = base

        segments.append(dict(start=round(t, 3), end=round(t + dur, 3),
                             lead=LEAD, tail=TAIL, pose=s['pose'],
                             brows=s['brows'], smile=s['smile'],
                             scene=scene, phrases=phrases))
        t += dur + s['pause']

    total = t + OUTRO
    timeline = dict(fps=FPS, total=round(total, 3), segments=segments)
    with open(os.path.join(OUT, 'timeline.json'), 'w') as f:
        json.dump(timeline, f, ensure_ascii=False, indent=1)
    return timeline, seg_wavs, total


def write_wav(path, samples, sr=SR):
    clipped = [max(-1.0, min(1.0, x)) for x in samples]
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(b''.join(struct.pack('<h', int(x * 32767)) for x in clipped))


def assemble_voice(seg_wavs, total):
    import numpy as np
    track = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for path, start, _dur in seg_wavs:
        with wave.open(path, 'rb') as w:
            data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        i0 = int(start * SR)
        track[i0:i0 + len(data)] += data.astype(np.float32) / 32768.0
    peak = np.abs(track).max()
    if peak > 0:
        track *= 0.92 / peak
    out = os.path.join(OUT, 'voice.wav')
    np_write_wav(out, track, SR)
    return out


def np_write_wav(path, arr, sr):
    import numpy as np
    arr = np.clip(arr, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((arr * 32767).astype('<i2').tobytes())


NOTES = {'C2': 65.41, 'A2': 110.0, 'F2': 87.31, 'G2': 98.0}
CHORDS = [  # (bass, chord tones in Hz)
    ('C2', [261.63, 329.63, 392.0, 493.88]),    # Cmaj7
    ('A2', [220.0, 261.63, 329.63, 392.0]),     # Am7
    ('F2', [174.61, 220.0, 261.63, 329.63]),    # Fmaj7
    ('G2', [196.0, 246.94, 293.66, 392.0]),     # G7-ish
]


def make_music(total):
    """Very quiet lo-fi pad + bass + hats so the voice track breathes."""
    import numpy as np
    sr = 44100
    n = int((total + 1) * sr)
    t = np.arange(n) / sr
    out = np.zeros(n, dtype=np.float32)
    bpm = 84
    beat = 60 / bpm
    bar = beat * 4
    nbars = int(math.ceil((total + 1) / bar))
    rng = np.random.default_rng(7)

    for b in range(nbars):
        bass_name, tones = CHORDS[b % 4]
        t0 = b * bar
        i0, i1 = int(t0 * sr), min(int((t0 + bar) * sr), n)
        if i0 >= n:
            break
        seg_t = t[i0:i1] - t0
        env = np.minimum(seg_t / 0.9, 1.0) * np.minimum((bar - seg_t) / 0.9, 1.0)
        env = np.clip(env, 0, 1)
        pad = np.zeros_like(seg_t)
        for k, f in enumerate(tones):
            det = 1 + (k - 1.5) * 0.0012
            pad += np.sin(2 * np.pi * f * det * seg_t + k) / (k + 2)
        out[i0:i1] += pad * env * 0.16

        for beat_i in (0, 2):
            bt0 = t0 + beat_i * beat
            j0 = int(bt0 * sr)
            j1 = min(j0 + int(0.5 * sr), n)
            if j0 >= n:
                continue
            bt = np.arange(j1 - j0) / sr
            out[j0:j1] += np.sin(2 * np.pi * NOTES[bass_name] * bt) * np.exp(-bt * 5) * 0.22
            # soft kick thump
            out[j0:j1] += np.sin(2 * np.pi * (95 - 55 * np.clip(bt * 8, 0, 1)) * bt) * np.exp(-bt * 24) * 0.18

        for eighth in range(8):
            if eighth % 2 == 0:
                continue
            ht0 = t0 + eighth * beat / 2
            j0 = int(ht0 * sr)
            j1 = min(j0 + int(0.04 * sr), n)
            if j0 >= n:
                continue
            noise = rng.standard_normal(j1 - j0)
            noise = np.diff(noise, prepend=0)          # crude highpass
            out[j0:j1] += noise * np.exp(-np.arange(j1 - j0) / sr * 90) * 0.05

    fade = int(1.5 * sr)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    peak = np.abs(out).max()
    if peak > 0:
        out *= 0.5 / peak
    path = os.path.join(OUT, 'music.wav')
    np_write_wav(path, out, sr)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', default=os.environ.get(
        'PIPER_VOICE', os.path.join(HERE, 'ru-irinia-medium.onnx')))
    ap.add_argument('--skip-render', action='store_true')
    ap.add_argument('--skip-audio', action='store_true')
    args = ap.parse_args()

    print('== 1/5 TTS + timeline')
    timeline, seg_wavs, total = build_timeline(args.voice)
    print(f'   total: {total:.1f}s, {len(timeline["segments"])} segments')

    if not args.skip_audio:
        print('== 2/5 voice track')
        assemble_voice(seg_wavs, total)
        print('== 3/5 music')
        make_music(total)

    if not args.skip_render:
        print('== 4/5 rendering frames -> h264')
        subprocess.run(['node', os.path.join(HERE, 'render.js')], check=True)

        print('== 5/5 mux')
        subprocess.run([
            'ffmpeg', '-y', '-v', 'error',
            '-i', os.path.join(OUT, 'video_noaudio.mp4'),
            '-i', os.path.join(OUT, 'voice.wav'),
            '-i', os.path.join(OUT, 'music.wav'),
            '-filter_complex',
            '[1:a]aresample=44100,volume=1.0[v];'
            '[2:a]volume=0.32[m];'
            '[v][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]',
            '-map', '0:v', '-map', '[a]',
            '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100',
            '-movflags', '+faststart',
            os.path.join(OUT, 'output.mp4')], check=True)
        print('done:', os.path.join(OUT, 'output.mp4'))


if __name__ == '__main__':
    main()
