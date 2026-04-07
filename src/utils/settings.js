const DEFAULTS = {
  wakeLock: true,
  vibration: true,
  doubleTap: false,
}

export function getSetting(key) {
  try {
    const v = localStorage.getItem(`kizamin-setting-${key}`)
    return v === null ? DEFAULTS[key] : JSON.parse(v)
  } catch {
    return DEFAULTS[key]
  }
}

export function setSetting(key, value) {
  localStorage.setItem(`kizamin-setting-${key}`, JSON.stringify(value))
}
