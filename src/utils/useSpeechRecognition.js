import { useState, useRef, useCallback } from 'react'
import { parseVoiceInput } from './measurementParser'

function getSpeechRecognition() {
  return window.SpeechRecognition
    || window.webkitSpeechRecognition
    || null
}

export function useSpeechRecognition({ onResult, gracePeriodMs = 2000 }) {
  const [isRecording, setIsRecording] = useState(false)
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef(null)
  const accumulatedRef = useRef('')
  const graceTimerRef = useRef(null)
  const isRecordingRef = useRef(false)

  const isSupported = !!getSpeechRecognition()
  const lastInterimRef = useRef('')

  const clearGraceTimer = () => {
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current)
      graceTimerRef.current = null
    }
  }

  const start = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) return
    if (recognitionRef.current) recognitionRef.current.abort()

    const recognition = new SR()
    recognition.lang = 'ja-JP'
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition
    accumulatedRef.current = ''
    isRecordingRef.current = true

    recognition.onresult = (e) => {
      clearGraceTimer()
      let interim = ''
      let final = ''

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      if (final) {
        accumulatedRef.current += final + ' '
        lastInterimRef.current = ''
      }
      if (interim) {
        lastInterimRef.current = interim
      }
      setInterimText(interim)

      // グレースピリオド：一定時間無音で自動確定
      graceTimerRef.current = setTimeout(() => {
        setInterimText('')
      }, gracePeriodMs)
    }

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') {
        console.warn('音声認識エラー:', e.error)
      }
    }

    // iOSはcontinuousが切れることがあるので再起動
    recognition.onend = () => {
      if (isRecordingRef.current) {
        try { recognition.start() } catch {}
      }
    }

    recognition.start()
    setIsRecording(true)
    setInterimText('')
  }, [gracePeriodMs])

  const stop = useCallback(() => {
    clearGraceTimer()
    isRecordingRef.current = false
    setIsRecording(false)
    setInterimText('')

    if (recognitionRef.current) {
      const recognition = recognitionRef.current
      recognitionRef.current = null

      recognition.onend = () => {
        // iOSでfinalが来なかった場合はinterimを使う
        const text = (accumulatedRef.current + ' ' + lastInterimRef.current).trim()
        accumulatedRef.current = ''
        lastInterimRef.current = ''
        if (text) {
          const results = parseVoiceInput(text)
          if (results.length > 0) onResult(results, text)
        }
      }
      recognition.stop() // abort→stopに変更（iOSで結果が確定してから終了）
    }
  }, [onResult])

  const toggle = useCallback(() => {
    if (isRecording) stop()
    else start()
  }, [isRecording, start, stop])

  return { isRecording, interimText, toggle, isSupported }
}
