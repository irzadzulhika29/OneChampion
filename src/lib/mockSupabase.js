/**
 * Mock Supabase client backed by localStorage.
 * Used automatically when VITE_SUPABASE_URL is missing.
 * Provides enough surface area for the app to run fully offline as a demo.
 */

const DB_KEY = 'onechampion_db'
const SESSION_KEY = 'onechampion_session'
const STORAGE_KEY = 'onechampion_storage'
const DEMO_USER_ID = 'demo-user-0001'

function uid() {
  // crypto.randomUUID if available, else fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch (e) {
    console.warn('localStorage write failed', e)
  }
}

function seedDb() {
  const now = new Date()
  const userId = DEMO_USER_ID
  const tim1Id = uid()
  const tim2Id = uid()
  const lomba = []

  // Sample lomba data
  const samples = [
    {
      judul: 'Gemastik XVII 2026 - Programming',
      penyelenggara: 'Kemendiktisaintek',
      kategori: 'programming',
      tanggal_mulai: futureDate(now, 14),
      tanggal_selesai: futureDate(now, 16),
      deadline_pendaftaran: futureDate(now, 7),
      deadline_submission: futureDate(now, 21),
      tanggal_final: futureDate(now, 28),
      lokasi: 'Universitas Indonesia, Jakarta',
      online: false,
      biaya_pendaftaran: 150000,
      hadiah: 'Rp 10.000.000 + Sertifikat Nasional',
      status: 'terdaftar',
      url_pendaftaran: 'https://gemastik.kemdikbud.go.id',
      document_url: 'https://drive.google.com/file/d/abc123/guidebook-gemastik',
      pic_nama: 'Dr. Rini Widya',
      pic_kontak: '081234567000',
      catatan: 'Bawa laptop sendiri. Tim: 2 orang.',
      tim_id: tim1Id,
    },
    {
      judul: 'Hackathon Merdeka 2026',
      penyelenggara: 'BSSN x Dicoding',
      kategori: 'hackathon',
      tanggal_mulai: futureDate(now, 21),
      deadline_pendaftaran: futureDate(now, 5),
      deadline_submission: futureDate(now, 14),
      tanggal_final: futureDate(now, 35),
      lokasi: 'Online + Final di Jakarta',
      online: true,
      biaya_pendaftaran: 0,
      hadiah: 'Rp 25.000.000',
      status: 'rencana',
      url_pendaftaran: 'https://hackathonmerdeka.id',
      document_url: 'https://hackathonmerdeka.id/rules',
      pic_nama: 'Andika Pratama',
      pic_kontak: 'pic@hackathonmerdeka.id',
      tim_id: tim1Id,
    },
    {
      judul: 'Web Design Competition',
      penyelenggara: 'Universitas Brawijaya',
      kategori: 'design',
      tanggal_mulai: futureDate(now, 30),
      deadline_pendaftaran: futureDate(now, 12),
      deadline_submission: futureDate(now, 22),
      tanggal_final: futureDate(now, 45),
      lokasi: 'Universitas Brawijaya, Malang',
      online: false,
      biaya_pendaftaran: 75000,
      hadiah: 'Rp 3.000.000',
      status: 'rencana',
      pic_nama: 'Siti Aminah, M.Kom',
      pic_kontak: '081234567111',
    },
    {
      judul: 'AI/ML Summit Challenge',
      penyelenggara: 'Tokopedia',
      kategori: 'ai-ml',
      tanggal_mulai: futureDate(now, 45),
      deadline_pendaftaran: futureDate(now, 20),
      deadline_submission: futureDate(now, 40),
      tanggal_final: futureDate(now, 60),
      lokasi: 'Online',
      online: true,
      biaya_pendaftaran: 0,
      hadiah: 'Magang + Rp 15.000.000',
      status: 'rencana',
      url_pendaftaran: 'https://aimlsummit.tokopedia.com',
      pic_nama: 'Budi Hartono',
      pic_kontak: '081234567222',
      tim_id: tim2Id,
    },
    {
      judul: 'Mobile Development Contest',
      penyelenggara: 'Institut Teknologi Bandung',
      kategori: 'mobile',
      tanggal_mulai: pastDate(now, 30),
      tanggal_selesai: pastDate(now, 28),
      lokasi: 'ITB, Bandung',
      online: false,
      biaya_pendaftaran: 100000,
      hadiah: 'Rp 5.000.000',
      status: 'selesai',
      pic_nama: 'Prof. Hendro',
      pic_kontak: '081234567333',
      tim_id: tim1Id,
    },
    {
      judul: 'Data Science Olympics 2025',
      penyelenggara: 'BPS',
      kategori: 'data-science',
      tanggal_mulai: pastDate(now, 60),
      lokasi: 'Online',
      online: true,
      biaya_pendaftaran: 0,
      hadiah: 'Beasiswa S2',
      status: 'selesai',
      pic_nama: 'Dr. Siti',
      pic_kontak: 'pic.dso@bps.go.id',
      tim_id: tim2Id,
    },
  ]

  samples.forEach((s) => {
    lomba.push({
      id: uid(),
      owner_id: userId,
      ...s,
      created_at: pastDate(now, 30 + Math.random() * 60),
      updated_at: pastDate(now, Math.random() * 30),
    })
  })

  // Results for completed lomba
  const completed = lomba.filter((l) => l.status === 'selesai')
  const hasil = completed.map((l) => ({
    id: uid(),
    lomba_id: l.id,
    peringkat: l.judul.includes('Mobile') ? 'Juara 2' : 'Finalis',
    predikat: l.judul.includes('Mobile') ? 'Silver Medal' : 'Honorable Mention',
    poin: l.judul.includes('Mobile') ? 85 : 70,
    catatan: 'Pengalaman berharga!',
    created_at: l.tanggal_mulai,
  }))

  // Tim with anggota
  const tim = [
    {
      id: tim1Id,
      owner_id: userId,
      nama: 'Tim Cendekia',
      deskripsi: 'Tim programming untuk lomba IT/Tech.',
      created_at: pastDate(now, 90),
    },
    {
      id: tim2Id,
      owner_id: userId,
      nama: 'Tim DataWave',
      deskripsi: 'Spesialis data science & AI/ML.',
      created_at: pastDate(now, 60),
    },
  ]

  const anggota = [
    { id: uid(), tim_id: tim1Id, nama: 'Andi Pratama', email: 'andi@email.com', nim: '210101001', prodi: 'Teknik Informatika', no_hp: '081234567890', peran: 'ketua', kontak: '081234567890' },
    { id: uid(), tim_id: tim1Id, nama: 'Budi Santoso', email: 'budi@email.com', nim: '210101002', prodi: 'Teknik Informatika', no_hp: '081234567891', peran: 'anggota', kontak: '081234567891' },
    { id: uid(), tim_id: tim1Id, nama: 'Citra Lestari', email: 'citra@email.com', nim: '210101003', prodi: 'Sistem Informasi', no_hp: '081234567892', peran: 'anggota', kontak: '081234567892' },
    { id: uid(), tim_id: tim2Id, nama: 'Dewi Anggraini', email: 'dewi@email.com', nim: '210102001', prodi: 'Sains Data', no_hp: '081234567893', peran: 'ketua', kontak: '081234567893' },
    { id: uid(), tim_id: tim2Id, nama: 'Eko Wibowo', email: 'eko@email.com', nim: '210102002', prodi: 'Sains Data', no_hp: '081234567894', peran: 'anggota', kontak: '081234567894' },
  ]

  return {
    profiles: [{ id: userId, full_name: 'Demo User', avatar_url: null, created_at: pastDate(now, 90) }],
    tim,
    anggota_tim: anggota,
    lomba,
    hasil,
    lampiran: [],
    reminders: [],
    push_subscriptions: [],
  }
}

/**
 * Build a Date `days` offset from `from`. Returns a Date object so callers
 * can choose `.toISOString()` (timestamp) or `.toISOString().slice(0,10)` (date).
 */
function offsetDate(from, days) {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d
}

function futureDate(from, days) {
  return offsetDate(from, days).toISOString().slice(0, 10)
}
function pastDate(from, days) {
  return offsetDate(from, days).toISOString()
}

function loadDb() {
  let db = readJSON(DB_KEY, null)
  // Validate schema; if any core field missing, re-seed (handles partial/corrupt state)
  if (!db || !db.profiles || !Array.isArray(db.lomba) || !Array.isArray(db.tim)) {
    db = seedDb()
    writeJSON(DB_KEY, db)
  }
  return db
}
function saveDb(db) {
  writeJSON(DB_KEY, db)
}

function loadSession() {
  return readJSON(SESSION_KEY, null)
}
function saveSession(s) {
  if (s) writeJSON(SESSION_KEY, s)
  else localStorage.removeItem(SESSION_KEY)
}

function makeSession(email = 'demo@onechampion.app', name = 'Demo User') {
  return {
    access_token: 'mock-token-' + Date.now(),
    token_type: 'bearer',
    user: {
      id: DEMO_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { full_name: name },
      app_metadata: { provider: 'mock' },
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    refresh_token: 'mock-refresh',
  }
}

/**
 * Expand relation fields in select string.
 * '*,tim(nama)' → adds row.tim = { nama: ... } or null
 * 'anggota_tim(count)' → counts of related rows (handled separately)
 */
function expandJoins(row, table, selectFields, db) {
  if (selectFields === '*' || !selectFields.includes('(')) return row
  const out = { ...row }
  const parts = selectFields.split(',').map((s) => s.trim())
  for (const p of parts) {
    const m = p.match(/^(\w+)\((.+)\)$/)
    if (m) {
      const [, rel, fields] = m
      if (fields === 'count') {
        const related = db[rel] || []
        out[rel] = [{ count: related.filter((r) => r.tim_id === row.id).length }]
      } else if (fields === '*') {
        const related = db[rel] || []
        out[rel] = related.filter((r) => r.tim_id === row.id)
      } else {
        const fkMap = { tim: 'tim_id', lomba: 'lomba_id', hasil: 'lomba_id', anggota_tim: 'tim_id', lampiran: 'lomba_id' }
        const fk = fkMap[rel] || `${rel}_id`
        const related = db[rel] || []
        const found = related.find((r) => r[fk] === row.id)
        if (found) {
          const projected = {}
          fields.split(',').forEach((f) => {
            const trimmed = f.trim()
            projected[trimmed] = found[trimmed]
          })
          out[rel] = projected
        } else {
          out[rel] = null
        }
      }
    }
  }
  return out
}

function parseSelectFields(selectFields) {
  // returns top-level joins
  const joins = []
  if (!selectFields || selectFields === '*') return joins
  selectFields.split(',').forEach((p) => {
    const m = p.trim().match(/^(\w+)\((.+)\)$/)
    if (m) joins.push({ rel: m[1], fields: m[2] })
  })
  return joins
}

function createQuery(table) {
  const db = loadDb()
  let filters = []
  let selectFields = '*'
  let orderBy = null
  let limitN = null
  let mode = null
  let values = null
  let singleMode = false

  const builder = {}

  builder.select = (fields) => {
    selectFields = fields || '*'
    return builder
  }
  builder.eq = (field, val) => {
    filters.push((row) => row[field] === val)
    return builder
  }
  builder.neq = (field, val) => {
    filters.push((row) => row[field] !== val)
    return builder
  }
  builder.gt = (field, val) => {
    filters.push((row) => row[field] > val)
    return builder
  }
  builder.gte = (field, val) => {
    filters.push((row) => row[field] >= val)
    return builder
  }
  builder.lt = (field, val) => {
    filters.push((row) => row[field] < val)
    return builder
  }
  builder.lte = (field, val) => {
    filters.push((row) => row[field] <= val)
    return builder
  }
  builder.ilike = (field, pattern) => {
    const cleaned = String(pattern).replace(/%/g, '').toLowerCase()
    filters.push((row) => String(row[field] ?? '').toLowerCase().includes(cleaned))
    return builder
  }
  builder.in = (field, arr) => {
    const set = new Set(arr)
    filters.push((row) => set.has(row[field]))
    return builder
  }
  builder.or = (expr) => {
    // parse "field.op.value,field2.op2.value2"
    const parts = expr.split(',').map((s) => s.trim())
    const orFilters = []
    for (const part of parts) {
      const m = part.match(/^(\w+)\.(eq|ilike|neq)\.(.+)$/)
      if (m) {
        const [, f, op, v] = m
        if (op === 'ilike') {
          const cleaned = v.replace(/%/g, '').toLowerCase()
          orFilters.push((row) => String(row[f] ?? '').toLowerCase().includes(cleaned))
        } else if (op === 'eq') {
          orFilters.push((row) => row[f] === v)
        } else if (op === 'neq') {
          orFilters.push((row) => row[f] !== v)
        }
      }
    }
    if (orFilters.length) {
      filters.push((row) => orFilters.some((f) => f(row)))
    }
    return builder
  }
  builder.order = (field, opts = {}) => {
    orderBy = { field, ascending: opts.ascending !== false }
    return builder
  }
  builder.limit = (n) => {
    limitN = n
    return builder
  }
  builder.range = (from, to) => {
    limitN = to - from + 1
    return builder
  }
  builder.insert = (v) => {
    mode = 'insert'
    values = v
    return builder
  }
  builder.update = (v) => {
    mode = 'update'
    values = v
    return builder
  }
  builder.delete = () => {
    mode = 'delete'
    return builder
  }
  builder.upsert = (v, opts = {}) => {
    mode = 'upsert'
    values = v
    builder._upsertOpts = opts
    return builder
  }
  builder.single = () => {
    singleMode = true
    return builder
  }
  builder.maybeSingle = () => {
    singleMode = true
    return builder
  }

  // Make builder thenable so it can be awaited directly
  builder.then = (resolve, reject) => {
    try {
      const out = execute()
      return Promise.resolve(out).then(resolve, reject)
    } catch (e) {
      return Promise.reject(e).then(resolve, reject)
    }
  }

  function execute() {
    const tableData = db[table] || []
    const session = loadSession()
    const userId = session?.user?.id

    if (mode === 'insert') {
      const arr = Array.isArray(values) ? values : [values]
      const inserted = arr.map((v) => ({
        id: v.id || uid(),
        owner_id: v.owner_id || userId || DEMO_USER_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...v,
      }))
      db[table] = [...(db[table] || []), ...inserted]
      saveDb(db)
      // RLS: owner must match
      const visible = inserted.filter((r) => !userId || r.owner_id === userId)
      const data = visible.length === 1 && !singleMode && arr.length === 1 ? visible[0] : visible
      return { data, error: null }
    }

    if (mode === 'update') {
      const rows = (db[table] || []).filter((r) => filters.every((f) => f(r)))
      const updated = rows.map((r) => ({
        ...r,
        ...values,
        updated_at: new Date().toISOString(),
      }))
      db[table] = (db[table] || []).map((r) => {
        const u = updated.find((x) => x.id === r.id)
        return u || r
      })
      saveDb(db)
      if (singleMode) {
        return { data: updated[0] || null, error: updated[0] ? null : { message: 'No rows' } }
      }
      return { data: updated, error: null }
    }

    if (mode === 'delete') {
      const rows = (db[table] || []).filter((r) => filters.every((f) => f(r)))
      const ids = new Set(rows.map((r) => r.id))
      db[table] = (db[table] || []).filter((r) => !ids.has(r.id))
      saveDb(db)
      return { data: null, error: null }
    }

    if (mode === 'upsert') {
      const arr = Array.isArray(values) ? values : [values]
      const conflictCol = builder._upsertOpts?.onConflict || 'id'
      const updated = []
      for (const v of arr) {
        const existingIdx = (db[table] || []).findIndex((r) => r[conflictCol] === v[conflictCol])
        if (existingIdx >= 0) {
          db[table][existingIdx] = { ...db[table][existingIdx], ...v, updated_at: new Date().toISOString() }
          updated.push(db[table][existingIdx])
        } else {
          const newRow = {
            id: v.id || uid(),
            owner_id: v.owner_id || userId || DEMO_USER_ID,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...v,
          }
          db[table] = [...(db[table] || []), newRow]
          updated.push(newRow)
        }
      }
      saveDb(db)
      return { data: updated, error: null }
    }

    // SELECT
    let rows = (db[table] || []).filter((r) => filters.every((f) => f(r)))
    // Simulate owner_id RLS: if user is logged in, only show own rows
    if (userId && ['tim', 'lomba', 'profiles', 'reminders'].includes(table)) {
      rows = rows.filter((r) => r.owner_id === userId || r.id === userId)
    }
    if (orderBy) {
      rows.sort((a, b) => {
        const av = a[orderBy.field]
        const bv = b[orderBy.field]
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return orderBy.ascending ? cmp : -cmp
      })
    }
    // Expand joins
    const joins = parseSelectFields(selectFields)
    if (joins.length > 0) {
      rows = rows.map((r) => expandJoins(r, table, selectFields, db))
    }
    if (limitN) rows = rows.slice(0, limitN)
    if (singleMode) {
      return { data: rows[0] || null, error: null }
    }
    return { data: rows, error: null }
  }

  return builder
}

const authListeners = new Set()

function notifyAuth(event, session) {
  saveSession(session)
  authListeners.forEach((cb) => {
    try {
      cb(event, session)
    } catch (e) {
      console.error('auth listener error', e)
    }
  })
}

const auth = {
  async getSession() {
    let session = loadSession()
    if (!session) {
      // Auto-login as demo user in mock mode
      session = makeSession()
      saveSession(session)
    }
    return { data: { session }, error: null }
  },
  async getUser() {
    let session = loadSession()
    if (!session) {
      session = makeSession()
      saveSession(session)
    }
    return { data: { user: session.user }, error: null }
  },
  onAuthStateChange(cb) {
    authListeners.add(cb)
    // Fire immediately with current session
    setTimeout(() => {
      const session = loadSession()
      cb(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
    }, 0)
    return {
      data: {
        subscription: {
          unsubscribe: () => authListeners.delete(cb),
        },
      },
    }
  },
  async signInWithPassword({ email }) {
    const session = makeSession(email)
    notifyAuth('SIGNED_IN', session)
    return { data: { user: session.user, session }, error: null }
  },
  async signUp({ email, options }) {
    const session = makeSession(email, options?.data?.full_name)
    notifyAuth('SIGNED_UP', session)
    return { data: { user: session.user, session }, error: null }
  },
  async signInWithOAuth({ options }) {
    const session = makeSession('demo@onechampion.app', 'Demo User')
    notifyAuth('SIGNED_IN', session)
    // In mock, simulate redirect by going back to root
    if (typeof window !== 'undefined' && options?.redirectTo) {
      setTimeout(() => {
        window.location.href = options.redirectTo
      }, 100)
    }
    return { data: null, error: null }
  },
  async signOut() {
    notifyAuth('SIGNED_OUT', null)
    return { error: null }
  },
  admin: {
    async getUserById(id) {
      return { data: { user: { id, email: 'demo@onechampion.app' } }, error: null }
    },
  },
}

const storage = {
  from(bucket) {
    return {
      async upload(path, file) {
        const files = readJSON(STORAGE_KEY, {})
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          files[path] = {
            dataUrl,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          }
          writeJSON(STORAGE_KEY, files)
          return { data: { path }, error: null }
        } catch (e) {
          return { data: null, error: { message: e.message } }
        }
      },
      async remove(paths) {
        const files = readJSON(STORAGE_KEY, {})
        paths.forEach((p) => delete files[p])
        writeJSON(STORAGE_KEY, files)
        return { data: null, error: null }
      },
      async createSignedUrl(path, _expiresIn) {
        const files = readJSON(STORAGE_KEY, {})
        const file = files[path]
        if (!file) return { data: null, error: { message: 'File not found' } }
        return { data: { signedUrl: file.dataUrl }, error: null }
      },
      async download(path) {
        const files = readJSON(STORAGE_KEY, {})
        const file = files[path]
        if (!file) return { data: null, error: { message: 'File not found' } }
        return { data: file, error: null }
      },
      getPublicUrl(path) {
        const files = readJSON(STORAGE_KEY, {})
        const file = files[path]
        return { data: { publicUrl: file?.dataUrl || '' } }
      },
    }
  },
}

const functions = {
  invoke: async (name, opts) => {
    console.log('[mock] function invoke', name, opts)
    return { data: null, error: null }
  },
}

export function createMockClient() {
  // Ensure seed data exists on first call
  loadDb()
  return {
    from: createQuery,
    auth,
    storage,
    functions,
  }
}

/**
 * Reset all mock data. Useful for "Reset Demo" button.
 */
export function resetMockData() {
  localStorage.removeItem(DB_KEY)
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(STORAGE_KEY)
  loadDb()
}

export function isMockMode() {
  return true
}
