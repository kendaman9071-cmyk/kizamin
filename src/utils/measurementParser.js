// ============================================================
// 寸法パーサー
// 音声認識テキスト → 寸法データ に変換する
// ============================================================

// --- 桁読み変換表 ---
const DIGIT_MAP = {
  'いち': 1, 'いー': 1,
  'に': 2, 'にー': 2,
  'さん': 3,
  'よん': 4, 'し': 4, 'よー': 4,
  'ご': 5, 'ごー': 5,
  'ろく': 6, 'ろー': 6,
  'なな': 7, 'しち': 7,
  'はち': 8, 'ぱち': 8, 'ぱ': 8, 'ぱー': 8,
  'きゅう': 9, 'く': 9, 'きゅー': 9,
  'まる': 0, 'ぜろ': 0, 'れい': 0, 'れー': 0,
}

// --- 単位換算表（→mm） ---
const UNIT_MAP = {
  'ミリ': 1, 'mm': 1, 'ｍｍ': 1,
  'センチ': 10, 'cm': 10,
  'メートル': 1000, 'm': 1000,
  'シャク': 303.03, 'しゃく': 303.03, '尺': 303.03,
  'スン': 30.303, 'すん': 30.303, '寸': 30.303,
  'ブ': 3.0303, 'ぶ': 3.0303, '分': 3.0303,
  'ケン': 1820, 'げん': 1820, 'いっけん': 1820, 'いちけん': 1820, 'いちかん': 1820, 'いちげん': 1820,
  'インチ': 25.4,
  'フィート': 304.8,
}

// --- 材料キーワード（メモ扱い） ---
const MATERIAL_KEYWORDS = {
  'さぶろく': 'サブロク（910×1820）',
  'さんろく': 'サブロク（910×1820）',
  'しはち': 'シハチ（1212×2424）',
  'さんぱち': 'サンパチ（910×2430）',
}

// --- 線寸法キーワード（数値登録） ---
const SIZE_KEYWORDS = {
  'ろくしゃく': { value: 1820, label: '六尺' },
  'いっけん': { value: 1820, label: '一間' },
  'いちけん': { value: 1820, label: '一間' },
  'いちかん': { value: 1820, label: '一間' },
  'いちげん': { value: 1820, label: '一間' },
}

// --- 演算子 ---
const OPERATORS = {
  'たす': '+', 'ぷらす': '+',
  'ひく': '-', 'まいなす': '-',
  'かける': '*', 'かけ': '*',
  'まい': '*', 'ほん': '*', 'こ': '*',
  'わる': '/', 'とうぶん': '/',
}

// --- 区切り語 ---
const SEPARATORS = ['つぎ', 'からの', 'と']

// ============================================================
// メイン：テキストを寸法リストに変換
// ============================================================
export function parseVoiceInput(text) {
  const normalized = normalizeText(text)
  const segments = splitByOperatorsAndSeparators(normalized)
  const results = []

  for (const segment of segments) {
    const result = parseSegment(segment.trim())
    if (result) results.push(...result)
  }

  return results
}

// テキスト正規化
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[　]/g, ' ')
    .replace(/次/g, 'つぎ')
    .replace(/足す|プラス/g, 'たす')
    .replace(/引く|マイナス/g, 'ひく')
    .replace(/掛ける|かける/g, 'かける')
    .replace(/割る/g, 'わる')
    .trim()
}

// セグメントを区切り語で分割
function splitByOperatorsAndSeparators(text) {
  // 区切り語で分割（ただし「と」は数字の後のみ）
  let segments = [text]
  for (const sep of ['つぎ', 'からの']) {
    segments = segments.flatMap((s) => s.split(sep))
  }
  // 「と」は数字っぽいものの後にある場合のみ分割
  segments = segments.flatMap((s) => splitByTo(s))
  return segments.filter((s) => s.trim().length > 0)
}

// 「と」の文脈判断分割
function splitByTo(text) {
  // 「とう」はトウ（10）なので除外
  // 単独の「と」のみ区切りとして扱う
  return text.split(/(?<![とう])と(?![う])/)
}

// 1セグメントを解析
function parseSegment(text) {
  if (!text) return null

  // 材料キーワードチェック
  for (const [key, label] of Object.entries(MATERIAL_KEYWORDS)) {
    if (text.includes(key)) {
      return [{ value: null, displayValue: label, memo: label, isMemo: true }]
    }
  }

  // 線寸法キーワードチェック
  for (const [key, data] of Object.entries(SIZE_KEYWORDS)) {
    if (text.includes(key)) {
      return [{ value: data.value, displayValue: `${data.value}mm`, memo: '', unit: 'mm' }]
    }
  }

  // メモ付き寸法のチェック（数字 + 文字）
  const { numericPart, memoPart } = extractMemo(text)

  // 演算式チェック
  const calcResult = parseCalculation(numericPart)
  if (calcResult !== null) {
    const { values, formula } = calcResult
    return values.map((v) => ({
      value: v,
      displayValue: formula ? `${formula}=${v}mm` : `${v}mm`,
      memo: memoPart,
      unit: 'mm',
      warning: false,
    }))
  }

  // 単純な数値
  const value = parseNumber(numericPart)
  if (value !== null) {
    return [{
      value,
      displayValue: `${value}mm`,
      memo: memoPart,
      unit: 'mm',
      warning: false,
    }]
  }

  // 解析失敗
  return [{
    value: null,
    displayValue: text,
    memo: '',
    unit: 'mm',
    warning: true,
    warningText: '認識できませんでした',
  }]
}

// テキストからメモ部分を抽出
function extractMemo(text) {
  // 日本語の名詞っぽい部分をメモとして抽出
  const match = text.match(/^([\d\s\u3040-\u30ffa-z]+?)\s*([\u4e00-\u9fff\u3040-\u30ff]{2,}.*)?$/)
  if (match) {
    return { numericPart: match[1]?.trim() || text, memoPart: match[2]?.trim() || '' }
  }
  return { numericPart: text, memoPart: '' }
}

// 演算式の解析
function parseCalculation(text) {
  // 演算子を含むか確認
  let hasOperator = false
  for (const op of Object.keys(OPERATORS)) {
    if (text.includes(op)) { hasOperator = true; break }
  }
  if (!hasOperator) return null

  // トークン化
  let expr = text
  for (const [word, symbol] of Object.entries(OPERATORS)) {
    expr = expr.replaceAll(word, ` ${symbol} `)
  }

  const tokens = expr.trim().split(/\s+/)
  const numbers = []
  const ops = []

  for (const token of tokens) {
    if (['+', '-', '*', '/'].includes(token)) {
      ops.push(token)
    } else {
      const num = parseNumber(token)
      if (num !== null) numbers.push(num)
    }
  }

  if (numbers.length === 0) return null

  // ×N の場合：N件個別登録
  if (ops.length === 1 && ops[0] === '*' && numbers.length === 2) {
    const [base, count] = numbers
    const values = Array(Math.round(count)).fill(Math.round(base))
    return { values, formula: `${base}×${Math.round(count)}` }
  }

  // ÷N の場合：結果をN件登録
  if (ops.length === 1 && ops[0] === '/' && numbers.length === 2) {
    const [base, count] = numbers
    const result = Math.round(base / count)
    const values = Array(Math.round(count)).fill(result)
    return { values, formula: `${base}÷${Math.round(count)}` }
  }

  // 通常の四則演算（数学の優先順位）
  try {
    let result = numbers[0]
    // 掛け算・割り算を先に処理
    const tempNums = [...numbers]
    const tempOps = [...ops]
    let i = 0
    while (i < tempOps.length) {
      if (tempOps[i] === '*') {
        tempNums[i] = Math.round(tempNums[i] * tempNums[i + 1])
        tempNums.splice(i + 1, 1)
        tempOps.splice(i, 1)
      } else if (tempOps[i] === '/') {
        tempNums[i] = Math.round(tempNums[i] / tempNums[i + 1])
        tempNums.splice(i + 1, 1)
        tempOps.splice(i, 1)
      } else {
        i++
      }
    }
    // 足し算・引き算
    result = tempNums[0]
    for (let j = 0; j < tempOps.length; j++) {
      if (tempOps[j] === '+') result += tempNums[j + 1]
      if (tempOps[j] === '-') result -= tempNums[j + 1]
    }
    const formula = buildFormula(numbers, ops)
    return { values: [Math.round(result)], formula }
  } catch {
    return null
  }
}

function buildFormula(numbers, ops) {
  const symbols = { '+': '+', '-': '-', '*': '×', '/': '÷' }
  let f = String(numbers[0])
  for (let i = 0; i < ops.length; i++) {
    f += symbols[ops[i]] + numbers[i + 1]
  }
  return f
}

// 数値文字列を数値（mm）に変換
function parseNumber(text) {
  if (!text) return null
  const t = text.trim()

  // アラビア数字（日本語が混じっている場合はスキップして日本語パーサーへ）
  const hasJapanese = /[\u3040-\u30ff\u4e00-\u9fff]/.test(t)
  if (!hasJapanese) {
    const arabic = parseFloat(t.replace(/,/g, ''))
    if (!isNaN(arabic) && arabic > 0) return Math.round(arabic)
  }

  // 単位付き（例：「6しゃく」「3すん」）
  for (const [unit, multiplier] of Object.entries(UNIT_MAP)) {
    const re = new RegExp(`^([\\d.]+)\\s*${unit}$`, 'i')
    const m = t.match(re)
    if (m) return Math.round(parseFloat(m[1]) * multiplier)
  }

  // 日本語数字（漢数字・ひらがな）
  const japanese = parseJapaneseNumber(t)
  if (japanese !== null) return japanese

  // 桁読み
  const digit = parseDigitReading(t)
  if (digit !== null) return digit

  return null
}

// 日本語の数字読みをパース
function parseJapaneseNumber(text) {
  let t = text
    // iOSが「900とう」のようにアラビア数字+日本語に変換するケースを処理
    .replace(/(\d+)とう/g, (_, n) => String(parseInt(n) + 10))
    .replace(/(\d+)と$/g, (_, n) => String(parseInt(n) + 10))
    .replace(/とう/g, '10')   // トウ → 10（百・千の後）
    .replace(/せん/g, '1000')
    .replace(/ひゃく/g, '100')
    .replace(/じゅう/g, '10')
    .replace(/いち/g, '1').replace(/いー/g, '1')
    .replace(/に(?!ん)/g, '2').replace(/にー/g, '2')
    .replace(/さん/g, '3')
    .replace(/よん/g, '4').replace(/し(?!ち)/g, '4').replace(/よー/g, '4')
    .replace(/ごー/g, '5').replace(/ご/g, '5')
    .replace(/ろく/g, '6').replace(/ろー/g, '6')
    .replace(/なな/g, '7').replace(/しち/g, '7')
    .replace(/はち/g, '8').replace(/ぱち/g, '8').replace(/ぱー/g, '8').replace(/ぱ/g, '8')
    .replace(/きゅう/g, '9').replace(/きゅー/g, '9').replace(/く(?!だ)/g, '9')
    .replace(/まる/g, '0').replace(/ぜろ/g, '0').replace(/れい/g, '0').replace(/れー/g, '0')

  // 数字のみになったか確認
  if (/^\d+$/.test(t)) return parseInt(t, 10)

  // 千・百・十の位を計算
  try {
    let result = 0
    const senMatch = t.match(/(\d*)1000/)
    if (senMatch) {
      result += (parseInt(senMatch[1] || '1')) * 1000
      t = t.replace(senMatch[0], '')
    }
    const hyakuMatch = t.match(/(\d*)100/)
    if (hyakuMatch) {
      result += (parseInt(hyakuMatch[1] || '1')) * 100
      t = t.replace(hyakuMatch[0], '')
    }
    const juuMatch = t.match(/(\d*)10/)
    if (juuMatch) {
      result += (parseInt(juuMatch[1] || '1')) * 10
      t = t.replace(juuMatch[0], '')
    }
    if (t && /^\d+$/.test(t)) result += parseInt(t)
    if (result > 0) return result
  } catch {
    return null
  }

  return null
}

// 桁読み（イチハチニサン → 1823）
function parseDigitReading(text) {
  // 全てのトークンがDIGIT_MAPにあるか確認
  let remaining = text
  const digits = []

  // 長い読みから順に試行
  const sorted = Object.entries(DIGIT_MAP).sort((a, b) => b[0].length - a[0].length)

  while (remaining.length > 0) {
    let matched = false
    for (const [key, val] of sorted) {
      if (remaining.startsWith(key)) {
        digits.push(val)
        remaining = remaining.slice(key.length)
        matched = true
        break
      }
    }
    if (!matched) return null // 解析失敗
  }

  if (digits.length === 0) return null
  return parseInt(digits.join(''), 10)
}
