// Web Audio API でサウンドを生成（外部ファイル不要）

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
