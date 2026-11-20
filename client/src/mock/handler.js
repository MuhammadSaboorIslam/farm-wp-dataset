import { users, products, orders, updates, follows, notifications, reviews } from './data'

const db = {
  users: users.slice(),
  products: products.slice(),
  orders: orders.slice(),
  updates: updates.slice(),
  follows: follows.slice(),
  notifications: notifications.slice(),
  reviews: reviews.slice(),
}
let counter = 100

function newid(prefix) {
  counter++
  return prefix + counter
}

function fail(status, message) {
  const e = new Error(message)
  e.status = status
  throw e
}

function byid(list, id) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      return list[i]
    }
  }
  return null
}

function now() {
  return new Date().toISOString()
}

function publicUser(u) {
  if (!u) {
    return null
  }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    verified: u.verified,
    farmName: u.farmName,
    location: u.location,
    bio: u.bio,
    farmSize: u.farmSize,
    crops: u.crops,
    emailFarmNews: u.emailFarmNews !== false,
    phone: u.phone,
    address: u.address,
    city: u.city,
    vehicle: u.vehicle,
    rejected: u.rejected,
    blocked: u.blocked,
    createdAt: u.createdAt,
  }
}

function farmerinfo(id) {
  const u = byid(db.users, id)
  if (!u) {
    return null
  }
  return { id: u.id, name: u.name, farmName: u.farmName, location: u.location }
}

function ratingfor(filter) {
  let sum = 0
  let count = 0
  for (let i = 0; i < db.reviews.length; i++) {
    if (filter(db.reviews[i])) {
      sum += db.reviews[i].rating
      count++
    }
  }
  return { rating: count ? Math.round((sum / count) * 10) / 10 : 0, reviewCount: count }
}

function outProduct(p) {
  const r = ratingfor((x) => x.product === p.id)
  return { ...p, farmer: farmerinfo(p.farmer), rating: r.rating, reviewCount: r.reviewCount }
}

function deliveryQuote(farmLocation, address) {
  const from = cityof(farmLocation)
  const to = cityof(address) || from
  let distance = 5
  if (from && to && from !== to)
    distance = Math.max(5, Math.round(km(MOCK_CITIES[from], MOCK_CITIES[to]) * 1.25))
  return { distanceKm: distance, deliveryFee: Math.min(1500, Math.round((100 + 15 * distance) / 10) * 10) }
}

function outOrder(o) {
  const c = byid(db.users, o.customer)
  const rider = o.rider ? byid(db.users, o.rider) : null
  const f = farmerinfo(o.farmer)
  return {
    ...deliveryQuote(f && f.location, o.address),
    ...o,
    customer: c ? { id: c.id, name: c.name } : null,
    farmer: f,
    rider: rider ? { id: rider.id, name: rider.name } : null,
  }
}

function outUpdate(u) {
  return { ...u, farmer: farmerinfo(u.farmer) }
}

function outReview(r) {
  const c = byid(db.users, r.customer)
  return { ...r, customer: c ? { id: c.id, name: c.name } : null }
}

function notify(userId, type, text, link) {
  db.notifications.unshift({
    id: newid('x'),
    user: userId,
    type: type,
    text: text,
    link: link,
    read: false,
    createdAt: now(),
  })
}

function followersof(farmerId) {
  const list = []
  for (let i = 0; i < db.follows.length; i++) {
    if (db.follows[i].farmer === farmerId) {
      list.push(db.follows[i].customer)
    }
  }
  return list
}

function sortBy(list, key, dir) {
  return list.slice().sort((a, b) => {
    if (a[key] < b[key]) return -1 * dir
    if (a[key] > b[key]) return 1 * dir
    return 0
  })
}

function newest(list) {
  return sortBy(list, 'createdAt', -1)
}

function parsequery(qs) {
  const q = {}
  if (!qs) {
    return q
  }
  const parts = qs.split('&')
  for (let i = 0; i < parts.length; i++) {
    const kv = parts[i].split('=')
    q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '')
  }
  return q
}

function needuser(user) {
  if (!user) {
    fail(401, 'Please login')
  }
}

function needrole(user, roles) {
  needuser(user)
  if (roles.indexOf(user.role) === -1) {
    fail(403, 'Not allowed')
  }
}

function needverified(user) {
  needrole(user, ['farmer'])
  if (!user.verified) {
    fail(403, 'Your farm is not verified yet')
  }
}

function listProducts(q, user) {
  let list = []
  for (let i = 0; i < db.products.length; i++) {
    const p = db.products[i]
    if (q.farmer) {
      const fid = q.farmer === 'me' ? (user ? user.id : '') : q.farmer
      if (p.farmer !== fid) continue
    } else {
      if (!p.active || p.hidden) continue
    }
    if (
      q.q &&
      p.name.toLowerCase().indexOf(q.q.toLowerCase()) === -1 &&
      p.description.toLowerCase().indexOf(q.q.toLowerCase()) === -1
    )
      continue
    if (q.category && p.category !== q.category) continue
    if (q.minPrice && p.price < Number(q.minPrice)) continue
    if (q.maxPrice && p.price > Number(q.maxPrice)) continue
    if (q.location && p.location.toLowerCase().indexOf(q.location.toLowerCase()) === -1) continue
    list.push(p)
  }
  if (q.sort === 'price,asc') {
    list = sortBy(list, 'price', 1)
  } else if (q.sort === 'price,desc') {
    list = sortBy(list, 'price', -1)
  } else if (q.sort === 'name,asc') {
    list = sortBy(list, 'name', 1)
  } else {
    list = newest(list)
  }
  const size = Number(q.size || 12)
  const page = Number(q.page || 0)
  const out = []
  const slice = list.slice(page * size, page * size + size)
  for (let i = 0; i < slice.length; i++) {
    out.push(outProduct(slice[i]))
  }
  return {
    products: out,
    page: { number: page, totalPages: Math.ceil(list.length / size), totalElements: list.length },
  }
}

const DAY = 24 * 60 * 60 * 1000
const MOCK_CITIES = {
  Lahore: [31.5204, 74.3587],
  Multan: [30.1575, 71.5249],
  Faisalabad: [31.4504, 73.135],
  Karachi: [24.8607, 67.0011],
  Islamabad: [33.6844, 73.0479],
}

function cityof(text) {
  const t = String(text || '').toLowerCase()
  return Object.keys(MOCK_CITIES).find((c) => t.includes(c.toLowerCase())) || null
}

function km(a, b) {
  const r = Math.PI / 180
  const h =
    Math.sin(((b[0] - a[0]) * r) / 2) ** 2 +
    Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(((b[1] - a[1]) * r) / 2) ** 2
  return Math.round(12742 * Math.asin(Math.sqrt(h)))
}

function farmerStats(user, weeks) {
  weeks = Math.min(26, Math.max(4, weeks))
  const monday = new Date()
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const from = monday.getTime() - (weeks - 1) * 7 * DAY
  const prevFrom = from - weeks * 7 * DAY
  const weekly = []
  for (let i = 0; i < weeks; i++) {
    weekly.push({
      start: new Date(from + i * 7 * DAY).toISOString(),
      sales: 0,
      orders: 0,
      prevSales: 0,
      prevOrders: 0,
    })
  }
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => ({
    day: d,
    orders: 0,
    sales: 0,
  }))
  const statusCounts = { placed: 0, packed: 0, out_for_delivery: 0, delivered: 0, cancelled: 0 }
  const products = {}
  const now = { sales: 0, orders: 0, items: 0 }
  const prev = { sales: 0, orders: 0 }
  for (const o of db.orders) {
    const t = Date.parse(o.createdAt)
    if (o.farmer !== user.id || t < prevFrom) continue
    const inRange = t >= from
    if (inRange) statusCounts[o.status]++
    if (o.status === 'cancelled') continue
    if (!inRange) {
      prev.sales += o.total
      prev.orders++
      const pw = weekly[Math.floor((t - prevFrom) / (7 * DAY))]
      if (pw) {
        pw.prevSales += o.total
        pw.prevOrders++
      }
      continue
    }
    const wd = weekdays[(new Date(t).getDay() + 6) % 7]
    wd.orders++
    wd.sales += o.total
    now.sales += o.total
    now.orders++
    const w = weekly[Math.floor((t - from) / (7 * DAY))]
    if (w) {
      w.sales += o.total
      w.orders++
    }
    for (const it of o.items) {
      now.items += it.qty
      if (!products[it.product])
        products[it.product] = {
          product: it.product,
          name: it.name,
          unit: it.unit,
          image: it.image,
          sales: 0,
          qty: 0,
        }
      products[it.product].sales += it.price * it.qty
      products[it.product].qty += it.qty
    }
  }
  const r = ratingfor((x) => x.farmer === user.id)
  const ratings = {}
  for (let n = 5; n >= 1; n--) {
    ratings[n] = db.reviews.filter((x) => x.farmer === user.id && x.rating === n).length
  }
  return {
    weeks: weeks,
    from: new Date(from).toISOString(),
    kpis: {
      sales: now.sales,
      salesPrev: prev.sales,
      orders: now.orders,
      ordersPrev: prev.orders,
      avgOrder: now.orders ? Math.round(now.sales / now.orders) : 0,
      avgOrderPrev: prev.orders ? Math.round(prev.sales / prev.orders) : 0,
      items: now.items,
      rating: r.rating,
      reviewCount: r.reviewCount,
      followers: followersof(user.id).length,
      toPack: db.orders.filter((o) => o.farmer === user.id && o.status === 'placed').length,
    },
    weekly: weekly,
    topProducts: Object.values(products)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5),
    statusCounts: statusCounts,
    weekdays: weekdays,
    ratings: ratings,
  }
}

const allowed = {
  placed: { packed: ['farmer', 'admin'], cancelled: ['customer', 'admin'] },
  packed: { out_for_delivery: ['rider', 'admin'] },
  out_for_delivery: { delivered: ['rider', 'admin'] },
}

export async function mockrequest(method, url, body, token) {
  await new Promise((r) => setTimeout(r, 250))
  const user = token ? byid(db.users, token.replace('mock-', '')) : null
  const split = url.split('?')
  const parts = split[0].split('/').filter(Boolean)
  const q = parsequery(split[1])
  const a = parts[0]
  const b = parts[1]
  const c = parts[2]

  if (a === 'auth') {
    if (b === 'login' && method === 'POST') {
      for (let i = 0; i < db.users.length; i++) {
        if (db.users[i].email === body.email && db.users[i].password === body.password) {
          return { user: publicUser(db.users[i]), token: 'mock-' + db.users[i].id }
        }
      }
      fail(400, 'Wrong credentials')
    }
    if (b === 'register' && method === 'POST') {
      for (let i = 0; i < db.users.length; i++) {
        if (db.users[i].email === body.email) {
          fail(400, 'An account with this email already exists')
        }
      }
      if (body.role === 'admin') {
        fail(400, 'Cannot register as admin')
      }
      if (body.role === 'rider' && (!body.phone || !body.vehicle)) {
        fail(400, 'Phone and vehicle are needed for a rider account')
      }
      const u = {
        id: newid('u'),
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role || 'customer',
        verified: false,
        farmName: body.farmName || '',
        location: body.location || '',
        bio: body.bio || '',
        farmSize: Number(body.farmSize) || null,
        crops: body.crops || '',
        phone: body.phone || '',
        address: body.address || '',
        city: body.city || '',
        vehicle: body.vehicle || '',
        createdAt: now(),
      }
      db.users.push(u)
      return { user: publicUser(u), token: 'mock-' + u.id }
    }
    if (b === 'forgot' && method === 'POST') {
      const u = db.users.find(
        (x) =>
          x.email.toLowerCase() ===
          String(body.email || '')
            .trim()
            .toLowerCase(),
      )
      if (u) {
        u.resetToken = 'mock-reset-' + u.id + '-' + Date.now()
        console.log(
          'mock password reset link: ' + window.location.origin + '/reset-password?token=' + u.resetToken,
        )
      }
      return { ok: true, message: 'If that email has an account, a reset link is on its way.' }
    }
    if (b === 'reset' && method === 'POST') {
      const u = db.users.find((x) => x.resetToken && x.resetToken === body.token)
      if (!body.password || body.password.length < 6) {
        fail(400, 'New password should be at least 6 characters')
      }
      if (!u) {
        fail(400, 'This reset link is invalid or has expired. Ask for a new one.')
      }
      u.password = body.password
      u.resetToken = null
      return { ok: true }
    }
    if (b === 'me' && method === 'PUT') {
      needuser(user)
      if (!body.name || !body.name.trim()) {
        fail(400, 'Name is required')
      }
      if (user.role === 'farmer' && (!body.farmName || !body.location)) {
        fail(400, 'Farm name and location are needed for a farmer account')
      }
      if (body.phone && !/^\d{10,13}$/.test(body.phone)) {
        fail(400, 'Phone should be 10 to 13 digits')
      }
      const keys = {
        customer: ['phone', 'address', 'city'],
        farmer: ['farmName', 'location', 'bio', 'phone', 'crops', 'farmSize'],
        rider: ['phone', 'vehicle', 'city'],
        admin: [],
      }
      user.name = body.name.trim()
      for (const k of keys[user.role]) {
        user[k] = k === 'farmSize' ? Number(body[k]) || null : String(body[k] || '').trim()
      }
      if (user.role === 'farmer') {
        db.products.forEach((p) => {
          if (p.farmer === user.id) p.location = user.location
        })
      }
      return { user: publicUser(user) }
    }
    if (b === 'settings' && method === 'PUT') {
      needuser(user)
      if (typeof body.emailFarmNews === 'boolean') user.emailFarmNews = body.emailFarmNews
      return { user: publicUser(user) }
    }
    if (b === 'password' && method === 'PUT') {
      needuser(user)
      if (!body.password || body.password.length < 6) {
        fail(400, 'New password should be at least 6 characters')
      }
      if (body.current !== user.password) {
        fail(400, 'Current password is wrong')
      }
      user.password = body.password
      return { ok: true }
    }
    if (b === 'me') {
      needuser(user)
      return { user: publicUser(user) }
    }
  }

  if (a === 'products') {
    if (!b && method === 'GET') {
      return listProducts(q, user)
    }
    if (!b && method === 'POST') {
      needverified(user)
      if (!body.name || !body.price) {
        fail(400, 'Name and price are required')
      }
      const p = {
        id: newid('p'),
        farmer: user.id,
        name: body.name,
        description: body.description || '',
        category: body.category || 'Vegetables',
        price: Number(body.price),
        quantity: Number(body.quantity || 0),
        unit: body.unit || 'kg',
        images: body.images || [],
        location: user.location || '',
        active: true,
        createdAt: now(),
      }
      db.products.push(p)
      const fol = followersof(user.id)
      for (let i = 0; i < fol.length; i++) {
        notify(fol[i], 'new_product', user.farmName + ' added ' + p.name, '/products/' + p.id)
      }
      return { product: outProduct(p) }
    }
    const p = byid(db.products, b)
    if (!p) {
      fail(404, 'Product not found')
    }
    if (method === 'GET') {
      const revs = []
      for (let i = 0; i < db.reviews.length; i++) {
        if (db.reviews[i].product === p.id) {
          revs.push(outReview(db.reviews[i]))
        }
      }
      return { product: outProduct(p), reviews: newest(revs) }
    }
    needuser(user)
    if (p.farmer !== user.id && user.role !== 'admin') {
      fail(403, 'Not allowed')
    }
    if (method === 'PUT') {
      const keys = ['name', 'description', 'category', 'price', 'quantity', 'unit', 'images', 'active']
      for (let i = 0; i < keys.length; i++) {
        if (body[keys[i]] !== undefined) {
          p[keys[i]] = body[keys[i]]
        }
      }
      p.price = Number(p.price)
      p.quantity = Number(p.quantity)
      return { product: outProduct(p) }
    }
    if (method === 'DELETE') {
      db.products.splice(db.products.indexOf(p), 1)
      return { ok: true }
    }
  }

  if (a === 'farms') {
    if (b === 'cities' && method === 'GET') {
      return { cities: Object.keys(MOCK_CITIES) }
    }
    if (!b && method === 'GET') {
      let origin = null
      if (q.lat) origin = [Number(q.lat), Number(q.lng)]
      else if (q.city && MOCK_CITIES[cityof(q.city)]) origin = MOCK_CITIES[cityof(q.city)]
      const text = (q.q || '').toLowerCase()
      let list = db.users.filter(
        (u) =>
          u.role === 'farmer' &&
          u.verified &&
          !u.blocked &&
          (!text || (u.farmName + ' ' + u.location + ' ' + (u.crops || '')).toLowerCase().includes(text)),
      )
      list = list.map((f) => {
        const live = db.products.filter((p) => p.farmer === f.id && p.active && !p.hidden)
        const r = ratingfor((x) => x.farmer === f.id)
        const at = MOCK_CITIES[cityof(f.location)]
        return {
          farm: publicUser(f),
          distanceKm: origin && at ? km(origin, at) : null,
          coverImage: live.length ? live[live.length - 1].images[0] : null,
          productCount: live.length,
          followers: followersof(f.id).length,
          rating: r.rating,
          reviewCount: r.reviewCount,
          following: !!user && db.follows.some((x) => x.customer === user.id && x.farmer === f.id),
        }
      })
      if (origin)
        list.sort((x, y) => (x.distanceKm === null) - (y.distanceKm === null) || x.distanceKm - y.distanceKm)
      return { farms: list, near: origin ? q.city || 'your location' : null }
    }
    if (b === 'feed' && method === 'GET') {
      needrole(user, ['customer'])
      const mine = db.follows.filter((x) => x.customer === user.id).map((x) => x.farmer)
      const items = db.updates
        .filter((u) => mine.includes(u.farmer))
        .map((u) => ({ kind: 'update', at: u.createdAt, update: outUpdate(u) }))
        .concat(
          db.products
            .filter((p) => mine.includes(p.farmer) && p.active && !p.hidden)
            .map((p) => ({ kind: 'product', at: p.createdAt, product: outProduct(p) })),
        )
      items.sort((x, y) => Date.parse(y.at) - Date.parse(x.at))
      return { items: items.slice(0, 30) }
    }
    if (b === 'following' && method === 'GET') {
      needuser(user)
      const list = []
      for (let i = 0; i < db.follows.length; i++) {
        if (db.follows[i].customer === user.id) {
          const f = byid(db.users, db.follows[i].farmer)
          let latest = null
          const ups = newest(db.updates.filter((x) => x.farmer === f.id))
          if (ups.length > 0) {
            latest = outUpdate(ups[0])
          }
          list.push({
            farm: publicUser(f),
            latestUpdate: latest,
            productCount: db.products.filter((x) => x.farmer === f.id && x.active).length,
          })
        }
      }
      return { farms: list }
    }
    const f = byid(db.users, b)
    if (!f || f.role !== 'farmer') {
      fail(404, 'Farm not found')
    }
    if (c === 'follow') {
      needrole(user, ['customer'])
      let existing = null
      for (let i = 0; i < db.follows.length; i++) {
        if (db.follows[i].customer === user.id && db.follows[i].farmer === f.id) {
          existing = db.follows[i]
        }
      }
      if (method === 'POST' && !existing) {
        db.follows.push({ id: newid('f'), customer: user.id, farmer: f.id })
      }
      if (method === 'DELETE' && existing) {
        db.follows.splice(db.follows.indexOf(existing), 1)
      }
      return { following: method === 'POST', followers: followersof(f.id).length }
    }
    if (method === 'GET') {
      const prods = []
      for (let i = 0; i < db.products.length; i++) {
        if (db.products[i].farmer === f.id && db.products[i].active) {
          prods.push(outProduct(db.products[i]))
        }
      }
      const ups = []
      for (let i = 0; i < db.updates.length; i++) {
        if (db.updates[i].farmer === f.id) {
          ups.push(outUpdate(db.updates[i]))
        }
      }
      let following = false
      for (let i = 0; i < db.follows.length; i++) {
        if (user && db.follows[i].customer === user.id && db.follows[i].farmer === f.id) {
          following = true
        }
      }
      const r = ratingfor((x) => x.farmer === f.id)
      return {
        farm: publicUser(f),
        products: newest(prods),
        updates: newest(ups),
        followers: followersof(f.id).length,
        following: following,
        rating: r.rating,
        reviewCount: r.reviewCount,
      }
    }
  }

  if (a === 'updates') {
    if (method === 'GET') {
      const fid = q.farmer === 'me' ? (user ? user.id : '') : q.farmer
      const list = []
      for (let i = 0; i < db.updates.length; i++) {
        if (!fid || db.updates[i].farmer === fid) {
          list.push(outUpdate(db.updates[i]))
        }
      }
      return { updates: newest(list) }
    }
    if (method === 'POST') {
      needverified(user)
      if (!body.title) {
        fail(400, 'Title is required')
      }
      const u = {
        id: newid('n'),
        farmer: user.id,
        title: body.title,
        body: body.body || '',
        images: body.images || [],
        createdAt: now(),
      }
      db.updates.unshift(u)
      const fol = followersof(user.id)
      for (let i = 0; i < fol.length; i++) {
        notify(fol[i], 'new_update', user.farmName + ' posted: ' + u.title, '/farms/' + user.id)
      }
      return { update: outUpdate(u) }
    }
  }

  if (a === 'orders') {
    if (!b && method === 'POST') {
      needrole(user, ['customer'])
      if (!body.items || body.items.length === 0) {
        fail(400, 'Cart is empty')
      }
      if (!body.address || !body.phone) {
        fail(400, 'Address and phone are required')
      }
      const groups = {}
      for (let i = 0; i < body.items.length; i++) {
        const p = byid(db.products, body.items[i].product)
        const qty = Number(body.items[i].qty)
        if (!p || !p.active) {
          fail(400, 'A product in your cart is no longer available')
        }
        if (qty < 1) {
          fail(400, 'Quantity must be at least 1')
        }
        if (p.quantity < qty) {
          fail(400, 'Only ' + p.quantity + ' ' + p.unit + ' of ' + p.name + ' left')
        }
        if (!groups[p.farmer]) {
          groups[p.farmer] = []
        }
        groups[p.farmer].push({
          product: p.id,
          name: p.name,
          price: p.price,
          qty: qty,
          unit: p.unit,
          image: p.images[0] || '',
        })
      }
      const made = []
      const farmerIds = Object.keys(groups)
      for (let i = 0; i < farmerIds.length; i++) {
        const items = groups[farmerIds[i]]
        let total = 0
        for (let j = 0; j < items.length; j++) {
          total += items[j].price * items[j].qty
          const p = byid(db.products, items[j].product)
          p.quantity -= items[j].qty
        }
        const o = {
          id: newid('o'),
          customer: user.id,
          farmer: farmerIds[i],
          items: items,
          total: total,
          address: body.address,
          phone: body.phone,
          status: 'placed',
          rider: null,
          createdAt: now(),
          history: [{ status: 'placed', at: now(), by: user.name }],
        }
        db.orders.unshift(o)
        notify(farmerIds[i], 'order_status', 'New order from ' + user.name, '/farmer')
        made.push(outOrder(o))
      }
      return { orders: made }
    }
    if (b === 'mine' && method === 'GET') {
      needuser(user)
      const list = []
      for (let i = 0; i < db.orders.length; i++) {
        const o = db.orders[i]
        if (user.role === 'customer' && o.customer === user.id) list.push(outOrder(o))
        if (user.role === 'farmer' && o.farmer === user.id) list.push(outOrder(o))
        if (user.role === 'rider' && o.rider === user.id) list.push(outOrder(o))
        if (user.role === 'admin') list.push(outOrder(o))
      }
      return { orders: newest(list) }
    }
    if (b === 'available' && method === 'GET') {
      needrole(user, ['rider'])
      const list = []
      for (let i = 0; i < db.orders.length; i++) {
        if (db.orders[i].status === 'packed' && !db.orders[i].rider) {
          list.push(outOrder(db.orders[i]))
        }
      }
      return { orders: newest(list) }
    }
    if (b === 'rider-stats' && method === 'GET') {
      needrole(user, ['rider'])
      const weeks = Math.min(26, Math.max(4, Number(q.weeks) || 8))
      const monday = new Date()
      monday.setHours(0, 0, 0, 0)
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
      const from = monday.getTime() - (weeks - 1) * 7 * DAY
      const prevFrom = from - weeks * 7 * DAY
      const weekly = []
      for (let i = 0; i < weeks; i++)
        weekly.push({
          start: new Date(from + i * 7 * DAY).toISOString(),
          earned: 0,
          deliveries: 0,
          km: 0,
          prevEarned: 0,
        })
      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => ({
        day: d,
        deliveries: 0,
        earned: 0,
      }))
      const farms = {}
      const k = { earned: 0, earnedPrev: 0, deliveries: 0, deliveriesPrev: 0, km: 0, onTheWay: 0, pending: 0 }
      for (const raw of db.orders.filter((o) => o.rider === user.id)) {
        const o = outOrder(raw)
        if (o.status === 'packed' || o.status === 'out_for_delivery') {
          k.onTheWay++
          k.pending += o.deliveryFee
          continue
        }
        if (o.status !== 'delivered') continue
        const h = o.history.find((x) => x.status === 'delivered')
        const t = Date.parse(h ? h.at : o.createdAt)
        if (t < prevFrom) continue
        if (t < from) {
          k.earnedPrev += o.deliveryFee
          k.deliveriesPrev++
          const pw = weekly[Math.floor((t - prevFrom) / (7 * DAY))]
          if (pw) pw.prevEarned += o.deliveryFee
          continue
        }
        k.earned += o.deliveryFee
        k.deliveries++
        k.km += o.distanceKm
        const w = weekly[Math.floor((t - from) / (7 * DAY))]
        if (w) {
          w.earned += o.deliveryFee
          w.deliveries++
          w.km += o.distanceKm
        }
        const wd = weekdays[(new Date(t).getDay() + 6) % 7]
        wd.deliveries++
        wd.earned += o.deliveryFee
        const key = o.farmer ? o.farmer.id : 'none'
        if (!farms[key])
          farms[key] = {
            farmer: key,
            farmName: o.farmer ? o.farmer.farmName : 'Removed farm',
            location: o.farmer ? o.farmer.location : '',
            deliveries: 0,
            earned: 0,
          }
        farms[key].deliveries++
        farms[key].earned += o.deliveryFee
      }
      const open = db.orders.filter((o) => o.status === 'packed' && !o.rider).map(outOrder)
      let openfees = 0
      for (let i = 0; i < open.length; i++) {
        openfees += open[i].deliveryFee
      }
      return {
        weeks: weeks,
        from: new Date(from).toISOString(),
        weekly: weekly,
        weekdays: weekdays,
        topFarms: Object.values(farms)
          .sort((x, y) => y.earned - x.earned)
          .slice(0, 5),
        rule: { base: 100, perKm: 15, max: 1500 },
        kpis: {
          ...k,
          avgFee: k.deliveries ? Math.round(k.earned / k.deliveries) : 0,
          avgMinutes: null,
          available: open.length,
          availableEarnings: openfees,
        },
      }
    }
    if (b === 'stats' && method === 'GET') {
      needrole(user, ['farmer'])
      return farmerStats(user, Number(q.weeks) || 8)
    }
    const o = byid(db.orders, b)
    if (!o) {
      fail(404, 'Order not found')
    }
    needuser(user)
    if (c === 'claim' && method === 'POST') {
      needrole(user, ['rider'])
      if (o.status !== 'packed' || o.rider) {
        fail(400, 'This order is not available')
      }
      o.rider = user.id
      return { order: outOrder(o) }
    }
    const party =
      o.customer === user.id || o.farmer === user.id || o.rider === user.id || user.role === 'admin'
    if (!party) {
      fail(403, 'Not allowed')
    }
    if (method === 'GET') {
      return { order: outOrder(o) }
    }
    if (c === 'status' && method === 'PATCH') {
      const next = body.status
      const options = allowed[o.status] || {}
      if (!options[next] || options[next].indexOf(user.role) === -1) {
        const can = Object.keys(options)
        fail(
          400,
          can.length
            ? 'From ' + o.status + ' this order can only go to ' + can.join(' or ')
            : 'This order is finished',
        )
      }
      if (user.role === 'rider' && o.rider !== user.id) {
        fail(403, 'Claim this order first')
      }
      if (next === 'cancelled') {
        for (let i = 0; i < o.items.length; i++) {
          const p = byid(db.products, o.items[i].product)
          if (p) p.quantity += o.items[i].qty
        }
      }
      o.status = next
      o.history.push({ status: next, at: now(), by: user.name })
      const farmName = farmerinfo(o.farmer).farmName
      const words = {
        packed: 'is packed',
        out_for_delivery: 'is out for delivery',
        delivered: 'was delivered',
        cancelled: 'was cancelled',
      }
      notify(o.customer, 'order_status', 'Your order from ' + farmName + ' ' + words[next], '/orders/' + o.id)
      if (next === 'cancelled') {
        notify(o.farmer, 'order_status', 'Order ' + o.id + ' was cancelled by ' + user.name, '/farmer')
      }
      return { order: outOrder(o) }
    }
  }

  if (a === 'reviews') {
    if (method === 'GET') {
      const list = []
      for (let i = 0; i < db.reviews.length; i++) {
        if (!q.product || db.reviews[i].product === q.product) {
          list.push(outReview(db.reviews[i]))
        }
      }
      return { reviews: newest(list) }
    }
    if (method === 'POST') {
      needrole(user, ['customer'])
      const o = byid(db.orders, body.order)
      if (!o || o.customer !== user.id || o.status !== 'delivered') {
        fail(400, 'You can only review products from a delivered order')
      }
      let inOrder = false
      for (let i = 0; i < o.items.length; i++) {
        if (o.items[i].product === body.product) inOrder = true
      }
      if (!inOrder) {
        fail(400, 'That product is not in this order')
      }
      for (let i = 0; i < db.reviews.length; i++) {
        const r = db.reviews[i]
        if (r.customer === user.id && r.product === body.product && r.order === o.id) {
          fail(400, 'You already reviewed this product')
        }
      }
      const rating = Number(body.rating)
      if (!(rating >= 1 && rating <= 5)) {
        fail(400, 'Rating must be 1 to 5')
      }
      const r = {
        id: newid('r'),
        customer: user.id,
        product: body.product,
        farmer: o.farmer,
        order: o.id,
        rating: rating,
        comment: body.comment || '',
        createdAt: now(),
      }
      db.reviews.unshift(r)
      return { review: outReview(r) }
    }
  }

  if (a === 'notifications') {
    needuser(user)
    const mine = []
    for (let i = 0; i < db.notifications.length; i++) {
      if (db.notifications[i].user === user.id) {
        mine.push(db.notifications[i])
      }
    }
    if (method === 'GET') {
      let unread = 0
      for (let i = 0; i < mine.length; i++) {
        if (!mine[i].read) unread++
      }
      return { notifications: newest(mine), unread: unread }
    }
    if (b === 'read' && method === 'PATCH') {
      for (let i = 0; i < mine.length; i++) {
        mine[i].read = true
      }
      return { ok: true }
    }
  }

  if (a === 'wishlist') {
    needrole(user, ['customer'])
    user.wishlist = user.wishlist || []
    if (!b && method === 'GET') {
      const list = user.wishlist
        .slice()
        .reverse()
        .map((id) => byid(db.products, id))
        .filter(Boolean)
      return {
        products: list.map((p) => ({ ...outProduct(p), available: p.active && !p.hidden && p.quantity > 0 })),
        ids: user.wishlist.slice(),
      }
    }
    if (b && method === 'POST') {
      if (!byid(db.products, b)) fail(404, 'Product not found')
      if (user.wishlist.indexOf(b) === -1) user.wishlist.push(b)
      return { ids: user.wishlist.slice() }
    }
    if (b && method === 'DELETE') {
      user.wishlist = user.wishlist.filter((x) => x !== b)
      return { ids: user.wishlist.slice() }
    }
  }

  if (a === 'admin') {
    needrole(user, ['admin'])
    if (b === 'users' && c && method === 'PATCH') {
      const u = byid(db.users, c)
      if (!u) fail(404, 'User not found')
      if (u.role === 'admin') fail(400, 'Admins cannot be blocked')
      u.blocked = !!body.blocked
      return { user: publicUser(u) }
    }
    if (b === 'products' && !c && method === 'GET') {
      return { products: newest(db.products).map(outProduct) }
    }
    if (b === 'products' && c && method === 'PATCH') {
      const p = byid(db.products, c)
      if (!p) fail(404, 'Product not found')
      p.hidden = !!body.hidden
      notify(
        p.farmer,
        'order_status',
        p.hidden
          ? 'An admin hid your product ' + p.name + '. Contact the admin to ask why.'
          : 'Your product ' + p.name + ' is visible again.',
        '/farmer',
      )
      return { product: outProduct(p) }
    }
    if (b === 'stats' && method === 'GET') {
      const monday = new Date()
      monday.setHours(0, 0, 0, 0)
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
      const from = monday.getTime() - 11 * 7 * DAY
      const weekly = []
      for (let i = 0; i < 12; i++)
        weekly.push({ start: new Date(from + i * 7 * DAY).toISOString(), sales: 0, orders: 0, signups: 0 })
      const statusCounts = { placed: 0, packed: 0, out_for_delivery: 0, delivered: 0, cancelled: 0 }
      const farms = {}
      let sales = 0,
        count = 0
      for (const o of db.orders) {
        const t = Date.parse(o.createdAt)
        if (t < from) continue
        statusCounts[o.status]++
        if (o.status === 'cancelled') continue
        sales += o.total
        count++
        const w = weekly[Math.floor((t - from) / (7 * DAY))]
        if (w) {
          w.sales += o.total
          w.orders++
        }
        const f = farmerinfo(o.farmer)
        if (!farms[o.farmer])
          farms[o.farmer] = {
            farmer: o.farmer,
            farmName: f ? f.farmName : 'Removed farm',
            sales: 0,
            orders: 0,
          }
        farms[o.farmer].sales += o.total
        farms[o.farmer].orders++
      }
      const roles = { customer: 0, farmer: 0, rider: 0, admin: 0 }
      db.users.forEach((u) => {
        roles[u.role]++
      })
      return {
        weeks: 12,
        weekly: weekly,
        statusCounts: statusCounts,
        topFarms: Object.values(farms)
          .sort((x, y) => y.sales - x.sales)
          .slice(0, 5),
        kpis: {
          sales: sales,
          orders: count,
          users: db.users.length,
          roles: roles,
          pendingFarms: db.users.filter((u) => u.role === 'farmer' && !u.verified && !u.rejected).length,
          blocked: db.users.filter((u) => u.blocked).length,
          hiddenProducts: db.products.filter((p) => p.hidden).length,
          liveProducts: db.products.filter((p) => p.active && !p.hidden).length,
        },
      }
    }
    if (b === 'farmers' && method === 'GET') {
      const list = []
      for (let i = 0; i < db.users.length; i++) {
        const u = db.users[i]
        if (u.role !== 'farmer') continue
        if (q.verified === 'false' && (u.verified || u.rejected)) continue
        if (q.verified === 'true' && !u.verified) continue
        list.push(publicUser(u))
      }
      return { farmers: list }
    }
    if (b === 'farmers' && c && method === 'PATCH') {
      const f = byid(db.users, c)
      if (!f || f.role !== 'farmer') {
        fail(404, 'Farmer not found')
      }
      f.verified = !!body.approve
      f.rejected = !body.approve
      notify(
        f.id,
        'order_status',
        body.approve
          ? 'Your farm has been verified. You can start selling.'
          : 'Your farm verification was rejected.',
        '/farmer',
      )
      return { farmer: publicUser(f) }
    }
    if (b === 'users' && method === 'GET') {
      const list = []
      for (let i = 0; i < db.users.length; i++) {
        list.push(publicUser(db.users[i]))
      }
      return { users: list }
    }
    if (b === 'orders' && method === 'GET') {
      const list = []
      for (let i = 0; i < db.orders.length; i++) {
        list.push(outOrder(db.orders[i]))
      }
      return { orders: newest(list) }
    }
  }

  fail(404, 'No route for ' + method + ' /' + parts.join('/'))
}
