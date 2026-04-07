// Web Audio API でサウンドを生成（外部ファイル不要）

export function playCutSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const t = ctx.currentTime

    // ① 打突音：Sawtooth 1000Hz 瞬間attack→即decay（0ms）
    const strike = ctx.createOscillator()
    const strikeGain = ctx.createGain()
    strike.connect(strikeGain)
    strikeGain.connect(ctx.destination)
    strike.type = 'sawtooth'
    strike.frequency.setValueAtTime(1000, t)
    strikeGain.gain.setValueAtTime(0.5, t)
    strikeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    strike.start(t)
    strike.stop(t + 0.1)

    // ③ 重厚感：Sine 100Hz ドスッと（0ms）
    const thud = ctx.createOscillator()
    const thudGain = ctx.createGain()
    thud.connect(thudGain)
    thudGain.connect(ctx.destination)
    thud.type = 'sine'
    thud.frequency.setValueAtTime(100, t)
    thudGain.gain.setValueAtTime(0.6, t)
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    thud.start(t)
    thud.stop(t + 0.08)

    // ② 金属ビビり：ホワイトノイズ＋BandPass 3000Hz、0.6秒（50ms〜）
    const vibrateLen = ctx.sampleRate * 0.7
    const vibrateBuf = ctx.createBuffer(1, vibrateLen, ctx.sampleRate)
    const vibrateData = vibrateBuf.getChannelData(0)
    for (let i = 0; i < vibrateLen; i++) vibrateData[i] = Math.random() * 2 - 1
    const vibrateNoise = ctx.createBufferSource()
    vibrateNoise.buffer = vibrateBuf

    const bpf = ctx.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.setValueAtTime(3000, t + 0.05)
    bpf.Q.setValueAtTime(8, t + 0.05)

    const vibrateGain = ctx.createGain()
    vibrateGain.gain.setValueAtTime(0, t + 0.05)
    vibrateGain.gain.linearRampToValueAtTime(0.35, t + 0.1)
    vibrateGain.gain.setValueAtTime(0.35, t + 0.55)
    vibrateGain.gain.linearRampToValueAtTime(0, t + 0.8)

    vibrateNoise.connect(bpf)
    bpf.connect(vibrateGain)
    vibrateGain.connect(ctx.destination)
    vibrateNoise.start(t + 0.05)
    vibrateNoise.stop(t + 0.8)

    // ④ 擦り合い：ホワイトノイズ＋HighPass 2500Hz＋LFO 6Hz（100ms〜）
    const scrapeLen = ctx.sampleRate * 0.75
    const scrapeBuf = ctx.createBuffer(1, scrapeLen, ctx.sampleRate)
    const scrapeData = scrapeBuf.getChannelData(0)
    for (let i = 0; i < scrapeLen; i++) scrapeData[i] = Math.random() * 2 - 1
    const scrapeNoise = ctx.createBufferSource()
    scrapeNoise.buffer = scrapeBuf

    const hpf = ctx.createBiquadFilter()
    hpf.type = 'highpass'
    hpf.frequency.setValueAtTime(2500, t + 0.1)

    const scrapeGain = ctx.createGain()
    scrapeGain.gain.setValueAtTime(0, t + 0.1)
    scrapeGain.gain.linearRampToValueAtTime(0.25, t + 0.18)
    scrapeGain.gain.setValueAtTime(0.25, t + 0.55)
    scrapeGain.gain.linearRampToValueAtTime(0, t + 0.8)

    // LFO 6Hz で振幅変調
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(6, t + 0.1)
    lfoGain.gain.setValueAtTime(0.25, t + 0.1)
    lfo.connect(lfoGain)
    lfoGain.connect(scrapeGain.gain)

    scrapeNoise.connect(hpf)
    hpf.connect(scrapeGain)
    scrapeGain.connect(ctx.destination)
    scrapeNoise.start(t + 0.1)
    scrapeNoise.stop(t + 0.8)
    lfo.start(t + 0.1)
    lfo.stop(t + 0.8)

    setTimeout(() => ctx.close(), 1000)
  } catch {}
}

export function playStopSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const t = ctx.currentTime

    // ① 下降スイープ（完了・収束感）
    const sweep = ctx.createOscillator()
    const sweepGain = ctx.createGain()
    const sweepFilter = ctx.createBiquadFilter()
    sweep.connect(sweepFilter)
    sweepFilter.connect(sweepGain)
    sweepGain.connect(ctx.destination)
    sweep.type = 'sawtooth'
    sweepFilter.type = 'lowpass'
    sweepFilter.frequency.setValueAtTime(3000, t)
    sweepFilter.frequency.exponentialRampToValueAtTime(400, t + 0.14)
    sweep.frequency.setValueAtTime(1000, t)
    sweep.frequency.exponentialRampToValueAtTime(200, t + 0.15)
    sweepGain.gain.setValueAtTime(0.18, t)
    sweepGain.gain.linearRampToValueAtTime(0, t + 0.16)
    sweep.start(t)
    sweep.stop(t + 0.17)

    // ② ピン1（G6 = 1568Hz）— 高い確認音
    const ping1 = ctx.createOscillator()
    const ping1Gain = ctx.createGain()
    ping1.connect(ping1Gain)
    ping1Gain.connect(ctx.destination)
    ping1.type = 'sine'
    ping1.frequency.setValueAtTime(1568, t + 0.1)
    ping1Gain.gain.setValueAtTime(0, t + 0.1)
    ping1Gain.gain.linearRampToValueAtTime(0.38, t + 0.11)
    ping1Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
    ping1.start(t + 0.1)
    ping1.stop(t + 0.42)

    // ③ ピン2（C6 = 1047Hz）— 低めで落ち着く余韻
    const ping2 = ctx.createOscillator()
    const ping2Gain = ctx.createGain()
    ping2.connect(ping2Gain)
    ping2Gain.connect(ctx.destination)
    ping2.type = 'sine'
    ping2.frequency.setValueAtTime(1047, t + 0.2)
    ping2Gain.gain.setValueAtTime(0, t + 0.2)
    ping2Gain.gain.linearRampToValueAtTime(0.28, t + 0.21)
    ping2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
    ping2.start(t + 0.2)
    ping2.stop(t + 0.62)

    setTimeout(() => ctx.close(), 750)
  } catch {}
}

export function playStartSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const t = ctx.currentTime

    // ① キック：ずっしりした起動感
    const kick = ctx.createOscillator()
    const kickGain = ctx.createGain()
    kick.connect(kickGain)
    kickGain.connect(ctx.destination)
    kick.type = 'sine'
    kick.frequency.setValueAtTime(160, t)
    kick.frequency.exponentialRampToValueAtTime(40, t + 0.09)
    kickGain.gain.setValueAtTime(0.55, t)
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11)
    kick.start(t)
    kick.stop(t + 0.12)

    // ② ライジングスイープ：パワーアップ感
    const sweep = ctx.createOscillator()
    const sweepGain = ctx.createGain()
    const sweepFilter = ctx.createBiquadFilter()
    sweep.connect(sweepFilter)
    sweepFilter.connect(sweepGain)
    sweepGain.connect(ctx.destination)
    sweep.type = 'sawtooth'
    sweepFilter.type = 'lowpass'
    sweepFilter.frequency.setValueAtTime(800, t + 0.05)
    sweepFilter.frequency.exponentialRampToValueAtTime(3000, t + 0.2)
    sweep.frequency.setValueAtTime(180, t + 0.05)
    sweep.frequency.exponentialRampToValueAtTime(1000, t + 0.22)
    sweepGain.gain.setValueAtTime(0.12, t + 0.05)
    sweepGain.gain.linearRampToValueAtTime(0.18, t + 0.15)
    sweepGain.gain.linearRampToValueAtTime(0, t + 0.24)
    sweep.start(t + 0.05)
    sweep.stop(t + 0.25)

    // ③ ピン1（C6 = 1047Hz）
    const ping1 = ctx.createOscillator()
    const ping1Gain = ctx.createGain()
    ping1.connect(ping1Gain)
    ping1Gain.connect(ctx.destination)
    ping1.type = 'sine'
    ping1.frequency.setValueAtTime(1047, t + 0.18)
    ping1Gain.gain.setValueAtTime(0, t + 0.18)
    ping1Gain.gain.linearRampToValueAtTime(0.4, t + 0.19)
    ping1Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.46)
    ping1.start(t + 0.18)
    ping1.stop(t + 0.48)

    // ④ ピン2（G6 = 1568Hz）— 少し遅らせて余韻
    const ping2 = ctx.createOscillator()
    const ping2Gain = ctx.createGain()
    ping2.connect(ping2Gain)
    ping2Gain.connect(ctx.destination)
    ping2.type = 'sine'
    ping2.frequency.setValueAtTime(1568, t + 0.27)
    ping2Gain.gain.setValueAtTime(0, t + 0.27)
    ping2Gain.gain.linearRampToValueAtTime(0.32, t + 0.28)
    ping2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65)
    ping2.start(t + 0.27)
    ping2.stop(t + 0.67)

    setTimeout(() => ctx.close(), 800)
  } catch {}
}
