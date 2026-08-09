#!/usr/bin/env python3
"""Build a vertical explainer video from a script profile in scripts/.

Pipeline:
  1. Piper TTS per segment (+ optional pitch shift) -> wav + measured durations
  2. Word-level timing estimate -> timeline.json for the HTML stage
  3. Soft lo-fi background music synthesized with numpy
  4. node render.js pipes JPEG frames straight into ffmpeg (H.264)
  5. ffmpeg muxes video + voice + music into output.mp4

Usage:  python3 build.py [--profile business|bankruptcy] [--voice path/to/model.onnx] [--skip-render]
"""
import argparse
import importlib
import json
import math
import os
import struct
import subprocess
import sys
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
FPS = 30
SR = 22050          # piper medium models output 22050 Hz
LEAD = 0.45         # scene pops in this many seconds before speech
TAIL = 0.35         # ...and lingers after it
INTRO = 0.6
OUTRO = 1.4

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


def synth(voice_model, voice_opts, text, path):
    cmd = [sys.executable, '-m', 'piper', '-m', voice_model, '-f', path]
    if 'length_scale' in voice_opts:
        cmd += ['--length-scale', str(voice_opts['length_scale'])]
    if 'noise_scale' in voice_opts:
        cmd += ['--noise-scale', str(voice_opts['noise_scale'])]
    if 'noise_w_scale' in voice_opts:
        cmd += ['--noise-w-scale', str(voice_opts['noise_w_scale'])]
    if 'sentence_silence' in voice_opts:
        cmd += ['--sentence-silence', str(voice_opts['sentence_silence'])]
    subprocess.run(cmd, input=text.encode(), check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    semitones = voice_opts.get('pitch_semitones', 0)
    if semitones:
        factor = 2 ** (semitones / 12)
        tmp = path + '.pitch.wav'
        subprocess.run([
            'ffmpeg', '-y', '-v', 'error', '-i', path,
            '-af', f'rubberband=pitch={factor}:formant=preserved', tmp,
        ], check=True)
        os.replace(tmp, path)


def build_timeline(out_dir, segs, voice_model, voice_opts):
    os.makedirs(out_dir, exist_ok=True)
    t = INTRO
    segments = []
    seg_wavs = []
    for i, s in enumerate(segs):
        wav_path = os.path.join(out_dir, f'seg_{i:02d}.wav')
        if not os.path.exists(wav_path):
            synth(voice_model, voice_opts, s['tts'], wav_path)
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
            scene['itemAt'] = [round(words[wi]['t'] - scene_start, 3) for wi in s['cycle_words']]
        if 'rows_words' in s:
            scene['rowAt'] = [round(words[wi]['t'] - scene_start, 3) for wi in s['rows_words']]

        segments.append(dict(start=round(t, 3), end=round(t + dur, 3),
                             lead=LEAD, tail=TAIL, pose=s['pose'],
                             brows=s['brows'], smile=s['smile'],
                             scene=scene, phrases=phrases))
        t += dur + s['pause']

    total = t + OUTRO
    return dict(fps=FPS, total=round(total, 3), segments=segments), seg_wavs, total


def np_write_wav(path, arr, sr):
    import numpy as np
    arr = np.clip(arr, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((arr * 32767).astype('<i2').tobytes())


def assemble_voice(out_dir, seg_wavs, total):
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
    out = os.path.join(out_dir, 'voice.wav')
    np_write_wav(out, track, SR)
    return out


NOTES = {'C2': 65.41, 'A2': 110.0, 'F2': 87.31, 'G2': 98.0}
CHORDS = [  # (bass, chord tones in Hz)
    ('C2', [261.63, 329.63, 392.0, 493.88]),    # Cmaj7
    ('A2', [220.0, 261.63, 329.63, 392.0]),     # Am7
    ('F2', [174.61, 220.0, 261.63, 329.63]),    # Fmaj7
    ('G2', [196.0, 246.94, 293.66, 392.0]),     # G7-ish
]


def make_music(out_dir, total, mood=None):
    """Very quiet pad + bass + hats so the voice track breathes.
    mood='serious' -> slower tempo, minor-leaning voicings, sparser hats."""
    import numpy as np
    sr = 44100
    n = int((total + 1) * sr)
    t = np.arange(n) / sr
    out = np.zeros(n, dtype=np.float32)
    bpm = 74 if mood == 'serious' else 84
    beat = 60 / bpm
    bar = beat * 4
    nbars = int(math.ceil((total + 1) / bar))
    rng = np.random.default_rng(7)
    chords = ([('A2', [220.0, 261.63, 311.13, 392.0]),   # Am
               ('F2', [174.61, 220.0, 261.63, 329.63]),  # Fmaj7
               ('C2', [261.63, 311.13, 392.0, 466.16]),  # Cm-ish (dark)
               ('G2', [196.0, 233.08, 293.66, 349.23])]  # Gm
              if mood == 'serious' else CHORDS)
    pad_level = 0.12 if mood == 'serious' else 0.16
    hat_level = 0.03 if mood == 'serious' else 0.05

    for b in range(nbars):
        bass_name, tones = chords[b % 4]
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
        out[i0:i1] += pad * env * pad_level

        for beat_i in (0, 2):
            bt0 = t0 + beat_i * beat
            j0 = int(bt0 * sr)
            j1 = min(j0 + int(0.5 * sr), n)
            if j0 >= n:
                continue
            bt = np.arange(j1 - j0) / sr
            out[j0:j1] += np.sin(2 * np.pi * NOTES[bass_name] * bt) * np.exp(-bt * 5) * 0.22
            out[j0:j1] += np.sin(2 * np.pi * (95 - 55 * np.clip(bt * 8, 0, 1)) * bt) * np.exp(-bt * 24) * 0.18

        hat_steps = (0, 4) if mood == 'serious' else range(8)
        for eighth in hat_steps:
            if mood != 'serious' and eighth % 2 == 0:
                continue
            ht0 = t0 + eighth * beat / 2
            j0 = int(ht0 * sr)
            j1 = min(j0 + int(0.04 * sr), n)
            if j0 >= n:
                continue
            noise = rng.standard_normal(j1 - j0)
            noise = np.diff(noise, prepend=0)
            out[j0:j1] += noise * np.exp(-np.arange(j1 - j0) / sr * 90) * hat_level

    fade = int(1.5 * sr)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    peak = np.abs(out).max()
    if peak > 0:
        out *= 0.5 / peak
    path = os.path.join(out_dir, 'music.wav')
    np_write_wav(path, out, sr)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--profile', default='business',
                     help='name of a module in scripts/ (business, bankruptcy, ...)')
    ap.add_argument('--voice', default=os.environ.get(
        'PIPER_VOICE', os.path.join(HERE, 'ru-irinia-medium.onnx')))
    ap.add_argument('--skip-render', action='store_true')
    ap.add_argument('--skip-audio', action='store_true')
    args = ap.parse_args()

    mod = importlib.import_module(f'scripts.{args.profile}')
    segs, profile, voice_opts = mod.SEGS, getattr(mod, 'PROFILE', {}), getattr(mod, 'VOICE', {})
    out_dir = os.path.join(HERE, 'out') if args.profile == 'business' \
        else os.path.join(HERE, 'out', args.profile)

    print(f'== profile: {args.profile} ({getattr(mod, "TITLE", "")})')
    print('== 1/5 TTS + timeline')
    timeline, seg_wavs, total = build_timeline(out_dir, segs, args.voice, voice_opts)
    timeline['profile'] = profile
    with open(os.path.join(out_dir, 'timeline.json'), 'w') as f:
        json.dump(timeline, f, ensure_ascii=False, indent=1)
    print(f'   total: {total:.1f}s, {len(timeline["segments"])} segments')

    if not args.skip_audio:
        print('== 2/5 voice track')
        assemble_voice(out_dir, seg_wavs, total)
        print('== 3/5 music')
        make_music(out_dir, total, mood=profile.get('musicMood') if profile else None)

    if not args.skip_render:
        print('== 4/5 rendering frames -> h264')
        subprocess.run(['node', os.path.join(HERE, 'render.js'), '--out', out_dir], check=True)

        print('== 5/5 mux')
        subprocess.run([
            'ffmpeg', '-y', '-v', 'error',
            '-i', os.path.join(out_dir, 'video_noaudio.mp4'),
            '-i', os.path.join(out_dir, 'voice.wav'),
            '-i', os.path.join(out_dir, 'music.wav'),
            '-filter_complex',
            '[1:a]aresample=44100,volume=1.0[v];'
            '[2:a]volume=0.32[m];'
            '[v][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]',
            '-map', '0:v', '-map', '[a]',
            '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100',
            '-movflags', '+faststart',
            os.path.join(out_dir, 'output.mp4')], check=True)
        print('done:', os.path.join(out_dir, 'output.mp4'))


if __name__ == '__main__':
    main()
