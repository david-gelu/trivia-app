'use strict'
const path = require('path').posix

// ---------- utilitare (PRNG cu seed => rezultat reproductibil) ----------
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260923)
const int = (a, b) => a + Math.floor(rand() * (b - a + 1))
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
function sample(arr, n) {
  const c = [...arr]
  const out = []
  while (out.length < n && c.length) out.push(c.splice(Math.floor(rand() * c.length), 1)[0])
  return out
}
const range = (a, b, step = 1) => { const r = []; for (let x = a; x <= b; x += step) r.push(x); return r }

const fmtJS = (v) =>
  v === undefined ? 'undefined'
    : v === null ? 'null'
      : typeof v === 'string' ? `'${v}'`
        : Array.isArray(v) ? `[${v.map(fmtJS).join(', ')}]`
          : Object.is(v, -0) ? '0' : String(v)
const fmtSQL = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'string' ? `'${v}'` : String(v))

function mc(category, difficulty, text, correct, pool) {
  const c = String(correct)
  const wrong = sample([...new Set(pool.map(String))].filter((x) => x !== c && x !== ''), 3)
  if (wrong.length < 3) return null
  return {
    category, difficulty, text,
    choices: sample([c, ...wrong], 4).map((t) => ({ text: t, isCorrect: t === c })),
  }
}

function perturb(v, f, sql) {
  let r = []
  if (typeof v === 'boolean') return [true, false, null].map(f).concat(sql ? ['eroare de sintaxă'] : ['undefined'])
  if (typeof v === 'number') r = [v + 1, v - 1, v + 2, v - 2, v * 2, 0, v + 10].map((x) => Number(x.toFixed(4)))
  else if (typeof v === 'string') r = [v.toUpperCase(), [...v].reverse().join(''), v.slice(1), v.slice(0, -1), v + v.slice(-1), v.toLowerCase()]
  else if (v === undefined || v === null) r = sql ? [0, '', -1, false] : [null, -1, 0, false, NaN, '']
  else if (Array.isArray(v)) r = [[...v].reverse(), v.slice(1), v.slice(0, -1), v.map((x) => (typeof x === 'number' ? x + 1 : x)), [...v].sort((a, b) => a - b), [...v, v[0]]]
  return r.map(f)
}

// grup de operații pe același input => întrebări; distractorii vin din rezultatele „vecine"
function fromGroup(category, difficulty, group, textFn, f = fmtJS, sql = false) {
  const out = []
  for (const op of group) {
    const same = group
      .filter((o) => o !== op && typeof o.val === typeof op.val && Array.isArray(o.val) === Array.isArray(op.val))
      .map((o) => o.show ?? f(o.val))
    const q = mc(category, op.difficulty || difficulty, textFn(op.code), op.show ?? f(op.val), [...same, ...perturb(op.val, f, sql)])
    if (q) out.push(q)
  }
  return out
}

const WORDS = ['server', 'client', 'router', 'module', 'cursor', 'pipeline', 'index', 'schema', 'cluster', 'token', 'request', 'response', 'handler', 'context', 'render', 'promise', 'closure', 'payload', 'socket', 'gateway', 'buffer', 'stream', 'query', 'cache', 'vector', 'layout', 'gradient', 'selector', 'component', 'reducer', 'session', 'cookie', 'docker', 'branch', 'commit']

// ============================ JAVASCRIPT ============================
function jsArrays(n) {
  const out = []
  for (let x = 0; x < n; x++) {
    const len = int(4, 7)
    const a = Array.from({ length: len }, () => int(1, 15))
    const A = fmtJS(a)
    const k = int(2, 5), t = int(3, 11), i = int(0, 2), j = int(i + 2, len)
    const v = pick(a), miss = int(20, 30), probe = pick([v, miss])
    const group = [
      { code: `${A}.map(x => x * ${k})`, val: a.map((z) => z * k) },
      { code: `${A}.map(x => x % ${k})`, val: a.map((z) => z % k) },
      { code: `${A}.filter(x => x > ${t})`, val: a.filter((z) => z > t) },
      { code: `${A}.filter(x => x % 2 === 0)`, val: a.filter((z) => z % 2 === 0) },
      { code: `${A}.reduce((s, x) => s + x, 0)`, val: a.reduce((s, z) => s + z, 0) },
      { code: `${A}.reduce((m, x) => Math.max(m, x))`, val: Math.max(...a) },
      { code: `${A}.slice(${i}, ${j})`, val: a.slice(i, j) },
      { code: `${A}.slice(-2)`, val: a.slice(-2) },
      { code: `${A}.splice(${i}, 2)`, val: a.slice(i, i + 2) },
      { code: `${A}.indexOf(${v})`, val: a.indexOf(v) },
      { code: `${A}.lastIndexOf(${v})`, val: a.lastIndexOf(v) },
      { code: `${A}.includes(${probe})`, val: a.includes(probe) },
      { code: `${A}.find(x => x > ${t})`, val: a.find((z) => z > t) },
      { code: `${A}.findIndex(x => x > ${t})`, val: a.findIndex((z) => z > t) },
      { code: `${A}.some(x => x > ${t})`, val: a.some((z) => z > t) },
      { code: `${A}.every(x => x > ${t - 2})`, val: a.every((z) => z > t - 2) },
      { code: `${A}.join('-')`, val: a.join('-') },
      { code: `${A}.at(-1)`, val: a.at(-1) },
      { code: `${A}.reverse()`, val: [...a].reverse() },
      { code: `${A}.sort((a, b) => b - a)`, val: [...a].sort((p, q) => q - p) },
      { code: `${A}.sort()`, val: [...a].sort(), difficulty: 'Expert' },
      { code: `Math.max(...${A})`, val: Math.max(...a) },
      { code: `Math.min(...${A})`, val: Math.min(...a) },
      { code: `[...new Set(${A})]`, val: [...new Set(a)] },
      { code: `${A}.length`, val: a.length },
      { code: `${A}.flatMap(x => [x, ${k}])`, val: a.flatMap((z) => [z, k]) },
    ]
    out.push(...fromGroup('JavaScript', 'Intermediar', group, (c) => `Ce returnează expresia \`${c}\` în JavaScript?`))
  }
  return out
}

function jsStrings(n) {
  const out = []
  for (let x = 0; x < n; x++) {
    const w = pick(WORDS)
    const a = int(0, 2), b = int(a + 2, w.length), c = int(2, 3), ch = w[int(0, w.length - 1)]
    const pre = w.slice(0, 2)
    const group = [
      { code: `'${w}'.toUpperCase()`, val: w.toUpperCase() },
      { code: `'${w}'.slice(${a}, ${b})`, val: w.slice(a, b) },
      { code: `'${w}'.slice(-${c})`, val: w.slice(-c) },
      { code: `'${w}'.substring(${b}, ${a})`, val: w.substring(b, a), difficulty: 'Expert' },
      { code: `'${w}'.charAt(${a})`, val: w.charAt(a) },
      { code: `'${w}'.indexOf('${ch}')`, val: w.indexOf(ch) },
      { code: `'${w}'.lastIndexOf('${ch}')`, val: w.lastIndexOf(ch) },
      { code: `'${w}'.split('${ch}')`, val: w.split(ch) },
      { code: `'${w}'.repeat(2)`, val: w.repeat(2) },
      { code: `'${w}'.padStart(${w.length + 2}, '*')`, val: w.padStart(w.length + 2, '*') },
      { code: `'${w}'.replace('${ch}', '-')`, val: w.replace(ch, '-') },
      { code: `'${w}'.replaceAll('${ch}', '-')`, val: w.replaceAll(ch, '-') },
      { code: `'${w}'.at(-1)`, val: w.at(-1) },
      { code: `'${w}'.length`, val: w.length },
      { code: `'${w}'.startsWith('${pre}')`, val: true },
      { code: `'${w}'.includes('zz')`, val: false },
      { code: `[...'${w}'].reverse().join('')`, val: [...w].reverse().join('') },
      { code: `'${w}'.split('').sort().join('')`, val: w.split('').sort().join('') },
    ]
    out.push(...fromGroup('JavaScript', 'Intermediar', group, (c) => `Ce returnează expresia \`${c}\` în JavaScript?`))
  }
  return out
}

function jsCoercion() {
  const out = []
  const ev = (code) => new Function(`return (${code})`)()
  const fixed = ['typeof null', 'typeof undefined', 'typeof NaN', 'typeof []', 'typeof function () {}', 'typeof Symbol()', 'typeof 10n', '0.1 + 0.2 === 0.3', '0.1 + 0.2', 'NaN === NaN', 'undefined == null', 'undefined === null', '[] + []', '[1, 2] + [3]', "'b' + 'a' + +'a' + 'a'", '!!""', '!![]', '[] == false', 'null ?? "x"', '0 ?? "x"', '0 || "x"', '"" && "y"', '[10, 9, 1].sort()', '1 / 0', '-1 / 0', 'Number(null)', 'Number(undefined)', 'Number("")', 'Number(true)', 'true + true', "'3' * '4'", 'Math.round(2.5)', 'Math.round(-2.5)', '[..."hi"]', 'parseFloat("3.14abc")', 'Array(3).length', '[,].length', '[1, 2, 3].toString()', 'String([1, [2, 3]])', 'null + 1', 'undefined + 1', '"5" - - "2"', '[] + {}', '9007199254740993n + 1n', 'Number.MAX_SAFE_INTEGER + 2', '(() => { try { return 1 } finally { } })()']
  for (const code of fixed) {
    const val = ev(code)
    const pool = ['undefined', 'null', 'NaN', "'object'", "'string'", "'number'", 'true', 'false', '0', "''", '[]', '1', "'undefined'"]
    const s = typeof val === 'bigint' ? `${val}n` : fmtJS(val)
    const q = mc('JavaScript', 'Expert', `Ce returnează expresia \`${code}\` în JavaScript?`, s, [...pool, ...perturb(typeof val === 'bigint' ? 0 : val, fmtJS, false)])
    if (q) out.push(q)
  }
  for (let n = 1; n <= 40; n++) {
    const m = int(2, 9)
    const codes = [
      `'${n}' + ${m}`, `'${n}' - ${m}`, `'${n}' * '${m}'`, `${n} + '${m}'`, `parseInt('${n}px')`, `Number('${n}px')`,
      `${n} == '${n}'`, `${n} === '${n}'`, `[${n}, ${m}] + ''`, `typeof (${n} + '')`, `!!${n - 3}`, `Math.round(${n}.5)`,
      `(${n} / ${m}).toFixed(2)`, `[${n}, ${m}].map(String)`, `[${n}, ${m}, ${n}].indexOf(${m})`, `${n} > ${m} ? '${n}' : ${m}`,
    ]
    for (const code of codes) {
      const val = ev(code)
      const pool = ['NaN', 'undefined', 'true', 'false', `'${n}${m}'`, String(n + m), String(n - m), String(n * m), `'${n}'`, `'${n + m}'`, "'number'", "'string'"]
      const q = mc('JavaScript', 'Intermediar', `Ce returnează expresia \`${code}\` în JavaScript?`, fmtJS(val), [...pool, ...perturb(val, fmtJS, false)])
      if (q) out.push(q)
    }
  }
  return out
}

// ============================ TAILWIND ============================
function tailTable(pairs, difficulty, textFwd, textRev) {
  const out = []
  for (const [cls, css] of pairs) {
    const others = pairs.filter(([c, s]) => c !== cls && s !== css)
    out.push(mc('Tailwind', difficulty, textFwd(cls), css, others.map((o) => o[1])))
    out.push(mc('Tailwind', difficulty, textRev(css), cls, others.map((o) => o[0])))
  }
  return out.filter(Boolean)
}

function tailwind() {
  const out = []
  const scale = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96]
  const rem = (n) => (n === 0 ? '0px' : `${n / 4}rem`)
  const props = {
    p: ['padding'], px: ['padding-left', 'padding-right'], py: ['padding-top', 'padding-bottom'], pt: ['padding-top'], pr: ['padding-right'], pb: ['padding-bottom'], pl: ['padding-left'],
    m: ['margin'], mx: ['margin-left', 'margin-right'], my: ['margin-top', 'margin-bottom'], mt: ['margin-top'], mr: ['margin-right'], mb: ['margin-bottom'], ml: ['margin-left'],
    gap: ['gap'], 'gap-x': ['column-gap'], 'gap-y': ['row-gap'], w: ['width'], h: ['height'],
    top: ['top'], right: ['right'], bottom: ['bottom'], left: ['left'],
  }
  const items = []
  for (const [pre, cssProps] of Object.entries(props)) {
    for (const n of scale) {
      items.push({ pre, n, cls: `${pre}-${n}`, css: cssProps.map((p) => `${p}: ${rem(n)}`).join('; ') })
      if (pre.startsWith('m') && n > 0) items.push({ pre: `-${pre}`, n, cls: `-${pre}-${n}`, css: cssProps.map((p) => `${p}: -${rem(n)}`).join('; ') })
    }
  }
  for (const it of items) {
    const samePre = items.filter((o) => o.pre === it.pre && o.n !== it.n)
    const sameN = items.filter((o) => o.n === it.n && o.pre !== it.pre && o.css !== it.css)
    const pf = mc('Tailwind', 'Începător', `Ce declarații CSS generează clasa Tailwind \`${it.cls}\`?`, it.css, [...sample(samePre, 2).map((o) => o.css), ...sample(sameN, 3).map((o) => o.css)])
    const pr = mc('Tailwind', 'Intermediar', `Care clasă Tailwind generează \`${it.css}\`?`, it.cls, [...sample(samePre, 2).map((o) => o.cls), ...sample(sameN, 3).map((o) => o.cls)])
    if (pf) out.push(pf)
    if (pr) out.push(pr)
  }

  const gcd = (a, b) => (b ? gcd(b, a % b) : a)
  const pct = (x) => `${Number((x * 100).toFixed(6))}%`
  const frac = []
  for (const pre of ['w', 'h'])
    for (const d of [2, 3, 4, 5, 6, 12])
      for (let nn = 1; nn < d; nn++) if (gcd(nn, d) === 1) frac.push([`${pre}-${nn}/${d}`, `${pre === 'w' ? 'width' : 'height'}: ${pct(nn / d)}`])
  out.push(...tailTable(frac, 'Intermediar', (c) => `Ce declarație CSS generează clasa Tailwind \`${c}\`?`, (s) => `Care clasă Tailwind generează \`${s}\`?`))

  const fs = { xs: ['0.75rem', '1rem'], sm: ['0.875rem', '1.25rem'], base: ['1rem', '1.5rem'], lg: ['1.125rem', '1.75rem'], xl: ['1.25rem', '1.75rem'], '2xl': ['1.5rem', '2rem'], '3xl': ['1.875rem', '2.25rem'], '4xl': ['2.25rem', '2.5rem'], '5xl': ['3rem', '1'], '6xl': ['3.75rem', '1'], '7xl': ['4.5rem', '1'], '8xl': ['6rem', '1'], '9xl': ['8rem', '1'] }
  out.push(...tailTable(Object.entries(fs).map(([k, [s, l]]) => [`text-${k}`, `font-size: ${s}; line-height: ${l}`]), 'Intermediar', (c) => `Ce declarații CSS generează clasa Tailwind \`${c}\`?`, (s) => `Care clasă Tailwind generează \`${s}\`?`))

  const fw = { thin: 100, extralight: 200, light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 }
  out.push(...tailTable(Object.entries(fw).map(([k, v]) => [`font-${k}`, `font-weight: ${v}`]), 'Începător', (c) => `Ce declarație CSS generează clasa Tailwind \`${c}\`?`, (s) => `Care clasă Tailwind generează \`${s}\`?`))

  const rd = { none: '0px', sm: '0.125rem', '': '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem', full: '9999px' }
  const rdPairs = []
  for (const [k, v] of Object.entries(rd)) {
    rdPairs.push([k ? `rounded-${k}` : 'rounded', `border-radius: ${v}`])
    if (k !== 'none') {
      rdPairs.push([k ? `rounded-t-${k}` : 'rounded-t', `border-top-left-radius: ${v}; border-top-right-radius: ${v}`])
      rdPairs.push([k ? `rounded-b-${k}` : 'rounded-b', `border-bottom-left-radius: ${v}; border-bottom-right-radius: ${v}`])
      rdPairs.push([k ? `rounded-l-${k}` : 'rounded-l', `border-top-left-radius: ${v}; border-bottom-left-radius: ${v}`])
      rdPairs.push([k ? `rounded-r-${k}` : 'rounded-r', `border-top-right-radius: ${v}; border-bottom-right-radius: ${v}`])
    }
  }
  out.push(...tailTable(rdPairs, 'Intermediar', (c) => `Ce declarații CSS generează clasa Tailwind \`${c}\`?`, (s) => `Care clasă Tailwind generează \`${s}\`?`))

  out.push(...tailTable([0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100].map((v) => [`opacity-${v}`, `opacity: ${v / 100}`]), 'Începător', (c) => `Ce declarație CSS generează clasa Tailwind \`${c}\`?`, (s) => `Care clasă Tailwind generează \`${s}\`?`))
  out.push(...tailTable([0, 10, 20, 30, 40, 50].map((v) => [`z-${v}`, `z-index: ${v}`]), 'Începător', (c) => `Ce declarație CSS generează clasa Tailwind \`${c}\`?`, (s) => `Care clasă Tailwind generează \`${s}\`?`))
  out.push(...tailTable(range(1, 12).map((n) => [`grid-cols-${n}`, `grid-template-columns: repeat(${n}, minmax(0, 1fr))`]), 'Intermediar', (c) => `Ce declarație CSS generează clasa Tailwind \`${c}\`?`, (s) => `Care clasă Tailwind generează \`${s}\`?`))
  out.push(...tailTable([...range(1, 12).map((n) => [`col-span-${n}`, `grid-column: span ${n} / span ${n}`]), ...range(1, 6).map((n) => [`row-span-${n}`, `grid-row: span ${n} / span ${n}`])], 'Intermediar', (c) => `Ce declarație CSS generează clasa Tailwind \`${c}\`?`, (s) => `Care clasă Tailwind generează \`${s}\`?`))
  out.push(...tailTable([['sm', 640], ['md', 768], ['lg', 1024], ['xl', 1280], ['2xl', 1536]].map(([k, v]) => [`${k}:`, `@media (min-width: ${v}px)`]), 'Începător', (c) => `Ce media query generează prefixul Tailwind \`${c}\`?`, (s) => `Care prefix Tailwind generează \`${s}\`?`))
  out.push(...tailTable([['border', '1px'], ['border-0', '0px'], ['border-2', '2px'], ['border-4', '4px'], ['border-8', '8px']].map(([c, v]) => [c, `border-width: ${v}`]), 'Începător', (c) => `Ce declarație CSS generează clasa Tailwind \`${c}\`?`, (s) => `Care clasă Tailwind generează \`${s}\`?`))

  const util = [
    ['justify-start', 'justify-content: flex-start'], ['justify-center', 'justify-content: center'], ['justify-end', 'justify-content: flex-end'], ['justify-between', 'justify-content: space-between'], ['justify-around', 'justify-content: space-around'], ['justify-evenly', 'justify-content: space-evenly'],
    ['items-start', 'align-items: flex-start'], ['items-center', 'align-items: center'], ['items-end', 'align-items: flex-end'], ['items-baseline', 'align-items: baseline'], ['items-stretch', 'align-items: stretch'],
    ['flex-row', 'flex-direction: row'], ['flex-col', 'flex-direction: column'], ['flex-row-reverse', 'flex-direction: row-reverse'], ['flex-col-reverse', 'flex-direction: column-reverse'], ['flex-wrap', 'flex-wrap: wrap'], ['flex-nowrap', 'flex-wrap: nowrap'],
    ['hidden', 'display: none'], ['block', 'display: block'], ['inline-block', 'display: inline-block'], ['inline', 'display: inline'], ['flex', 'display: flex'], ['grid', 'display: grid'],
    ['static', 'position: static'], ['relative', 'position: relative'], ['absolute', 'position: absolute'], ['fixed', 'position: fixed'], ['sticky', 'position: sticky'],
    ['overflow-hidden', 'overflow: hidden'], ['overflow-auto', 'overflow: auto'], ['overflow-scroll', 'overflow: scroll'],
    ['text-left', 'text-align: left'], ['text-center', 'text-align: center'], ['text-right', 'text-align: right'],
    ['uppercase', 'text-transform: uppercase'], ['lowercase', 'text-transform: lowercase'], ['capitalize', 'text-transform: capitalize'],
    ['italic', 'font-style: italic'], ['underline', 'text-decoration-line: underline'], ['line-through', 'text-decoration-line: line-through'],
    ['cursor-pointer', 'cursor: pointer'], ['cursor-not-allowed', 'cursor: not-allowed'], ['pointer-events-none', 'pointer-events: none'], ['select-none', 'user-select: none'],
    ['whitespace-nowrap', 'white-space: nowrap'], ['object-cover', 'object-fit: cover'], ['object-contain', 'object-fit: contain'], ['w-full', 'width: 100%'], ['h-screen', 'height: 100vh'], ['min-h-screen', 'min-height: 100vh'], ['w-screen', 'width: 100vw'],
  ]
  out.push(...tailTable(util, 'Începător', (c) => `Ce declarație CSS generează clasa Tailwind \`${c}\`?`, (s) => `Care clasă Tailwind generează \`${s}\`?`))
  return out
}

// ============================ CSS ============================
function cssTable() {
  const T = [
    ['display', 'none', 'elementul nu este afișat și nu ocupă spațiu'], ['display', 'block', 'elementul ocupă toată lățimea și începe pe rând nou'], ['display', 'inline', 'elementul curge în text și nu acceptă width/height'], ['display', 'inline-block', 'elementul stă pe rând cu textul dar acceptă width și height'], ['display', 'flex', 'elementul devine container flex pentru copiii direcți'], ['display', 'grid', 'elementul devine container de tip grilă'], ['display', 'contents', 'elementul dispare din arborele vizual, iar copiii lui sunt promovați'],
    ['position', 'static', 'elementul rămâne în fluxul normal, fără offset-uri'], ['position', 'relative', 'elementul se deplasează față de poziția normală și devine reper pentru copiii absolute'], ['position', 'absolute', 'elementul iese din flux și se poziționează față de cel mai apropiat strămoș poziționat'], ['position', 'fixed', 'elementul se poziționează față de viewport'], ['position', 'sticky', 'elementul se comportă relativ până la un prag de scroll, apoi se lipește'],
    ['flex-direction', 'row', 'elementele sunt așezate pe orizontală, în ordinea din HTML'], ['flex-direction', 'column', 'elementele sunt așezate pe verticală'], ['flex-direction', 'row-reverse', 'elementele sunt așezate pe orizontală, în ordine inversă'], ['flex-direction', 'column-reverse', 'elementele sunt așezate pe verticală, în ordine inversă'],
    ['justify-content', 'flex-start', 'elementele se grupează la începutul axei principale'], ['justify-content', 'center', 'elementele se centrează pe axa principală'], ['justify-content', 'flex-end', 'elementele se grupează la sfârșitul axei principale'], ['justify-content', 'space-between', 'spațiul se distribuie între elemente, fără spațiu la margini'], ['justify-content', 'space-around', 'fiecare element primește spațiu egal în jurul lui'], ['justify-content', 'space-evenly', 'spațiile dintre elemente și margini sunt identice'],
    ['align-items', 'stretch', 'elementele se întind pe axa transversală'], ['align-items', 'center', 'elementele se centrează pe axa transversală'], ['align-items', 'flex-start', 'elementele se aliniază la începutul axei transversale'], ['align-items', 'flex-end', 'elementele se aliniază la sfârșitul axei transversale'], ['align-items', 'baseline', 'elementele se aliniază după baza textului'],
    ['flex-wrap', 'nowrap', 'elementele rămân pe o singură linie'], ['flex-wrap', 'wrap', 'elementele trec pe rândul următor când nu mai încap'], ['flex-wrap', 'wrap-reverse', 'elementele trec pe rând nou, în sens invers'],
    ['overflow', 'visible', 'conținutul care depășește rămâne vizibil în afara casetei'], ['overflow', 'hidden', 'conținutul care depășește este tăiat'], ['overflow', 'scroll', 'apar mereu bare de derulare'], ['overflow', 'auto', 'barele de derulare apar doar când este nevoie'],
    ['text-align', 'left', 'textul se aliniază la stânga'], ['text-align', 'center', 'textul se centrează orizontal'], ['text-align', 'right', 'textul se aliniază la dreapta'], ['text-align', 'justify', 'textul se întinde pe toată lățimea, cu margini egale'],
    ['text-transform', 'uppercase', 'textul este afișat cu majuscule'], ['text-transform', 'lowercase', 'textul este afișat cu litere mici'], ['text-transform', 'capitalize', 'prima literă a fiecărui cuvânt este majusculă'],
    ['text-decoration', 'underline', 'textul este subliniat'], ['text-decoration', 'line-through', 'textul este tăiat cu o linie'], ['text-decoration', 'none', 'elimină decorațiunile textului, de exemplu sublinierea linkurilor'],
    ['white-space', 'nowrap', 'textul nu se rupe pe rânduri noi'], ['white-space', 'pre', 'se păstrează spațiile și rândurile noi din sursă'], ['white-space', 'pre-wrap', 'se păstrează spațiile, dar textul se poate rupe la marginea casetei'],
    ['cursor', 'pointer', 'cursorul devine mână, ca la linkuri'], ['cursor', 'not-allowed', 'cursorul arată că acțiunea nu este permisă'], ['cursor', 'grab', 'cursorul arată că elementul poate fi apucat și tras'], ['cursor', 'wait', 'cursorul arată că aplicația este ocupată'], ['cursor', 'text', 'cursorul devine bară pentru editarea textului'],
    ['visibility', 'hidden', 'elementul este invizibil, dar ocupă în continuare spațiu'], ['float', 'left', 'elementul este împins la stânga, iar textul curge în jurul lui'], ['clear', 'both', 'elementul coboară sub orice element float din stânga și din dreapta'],
    ['object-fit', 'cover', 'imaginea umple containerul, păstrează proporțiile și este tăiată la nevoie'], ['object-fit', 'contain', 'imaginea încape întreagă în container, păstrând proporțiile'], ['object-fit', 'fill', 'imaginea este întinsă să umple containerul, chiar deformată'],
    ['background-size', 'cover', 'fundalul acoperă tot elementul, cu posibilă tăiere'], ['background-size', 'contain', 'fundalul încape întreg în element'], ['background-repeat', 'no-repeat', 'imaginea de fundal apare o singură dată'], ['background-repeat', 'repeat-x', 'imaginea de fundal se repetă doar pe orizontală'],
    ['font-weight', '700', 'textul este îngroșat (bold)'], ['font-weight', '400', 'textul are grosime normală'], ['font-weight', '100', 'textul are cea mai subțire grosime numerică'], ['font-weight', '900', 'textul are cea mai groasă grosime numerică'],
    ['list-style-type', 'none', 'lista nu mai afișează marcatori'], ['list-style-type', 'disc', 'elementele listei au buline pline'], ['list-style-type', 'decimal', 'elementele listei sunt numerotate cu 1, 2, 3'],
    ['pointer-events', 'none', 'elementul ignoră evenimentele de mouse'], ['user-select', 'none', 'textul elementului nu poate fi selectat'],
    ['box-sizing', 'content-box', 'width și height nu includ padding-ul și bordura'], ['box-sizing', 'border-box', 'width și height includ padding-ul și bordura'],
    ['text-overflow', 'ellipsis', 'textul tăiat este marcat cu trei puncte'], ['resize', 'none', 'utilizatorul nu poate redimensiona elementul'], ['align-self', 'flex-end', 'elementul își suprascrie alinierea și se duce la sfârșitul axei transversale'],
    ['place-items', 'center', 'în grid, elementele se centrează pe ambele axe'], ['order', '-1', 'elementul flex este mutat înaintea celorlalte'], ['flex-grow', '1', 'elementul ocupă spațiul liber rămas în container'], ['flex-shrink', '0', 'elementul nu se micșorează când spațiul se termină'],
  ]
  const out = []
  for (const [prop, val, meaning] of T) {
    const sib = T.filter((t) => t[0] === prop && t[1] !== val)
    const rest = T.filter((t) => t[0] !== prop)
    const poolM = [...sib.map((t) => t[2]), ...sample(rest, 4).map((t) => t[2])]
    const poolV = [...sib.map((t) => t[1]), ...sample(rest, 4).map((t) => t[1])]
    out.push(mc('CSS', 'Începător', `Ce efect are declarația \`${prop}: ${val}\` în CSS?`, meaning, poolM))
    out.push(mc('CSS', 'Începător', `Ce se întâmplă cu un element care are \`${prop}: ${val}\`?`, meaning, poolM))
    out.push(mc('CSS', 'Intermediar', `Ce valoare a proprietății \`${prop}\` are efectul: ${meaning}?`, val, poolV))
    out.push(mc('CSS', 'Intermediar', `Ce proprietate CSS are valoarea \`${val}\` cu efectul: ${meaning}?`, prop, rest.map((t) => t[0])))
  }
  return out.filter(Boolean)
}

function cssComputed(n) {
  const out = []
  const bases = [['#header', [1, 0, 0]], ['#nav', [1, 0, 0]], ['#main', [1, 0, 0]], ['.card', [0, 1, 0]], ['.item', [0, 1, 0]], ['.active', [0, 1, 0]], ['.btn', [0, 1, 0]], ['div', [0, 0, 1]], ['a', [0, 0, 1]], ['ul', [0, 0, 1]], ['li', [0, 0, 1]], ['p', [0, 0, 1]], ['span', [0, 0, 1]], ['h1', [0, 0, 1]], ['button', [0, 0, 1]]]
  const sufs = [['', [0, 0, 0]], ['.on', [0, 1, 0]], [':hover', [0, 1, 0]], [':first-child', [0, 1, 0]], ['[type="text"]', [0, 1, 0]], [':not(.off)', [0, 1, 0]]]
  const makeSel = () => {
    const cnt = int(2, 4)
    let text = ''
    const w = [0, 0, 0]
    for (let i = 0; i < cnt; i++) {
      const [b, bw] = pick(bases)
      let [s, sw] = pick(sufs)
      let extra = ''
      let ew = [0, 0, 0]
      if (i === cnt - 1 && rand() < 0.2) { extra = '::before'; ew = [0, 0, 1] }
      text += (i ? pick([' ', ' > ', ' + ']) : '') + b + s + extra
      for (let k = 0; k < 3; k++) w[k] += bw[k] + sw[k] + ew[k]
    }
    return { text, w }
  }
  const fw = (w) => `(${w.join(', ')})`
  const cmp = (a, b) => { for (let k = 0; k < 3; k++) if (a[k] !== b[k]) return a[k] > b[k] ? 1 : -1; return 0 }
  for (let i = 0; i < n; i++) {
    const s = makeSel()
    const pool = [[s.w[1], s.w[0], s.w[2]], [s.w[0], s.w[2], s.w[1]], [s.w[0], s.w[1] + 1, s.w[2]], [s.w[0], s.w[1], s.w[2] + 1], [s.w[0] + 1, s.w[1], s.w[2]], [Math.max(0, s.w[0] - 1), s.w[1], s.w[2]], [0, s.w[1] + s.w[0], s.w[2]]].map(fw)
    out.push(mc('CSS', 'Expert', `Care este specificitatea (ID, clase/pseudo-clase/atribute, elemente) a selectorului \`${s.text}\`?`, fw(s.w), pool))
    const t = makeSel()
    const c = cmp(s.w, t.w)
    const ans = c === 1 ? 'Primul selector' : c === -1 ? 'Al doilea selector' : 'Au aceeași specificitate; câștigă cel declarat ultimul'
    out.push(mc('CSS', 'Expert', `Doi selectori setează același \`color\`: \`${s.text}\` și \`${t.text}\`. Care câștigă (fără !important)?`, ans, ['Primul selector', 'Al doilea selector', 'Au aceeași specificitate; câștigă cel declarat ultimul', 'Niciunul, regulile se anulează']))
  }
  for (let i = 0; i < n; i++) {
    const W = pick(range(100, 600, 20)), P = pick([0, 5, 10, 15, 20, 25, 30]), B = pick([1, 2, 3, 4, 5, 10]), M = pick([0, 5, 10, 20])
    const css = `width: ${W}px; padding: ${P}px; border: ${B}px solid; margin: ${M}px;`
    const tc = W + 2 * P + 2 * B
    out.push(mc('CSS', 'Intermediar', `Un element are \`${css} box-sizing: content-box;\`. Ce lățime totală (fără margin) ocupă pe orizontală?`, `${tc}px`, [W, tc + 2 * M, W + P, W + 2 * B, tc - 2 * P, W + 2 * P].map((x) => `${x}px`)))
    out.push(mc('CSS', 'Intermediar', `Un element are \`${css} box-sizing: content-box;\`. Ce spațiu orizontal ocupă în total, inclusiv margin?`, `${tc + 2 * M}px`, [W, tc, W + 2 * M, tc + M, tc - 2 * P, W + 2 * P + 2 * M].map((x) => `${x}px`)))
    out.push(mc('CSS', 'Intermediar', `Un element are \`${css} box-sizing: border-box;\`. Ce lățime are zona de conținut?`, `${W - 2 * P - 2 * B}px`, [W, W - P - B, W + 2 * P + 2 * B, W - 2 * P, W - 2 * B, W - 2 * P - 2 * B + 2 * M].map((x) => `${x}px`)))
  }
  for (let i = 0; i < Math.floor(n / 2); i++) {
    const root = pick([10, 16, 18, 20]), v = pick(range(0.25, 6, 0.25))
    out.push(mc('CSS', 'Începător', `Dacă \`html { font-size: ${root}px }\`, câți pixeli reprezintă \`${v}rem\`?`, `${v * root}px`, [v * 16, v * root + root, v * root - root, v * root * 2, v * root / 2, v * (root + 2)].map((x) => `${x}px`)))
    const par = pick([12, 14, 16, 20, 24]), e = pick(range(0.5, 4, 0.5))
    out.push(mc('CSS', 'Intermediar', `Un element are \`font-size: ${e}em\` și părintele are \`font-size: ${par}px\`. Ce mărime a fontului are elementul?`, `${e * par}px`, [e * 16, e * par + par, e * par - par, e * par * 2, e * par / 2, e + par].map((x) => `${x}px`)))
    const W = pick(range(200, 1000, 40)), p = pick([10, 20, 25, 50, 75]), x = pick([10, 20, 30, 40])
    out.push(mc('CSS', 'Intermediar', `Părintele are lățimea ${W}px. Ce lățime calculată are un copil cu \`width: calc(${p}% - ${x}px)\`?`, `${W * p / 100 - x}px`, [W * p / 100, W * p / 100 + x, W - x, W * p / 100 - 2 * x, (W - x) * p / 100, W * (100 - p) / 100 - x].map((y) => `${y}px`)))
  }
  return out.filter(Boolean)
}

// ============================ REACT ============================
function reactGen(nState, nEffect, nList) {
  const out = []
  const mk = () => pick([
    (d) => ({ code: `setCount(count + ${d})`, apply: (s, snap) => snap + d }),
    (d) => ({ code: `setCount(c => c + ${d})`, apply: (s) => s + d }),
    () => ({ code: 'setCount(c => c * 2)', apply: (s) => s * 2 }),
    (d) => ({ code: `setCount(${d})`, apply: () => d }),
  ])(int(1, 5))
  for (let i = 0; i < nState; i++) {
    const s = int(0, 20), ups = Array.from({ length: int(2, 4) }, mk)
    let state = s
    for (const u of ups) state = u.apply(state, s)
    const text = `Într-un singur handler de click, valoarea \`count\` din render este ${s}. Se apelează, în ordine: ${ups.map((u) => `\`${u.code}\``).join(', ')}. Ce valoare are \`count\` după următorul render?`
    out.push(mc('React', 'Expert', text, state, [state + 1, state - 1, state + 2, s + ups.length, s + 1, state * 2, s].map(String)))
  }
  for (let i = 0; i < nEffect; i++) {
    const len = int(4, 8), deps = Array.from({ length: len }, () => int(1, 3))
    let runs = 1
    for (let k = 1; k < len; k++) if (deps[k] !== deps[k - 1]) runs++
    const pool = range(1, len + 1)
    out.push(mc('React', 'Intermediar', `Un component are \`useEffect(() => { /* ... */ }, [dep])\`. Valorile lui \`dep\` la ${len} randări succesive sunt: ${deps.join(', ')}. De câte ori rulează efectul (fără StrictMode)?`, runs, pool))
    out.push(mc('React', 'Începător', `Un component are \`useEffect(() => { /* ... */ })\` fără array de dependențe și se randează de ${len} ori (fără StrictMode). De câte ori rulează efectul?`, len, [len - 1, len + 1, 1, 0, len * 2]))
    out.push(mc('React', 'Începător', `Un component are \`useEffect(() => { /* ... */ }, [])\` și se randează de ${len} ori (fără StrictMode). De câte ori rulează efectul?`, 1, [len, len - 1, 0, len + 1, 2]))
  }
  for (let i = 0; i < nList; i++) {
    const items = Array.from({ length: int(4, 8) }, () => int(1, 20))
    const t = int(5, 14)
    out.push(mc('React', 'Intermediar', `Se randează \`{${fmtJS(items)}.filter(n => n > ${t}).map(n => <li key={n}>{n}</li>)}\`. Câte elemente <li> apar în DOM?`, items.filter((n) => n > t).length, range(0, items.length + 1)))
    out.push(mc('React', 'Intermediar', `Se randează \`{${fmtJS(items)}.map(n => n % 2 ? <li key={n}>{n}</li> : null)}\`. Câte elemente <li> apar în DOM?`, items.filter((n) => n % 2).length, range(0, items.length + 1)))
  }
  const names = ['Ana', 'Bogdan', 'Carmen', 'Dan', 'Elena', 'Florin', 'Gabriela', 'Horia', 'Irina', 'Luca', 'Maria', 'Paul', 'Radu', 'Sorin', 'Teodora', 'Victor']
  for (const nm of names) {
    const fn = "function Greeting({ name = 'Guest' }) { return <h1>Salut, {name}!</h1> }"
    const cases = [[`<Greeting name="${nm}" />`, `Salut, ${nm}!`], ['<Greeting />', 'Salut, Guest!'], ['<Greeting name={undefined} />', 'Salut, Guest!'], ['<Greeting name={null} />', 'Salut, !'], ['<Greeting name="" />', 'Salut, !']]
    for (const [code, ans] of cases) {
      const pool = [`Salut, ${nm}!`, 'Salut, Guest!', 'Salut, !', 'Salut, null!', 'Salut, undefined!'].map((x) => x)
      out.push(mc('React', 'Expert', `Având \`${fn}\`, ce text afișează \`${code}\` (textul final din <h1>)?`, ans, pool))
    }
  }
  return out.filter(Boolean)
}

// ============================ MONGODB ============================
function mongo(nColl) {
  const out = []
  const NAMES = ['Ana', 'Bogdan', 'Carmen', 'Dan', 'Elena', 'Florin', 'Gabriela', 'Horia', 'Irina', 'Jean', 'Kira', 'Luca', 'Maria', 'Nicu', 'Oana', 'Paul']
  const CITIES = ['Brașov', 'Cluj', 'Iași', 'Sibiu', 'Arad', 'Oradea']
  const TAGS = ['nou', 'promo', 'stoc', 'vip']
  for (let c = 0; c < nColl; c++) {
    const size = int(6, 8)
    const ages = sample(range(18, 60), size), names = sample(NAMES, size)
    const docs = names.map((name, i) => ({ name, age: ages[i], city: pick(CITIES), qty: int(1, 20), tags: sample(TAGS, int(1, 2)) }))
    const show = docs.map((d) => `{ name: '${d.name}', age: ${d.age}, city: '${d.city}', qty: ${d.qty}, tags: [${d.tags.map((t) => `'${t}'`).join(', ')}] }`).join('\n')
    const t = int(25, 45), a = int(20, 30), b = int(a + 8, a + 25), c1 = pick(CITIES), c2 = pick(CITIES), tg = pick(TAGS), q = int(5, 15)
    const qs = sample(docs.map((d) => d.qty), 2)
    const filters = [
      { code: `{ age: { $gt: ${t} } }`, fn: (d) => d.age > t },
      { code: `{ age: { $gte: ${a}, $lte: ${b} } }`, fn: (d) => d.age >= a && d.age <= b },
      { code: `{ city: { $in: ['${c1}', '${c2}'] } }`, fn: (d) => [c1, c2].includes(d.city) },
      { code: `{ city: { $ne: '${c1}' } }`, fn: (d) => d.city !== c1 },
      { code: `{ $or: [{ age: { $lt: ${t} } }, { city: '${c1}' }] }`, fn: (d) => d.age < t || d.city === c1 },
      { code: `{ $and: [{ qty: { $gt: ${q} } }, { tags: '${tg}' }] }`, fn: (d) => d.qty > q && d.tags.includes(tg) },
      { code: `{ tags: { $nin: ['${tg}'] } }`, fn: (d) => !d.tags.includes(tg) },
      { code: `{ qty: { $in: [${qs.join(', ')}] } }`, fn: (d) => qs.includes(d.qty) },
      { code: `{ city: '${c1}', age: { $lt: ${t} } }`, fn: (d) => d.city === c1 && d.age < t },
    ]
    const res = filters.map((f) => docs.filter(f.fn).sort((x, y) => x.age - y.age))
    const nm = (r) => (r.length ? r.map((d) => d.name).join(', ') : 'niciun document')
    const sum = (r) => (r.length ? String(r.reduce((s, d) => s + d.qty, 0)) : 'niciun rezultat (array gol)')
    const head = `Colecția \`people\` conține documentele:\n${show}\n\n`
    filters.forEach((f, i) => {
      const others = res.filter((_, j) => j !== i)
      out.push(mc('MongoDB', 'Intermediar', `${head}Ce returnează \`db.people.countDocuments(${f.code})\`?`, res[i].length, [...others.map((r) => r.length), res[i].length + 1, res[i].length - 1, 0, docs.length].map(String)))
      out.push(mc('MongoDB', 'Expert', `${head}Ce nume returnează \`db.people.find(${f.code}, { name: 1, _id: 0 }).sort({ age: 1 })\`, în ordine?`, nm(res[i]), [...others.map(nm), nm([...res[i]].reverse()), nm(res[i].slice(1)), nm(res[i].slice(0, -1))]))
      out.push(mc('MongoDB', 'Expert', `${head}Ce returnează \`db.people.aggregate([{ $match: ${f.code} }, { $group: { _id: null, total: { $sum: '$qty' } } }])\` (valoarea lui total)?`, sum(res[i]), [...others.map(sum), String(docs.reduce((s, d) => s + d.qty, 0)), String(res[i].length)]))
    })
  }
  return out.filter(Boolean)
}

// ============================ POSTGRESQL ============================
function pgGen(nStr, nNum, nDate, nAgg) {
  const out = []
  const push = (g, tf = (c) => `Ce rezultat returnează interogarea \`${c}\` în PostgreSQL?`) => out.push(...fromGroup('PostgreSQL', 'Intermediar', g, tf, fmtSQL, true))
  for (let i = 0; i < nStr; i++) {
    const w = pick(WORDS), n = int(1, 3), a = int(1, 3), b = int(2, 4), ch = w[int(0, w.length - 1)], pre = w.slice(0, 2)
    push([
      { code: `SELECT UPPER('${w}');`, val: w.toUpperCase() }, { code: `SELECT LENGTH('${w}');`, val: w.length },
      { code: `SELECT LEFT('${w}', ${n});`, val: w.slice(0, n) }, { code: `SELECT RIGHT('${w}', ${n});`, val: w.slice(-n) },
      { code: `SELECT SUBSTRING('${w}' FROM ${a} FOR ${b});`, val: w.substr(a - 1, b), difficulty: 'Expert' },
      { code: `SELECT POSITION('${ch}' IN '${w}');`, val: w.indexOf(ch) + 1, difficulty: 'Expert' },
      { code: `SELECT REPLACE('${w}', '${ch}', '-');`, val: w.split(ch).join('-') }, { code: `SELECT REVERSE('${w}');`, val: [...w].reverse().join('') },
      { code: `SELECT REPEAT('${pre}', 3);`, val: pre.repeat(3) }, { code: `SELECT LPAD('${w}', ${w.length + 3}, '*');`, val: '***' + w },
      { code: `SELECT '${w}' || '_' || LENGTH('${w}');`, val: `${w}_${w.length}` }, { code: `SELECT INITCAP('${w}');`, val: w[0].toUpperCase() + w.slice(1) },
      { code: `SELECT '${w}' LIKE '${pre}%';`, val: true }, { code: `SELECT '${w}' ILIKE '${pre.toUpperCase()}%';`, val: true },
      { code: `SELECT '${w}' LIKE '%zz';`, val: false }, { code: `SELECT SPLIT_PART('${w}', '${ch}', 1);`, val: w.split(ch)[0] },
    ])
  }
  for (let i = 0; i < nNum; i++) {
    const a = int(5, 60), b = int(2, 9), c = int(1, 30), sq = int(2, 12)
    let cents
    do { cents = int(101, 999) } while (cents % 100 === 50 || cents % 10 === 5)
    const x = (cents / 100).toFixed(2)
    push([
      { code: `SELECT ${a} % ${b};`, val: a % b }, { code: `SELECT ${a} / ${b};`, val: Math.floor(a / b), difficulty: 'Expert' }, { code: `SELECT MOD(${a}, ${b});`, val: a % b },
      { code: `SELECT ABS(-${a});`, val: a }, { code: `SELECT POWER(${b}, 3);`, val: b ** 3 }, { code: `SELECT SQRT(${sq * sq});`, val: sq },
      { code: `SELECT GREATEST(${a}, ${b}, ${c});`, val: Math.max(a, b, c) }, { code: `SELECT LEAST(${a}, ${b}, ${c});`, val: Math.min(a, b, c) },
      { code: `SELECT COALESCE(NULL, NULL, ${c});`, val: c }, { code: `SELECT NULLIF(${a}, ${a});`, val: null }, { code: `SELECT NULLIF(${a}, ${b});`, val: a === b ? null : a },
      { code: `SELECT CEIL(${x});`, val: Math.ceil(cents / 100) }, { code: `SELECT FLOOR(${x});`, val: Math.floor(cents / 100) },
      { code: `SELECT ROUND(${x});`, val: Math.round(cents / 100) }, { code: `SELECT ROUND(${x}, 1);`, val: Math.round(cents / 10) / 10, show: (Math.round(cents / 10) / 10).toFixed(1), difficulty: 'Expert' },
      { code: `SELECT TRUNC(${x});`, val: Math.trunc(cents / 100) },
      { code: `SELECT CASE WHEN ${a} > ${c} THEN 'mare' ELSE 'mic' END;`, val: a > c ? 'mare' : 'mic' },
      { code: `SELECT ${a}::text || ${b}::text;`, val: `${a}${b}` }, { code: `SELECT ${a} + NULL;`, val: null, difficulty: 'Expert' }, { code: `SELECT ${a} = NULL;`, val: null, difficulty: 'Expert' }, { code: `SELECT ${a} IS NOT NULL;`, val: true },
    ])
  }
  const iso = (d) => d.toISOString().slice(0, 10)
  for (let i = 0; i < nDate; i++) {
    const d = new Date(Date.UTC(int(2023, 2025), int(0, 11), int(1, 28)))
    const e = new Date(d.getTime() + int(3, 200) * 86400000)
    const k = int(2, 45), s = iso(d), t = iso(e)
    push([
      { code: `SELECT DATE '${s}' + ${k};`, val: iso(new Date(d.getTime() + k * 86400000)) },
      { code: `SELECT DATE '${t}' - DATE '${s}';`, val: Math.round((e - d) / 86400000) },
      { code: `SELECT EXTRACT(MONTH FROM DATE '${s}');`, val: d.getUTCMonth() + 1 }, { code: `SELECT EXTRACT(YEAR FROM DATE '${s}');`, val: d.getUTCFullYear() },
      { code: `SELECT EXTRACT(DAY FROM DATE '${s}');`, val: d.getUTCDate() }, { code: `SELECT EXTRACT(DOW FROM DATE '${s}');`, val: d.getUTCDay(), difficulty: 'Expert' },
      { code: `SELECT TO_CHAR(DATE '${s}', 'DD.MM.YYYY');`, val: `${s.slice(8)}.${s.slice(5, 7)}.${s.slice(0, 4)}` }, { code: `SELECT TO_CHAR(DATE '${s}', 'YYYY-MM');`, val: s.slice(0, 7) },
    ])
  }
  for (let i = 0; i < nAgg; i++) {
    const len = int(4, 6), withNull = rand() < 0.5
    const vals = Array.from({ length: len }, () => (withNull && rand() < 0.35 ? null : int(1, 20)))
    const nn = vals.filter((v) => v !== null)
    if (nn.length < 3) continue
    const from = `FROM (VALUES ${vals.map((v) => `(${v === null ? 'NULL' : v})`).join(', ')}) AS t(x)`
    const th = int(4, 12)
    const asc = [...nn].sort((p, q) => p - q).concat(vals.filter((v) => v === null))
    const desc = vals.filter((v) => v === null).concat([...nn].sort((p, q) => q - p))
    const filt = nn.filter((v) => v > th)
    push([
      { code: `SELECT COUNT(*) ${from};`, val: vals.length }, { code: `SELECT COUNT(x) ${from};`, val: nn.length, difficulty: 'Expert' },
      { code: `SELECT SUM(x) ${from};`, val: nn.reduce((s, v) => s + v, 0) }, { code: `SELECT MAX(x) ${from};`, val: Math.max(...nn) }, { code: `SELECT MIN(x) ${from};`, val: Math.min(...nn) },
      { code: `SELECT COUNT(DISTINCT x) ${from};`, val: new Set(nn).size }, { code: `SELECT SUM(DISTINCT x) ${from};`, val: [...new Set(nn)].reduce((s, v) => s + v, 0) },
      { code: `SELECT SUM(x) FILTER (WHERE x > ${th}) ${from};`, val: filt.length ? filt.reduce((s, v) => s + v, 0) : null, difficulty: 'Expert' },
      { code: `SELECT x ${from} ORDER BY x LIMIT 1 OFFSET 1;`, val: asc[1], difficulty: 'Expert' },
      { code: `SELECT x ${from} ORDER BY x DESC LIMIT 1;`, val: desc[0], difficulty: 'Expert' },
    ])
  }
  return out
}

// ============================ NODE.JS ============================
function nodeGen(nPath, nBuf, nUrl) {
  const out = []
  const DIRS = ['usr', 'var', 'srv', 'app', 'src', 'lib', 'config', 'public', 'dist', 'node_modules', 'logs', 'etc', 'home', 'opt', 'routes', 'models']
  const FILES = ['index.js', 'server.ts', 'app.mjs', 'config.json', 'router.js', 'utils.test.js', 'main.css', 'README.md', 'archive.tar.gz', 'db.sql', 'page.html', '.gitignore']
  const N = (code, val, d = 'Intermediar') => ({ code, val, difficulty: d })
  const nodeTxt = (c) => `Ce returnează \`${c}\` în Node.js?`
  for (let i = 0; i < nPath; i++) {
    const [d1, d2, d3, d4] = sample(DIRS, 4), f = pick(FILES), p = `/${d1}/${d2}/${f}`
    const ext = path.extname(f)
    out.push(...fromGroup('Node.js', 'Intermediar', [
      N(`path.basename('${p}')`, path.basename(p)), N(`path.extname('${p}')`, path.extname(p), 'Expert'), N(`path.dirname('${p}')`, path.dirname(p)),
      N(`path.basename('${p}', '${ext}')`, path.basename(p, ext), 'Expert'), N(`path.parse('${p}').name`, path.parse(p).name, 'Expert'), N(`path.isAbsolute('${p}')`, true),
      N(`path.join('/${d1}', '${d2}', '../${d3}', '${f}')`, path.join(`/${d1}`, d2, `../${d3}`, f)),
      N(`path.normalize('/${d1}//${d2}/./${d3}/../${d4}')`, path.normalize(`/${d1}//${d2}/./${d3}/../${d4}`)),
      N(`path.relative('/${d1}/${d2}', '/${d1}/${d3}/${d4}')`, path.relative(`/${d1}/${d2}`, `/${d1}/${d3}/${d4}`), 'Expert'),
      N(`path.resolve('/${d1}', '${d2}', '../${d3}')`, path.resolve(`/${d1}`, d2, `../${d3}`), 'Expert'),
    ], nodeTxt))
  }
  const BW = ['țară', 'băiat', 'școală', 'înțeles', 'mâncare', 'pădure', 'cafea', 'iarnă', 'ședință', 'fereastră', 'mărțișor', 'București', 'Brașov', 'Iași', 'Timișoara', 'Constanța', 'Cluj', 'date', 'server', 'test', 'cod', 'șarpe', 'aer', 'Ștefan', 'înot']
  for (let i = 0; i < nBuf; i++) {
    const w = BW[i % BW.length] + (i >= BW.length ? pick(['1', '22', '_x', '-ro', '!']) : '')
    const B = Buffer.from(w)
    out.push(...fromGroup('Node.js', 'Intermediar', [
      N(`Buffer.byteLength('${w}')`, Buffer.byteLength(w), 'Expert'), N(`'${w}'.length`, w.length), N(`Buffer.from('${w}').length`, B.length, 'Expert'),
      N(`Buffer.from('${w}').toString('hex')`, B.toString('hex'), 'Expert'), N(`Buffer.from('${w}').toString('base64')`, B.toString('base64'), 'Expert'), N(`Buffer.from('${w}')[0]`, B[0]),
    ], nodeTxt))
  }
  const HOSTS = ['exemplu.ro', 'api.exemplu.com', 'localhost', 'shop.brasov.ro', 'cdn.site.io']
  for (let i = 0; i < nUrl; i++) {
    const proto = pick(['http', 'https']), host = pick(HOSTS), port = pick([null, 8080, 3000, 443, 80, 5432, 4000])
    const p = '/' + sample(['v1', 'users', 'orders', 'api', 'blog', 'docs', 'items'], int(1, 3)).join('/')
    const k = pick(['id', 'page', 'q', 'lang']), v = pick(['7', '42', 'node', 'ro', '3'])
    const hash = pick(['', '#top', '#sec2'])
    const s = `${proto}://${host}${port ? ':' + port : ''}${p}?${k}=${v}${hash}`
    const u = new URL(s)
    out.push(...fromGroup('Node.js', 'Intermediar', [
      N(`new URL('${s}').hostname`, u.hostname), N(`new URL('${s}').host`, u.host, 'Expert'), N(`new URL('${s}').port`, u.port, 'Expert'), N(`new URL('${s}').pathname`, u.pathname),
      N(`new URL('${s}').search`, u.search), N(`new URL('${s}').origin`, u.origin, 'Expert'), N(`new URL('${s}').protocol`, u.protocol), N(`new URL('${s}').searchParams.get('${k}')`, u.searchParams.get(k)),
      N(`new URL('${s}').hash`, u.hash, 'Expert'),
    ], nodeTxt))
  }
  for (const [alg, hex, b64] of [['md5', 32, 24], ['sha1', 40, 28], ['sha256', 64, 44], ['sha512', 128, 88]]) {
    out.push(mc('Node.js', 'Expert', `Câte caractere are rezultatul \`crypto.createHash('${alg}').update('x').digest('hex')\`?`, hex, [32, 40, 64, 128, 16, 56].map(String)))
    out.push(mc('Node.js', 'Expert', `Câte caractere are rezultatul \`crypto.createHash('${alg}').update('x').digest('base64')\`?`, b64, [24, 28, 44, 88, 32, 64].map(String)))
  }
  return out.filter(Boolean)
}

// ============================ EXPRESS ============================
function expressGen(nParams, nQuery, nMw) {
  const out = []
  const routes = ['/users/:id', '/users/:userId/posts/:postId', '/products/:category/:id', '/orders/:orderId/items/:itemId', '/blog/:year/:month/:slug', '/api/v1/teams/:teamId/members/:memberId']
  const vals = { id: () => String(int(1, 999)), userId: () => String(int(1, 999)), postId: () => String(int(1, 99)), category: () => pick(['carti', 'laptop', 'jocuri', 'haine']), orderId: () => String(int(1000, 9999)), itemId: () => String(int(1, 20)), year: () => String(int(2020, 2026)), month: () => String(int(1, 12)).padStart(2, '0'), slug: () => pick(['express-intro', 'mongo-index', 'css-grid', 'react-hooks']), teamId: () => String(int(1, 50)), memberId: () => String(int(1, 500)) }
  for (let i = 0; i < nParams; i++) {
    const r = pick(routes), names = [...r.matchAll(/:(\w+)/g)].map((m) => m[1])
    const got = Object.fromEntries(names.map((n) => [n, vals[n]()]))
    const url = names.reduce((u, n) => u.replace(`:${n}`, got[n]), r)
    const target = pick(names), val = got[target]
    const pool = [...names.filter((n) => n !== target).map((n) => `'${got[n]}'`), ...(/^\d+$/.test(val) ? [String(Number(val)), `'${Number(val) + 1}'`] : [`'${val.toUpperCase()}'`]), 'undefined', `'${target}'`]
    out.push(mc('Express', 'Intermediar', `Pentru \`app.get('${r}', handler)\` și cererea \`GET ${url}\`, ce valoare are \`req.params.${target}\`?`, `'${val}'`, pool))
    out.push(mc('Express', 'Intermediar', `Pentru \`app.get('${r}', handler)\` și cererea \`GET ${url}\`, ce tip are \`req.params.${target}\`?`, /^\d+$/.test(val) ? 'string' : 'string', ['number', 'object', 'undefined', 'boolean']))
    out.push(mc('Express', 'Începător', `Pentru \`app.get('${r}', handler)\` și cererea \`GET ${url}\`, câte chei are \`Object.keys(req.params)\`?`, names.length, [names.length + 1, names.length - 1, 0, names.length + 2, 1, 4].map(String)))
  }
  for (let i = 0; i < nQuery; i++) {
    const keys = { q: ['node', 'react', 'mongo', 'css', 'postgres'], page: ['1', '2', '3', '10', '25'], limit: ['5', '10', '20', '50'], sort: ['asc', 'desc', 'name', 'date'], tag: ['a', 'b', 'nou', 'promo'], lang: ['ro', 'en', 'de'] }
    const chosen = sample(Object.keys(keys), int(2, 4))
    const pairs = chosen.map((k) => [k, pick(keys[k])])
    if (rand() < 0.3) { const k = pick(chosen); pairs.push([k, pick(keys[k].filter((x) => x !== pairs.find((p) => p[0] === k)[1]))]) }
    const q = {}
    for (const [k, v] of pairs) q[k] = q[k] === undefined ? v : Array.isArray(q[k]) ? [...q[k], v] : [q[k], v]
    const url = '/search?' + pairs.map(([k, v]) => `${k}=${v}`).join('&')
    const ask = pick(Object.keys(q))
    const absent = Object.keys(keys).find((k) => !(k in q))
    const pool = [...Object.values(q).map(fmtJS), 'undefined', 'null', `[${fmtJS(q[ask])}]`]
    out.push(mc('Express', 'Intermediar', `Pentru cererea \`GET ${url}\` într-o aplicație Express, ce returnează \`req.query.${ask}\`?`, fmtJS(q[ask]), pool))
    out.push(mc('Express', 'Intermediar', `Pentru cererea \`GET ${url}\`, câte chei are \`Object.keys(req.query)\`?`, Object.keys(q).length, range(0, 6).map(String)))
    if (absent) out.push(mc('Express', 'Intermediar', `Pentru cererea \`GET ${url}\`, ce returnează \`req.query.${absent}\`?`, 'undefined', ["''", 'null', '0', 'false', 'NaN']))
    if (q.page && typeof q.page === 'string') out.push(mc('Express', 'Expert', `Pentru cererea \`GET ${url}\`, ce returnează \`req.query.page + 1\`?`, fmtJS(q.page + 1), [`${Number(q.page) + 1}`, 'NaN', `'${Number(q.page) + 1}'`, `'${q.page}'`, 'undefined']))
  }
  const mws = ['logger', 'cors', 'helmet', 'auth', 'rateLimiter', 'bodyParser', 'compression', 'cookieParser', 'session', 'validator']
  const arrow = (a) => a.join(' → ')
  for (let i = 0; i < nMw; i++) {
    const three = sample(mws, 3)
    const reg = three.map((m) => `app.use(${m})`).join('; ') + "; app.get('/x', handler)"
    out.push(mc('Express', 'Intermediar', `Se înregistrează: \`${reg}\`. Fiecare middleware apelează \`next()\`. În ce ordine rulează pentru \`GET /x\`?`, arrow([...three, 'handler']), [arrow([...three].reverse().concat('handler')), arrow(['handler', ...three]), arrow([three[1], three[0], three[2], 'handler']), arrow([three[0], 'handler', three[1], three[2]]), arrow([three[2], three[0], three[1], 'handler'])]))
    const m = int(0, 2)
    out.push(mc('Express', 'Expert', `Se înregistrează: \`${reg}\`. Middleware-ul \`${three[m]}\` trimite \`res.status(401).send()\` și NU apelează \`next()\`. Ce rulează pentru \`GET /x\`?`, arrow(three.slice(0, m + 1)), [arrow([...three, 'handler']), arrow(three.slice(0, m)), arrow([...three.slice(0, m + 1), 'handler']), arrow(three.slice(m)), 'niciunul']))
    out.push(mc('Express', 'Expert', `Se înregistrează: \`${reg}; app.use(errorHandler)\`. Handlerul aruncă o eroare sincronă, iar toate middleware-urile apelează \`next()\`. Ce rulează, în ordine?`, arrow([...three, 'handler', 'errorHandler']), [arrow([...three, 'errorHandler']), arrow(['errorHandler', ...three, 'handler']), arrow([...three, 'handler']), arrow(['handler', 'errorHandler']), arrow([three[0], 'errorHandler', three[1], three[2], 'handler'])]))
  }
  const codes = [[100, 'Continue'], [101, 'Switching Protocols'], [200, 'OK'], [201, 'Created'], [202, 'Accepted'], [204, 'No Content'], [206, 'Partial Content'], [301, 'Moved Permanently'], [302, 'Found'], [304, 'Not Modified'], [307, 'Temporary Redirect'], [308, 'Permanent Redirect'], [400, 'Bad Request'], [401, 'Unauthorized'], [403, 'Forbidden'], [404, 'Not Found'], [405, 'Method Not Allowed'], [409, 'Conflict'], [410, 'Gone'], [415, 'Unsupported Media Type'], [422, 'Unprocessable Entity'], [429, 'Too Many Requests'], [500, 'Internal Server Error'], [501, 'Not Implemented'], [502, 'Bad Gateway'], [503, 'Service Unavailable'], [504, 'Gateway Timeout']]
  for (const [c, name] of codes) {
    out.push(mc('Express', 'Începător', `Ce denumire standard are codul HTTP ${c}?`, name, codes.filter((x) => x[0] !== c).map((x) => x[1])))
    out.push(mc('Express', 'Începător', `Ce cod HTTP are denumirea „${name}”?`, c, codes.filter((x) => x[0] !== c).map((x) => x[0]).map(String)))
  }
  const scen = [[201, 'creezi cu succes o resursă nouă printr-un POST'], [204, 'ștergi o resursă și nu returnezi niciun corp'], [400, 'body-ul JSON din cerere este invalid'], [401, 'clientul nu este autentificat'], [403, 'clientul este autentificat dar nu are dreptul de acces'], [404, 'resursa cerută nu există'], [405, 'ruta există dar metoda HTTP nu este permisă'], [409, 'există deja un utilizator cu același email'], [422, 'datele sunt bine formatate dar nu trec validarea de business'], [429, 'clientul a depășit limita de cereri'], [500, 'apare o eroare neașteptată în server'], [503, 'serverul este în mentenanță'], [301, 'resursa s-a mutat definitiv la alt URL'], [304, 'resursa nu s-a modificat față de versiunea din cache']]
  for (const [c, s] of scen) out.push(mc('Express', 'Intermediar', `Ce status ar trebui să trimiți cu \`res.status(...)\` când ${s}?`, c, codes.map((x) => x[0]).filter((x) => x !== c).map(String)))
  return out.filter(Boolean)
}

function generateAll() {
  const parts = {
    JavaScript: [...jsArrays(110), ...jsStrings(90), ...jsCoercion()],
    Tailwind: tailwind(),
    CSS: [...cssTable(), ...cssComputed(250)],
    React: reactGen(450, 250, 150),
    MongoDB: mongo(60),
    PostgreSQL: pgGen(90, 90, 100, 100),
    'Node.js': nodeGen(150, 60, 110),
    Express: expressGen(200, 200, 300),
  }
  const seen = new Set()
  const out = []
  for (const [cat, list] of Object.entries(parts)) {
    let n = 0
    for (const q of list) {
      if (!q || seen.has(q.text)) continue
      seen.add(q.text)
      out.push(q)
      n++
    }
    if (process.env.DEBUG_GEN) console.log(cat, n)
  }
  return out
}

module.exports = { generateAll }