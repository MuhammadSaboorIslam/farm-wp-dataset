import {users, products, orders, updates, follows, notifications, reviews} from './data'

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

function newId(prefix){
  counter++
  return prefix + counter
}

function fail(status, message){
  const e = new Error(message)
  e.status = status
  throw e
}

function byId(list, id){
  for (let i = 0; i < list.length; i++){
    if (list[i].id === id){
      return list[i]
    }
  }
  return null
}

function now(){
  return new Date().toISOString()
}

function publicUser(u){
  if(!u){
    return null
  }
  return { id: u.id, name: u.name, email: u.email, role: u.role, verified: u.verified, farmName: u.farmName, location: u.location, bio: u.bio, rejected: u.rejected, createdAt: u.createdAt }
}

function farmerInfo(id){
  const u = byId(db.users, id)
  if(!u){
    return null
  }
  return { id: u.id, name: u.name, farmName: u.farmName, location: u.location }
}

function ratingFor(filter){
  let sum = 0
  let count = 0
  for (let i = 0; i < db.reviews.length; i++){
    if (filter(db.reviews[i])){
      sum += db.reviews[i].rating
      count++
    }
  }
  return { rating: count ? Math.round(sum / count * 10) / 10 : 0, reviewCount: count }
}

function outProduct(p){
  const r = ratingFor(x => x.product === p.id)
  return { ...p, farmer: farmerInfo(p.farmer), rating: r.rating, reviewCount: r.reviewCount }
}

function outOrder(o){
  const c = byId(db.users, o.customer)
  const rider = o.rider ? byId(db.users, o.rider) : null
  return { ...o, customer: c ? { id: c.id, name: c.name } : null, farmer: farmerInfo(o.farmer), rider: rider ? { id: rider.id, name: rider.name } : null }
}

function outUpdate(u){
  return { ...u, farmer: farmerInfo(u.farmer) }
}

function outReview(r){
  const c = byId(db.users, r.customer)
  return { ...r, customer: c ? { id: c.id, name: c.name } : null }
}

function notify(userId, type, text, link){
  db.notifications.unshift({ id: newId('x'), user: userId, type: type, text: text, link: link, read: false, createdAt: now() })
}

function followersOf(farmerId){
  const list = []
  for (let i = 0; i < db.follows.length; i++){
    if (db.follows[i].farmer === farmerId){
      list.push(db.follows[i].customer)
    }
  }
  return list
}

function sortBy(list, key, dir){
  return list.slice().sort((a, b) => {
    if (a[key] < b[key]) return -1 * dir
    if (a[key] > b[key]) return 1 * dir
    return 0
  })
}

function newest(list){
  return sortBy(list, 'createdAt', -1)
}

function parseQuery(qs){
  const q = {}
  if (!qs){
    return q
  }
  const parts = qs.split('&')
  for (let i = 0; i < parts.length; i++){
    const kv = parts[i].split('=')
    q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '')
  }
  return q
}

function needUser(user){
  if(!user){
    fail(401, 'Please login')
  }
}

function needRole(user, roles){
  needUser(user)
  if (roles.indexOf(user.role) === -1){
    fail(403, 'Not allowed')
  }
}

function needVerified(user){
  needRole(user, ['farmer'])
  if (!user.verified){
    fail(403, 'Your farm is not verified yet')
  }
}

function listProducts(q, user){
  let list = []
  for (let i = 0; i < db.products.length; i++){
    const p = db.products[i]
    if (q.farmer){
      const fid = q.farmer === 'me' ? (user ? user.id : '') : q.farmer
      if (p.farmer !== fid) continue
    } else {
      if (!p.active) continue
    }
    if (q.q && p.name.toLowerCase().indexOf(q.q.toLowerCase()) === -1 && p.description.toLowerCase().indexOf(q.q.toLowerCase()) === -1) continue
    if (q.category && p.category !== q.category) continue
    if (q.minPrice && p.price < Number(q.minPrice)) continue
    if (q.maxPrice && p.price > Number(q.maxPrice)) continue
    if (q.location && p.location.toLowerCase().indexOf(q.location.toLowerCase()) === -1) continue
    list.push(p)
  }
  if (q.sort === 'price,asc'){
    list = sortBy(list, 'price', 1)
  } else if (q.sort === 'price,desc'){
    list = sortBy(list, 'price', -1)
  } else if (q.sort === 'name,asc'){
    list = sortBy(list, 'name', 1)
  } else {
    list = newest(list)
  }
  const size = Number(q.size || 12)
  const page = Number(q.page || 0)
  const out = []
  const slice = list.slice(page * size, page * size + size)
  for (let i = 0; i < slice.length; i++){
    out.push(outProduct(slice[i]))
  }
  return { products: out, page: { number: page, totalPages: Math.ceil(list.length / size), totalElements: list.length } }
}

const allowed = {
  placed: { packed: ['farmer', 'admin'], cancelled: ['customer', 'admin'] },
  packed: { out_for_delivery: ['rider', 'admin'] },
  out_for_delivery: { delivered: ['rider', 'admin'] },
}

export async function mockRequest(method, url, body, token){
  await new Promise(r => setTimeout(r, 250))
  const user = token ? byId(db.users, token.replace('mock-', '')) : null
  const split = url.split('?')
  const parts = split[0].split('/').filter(Boolean)
  const q = parseQuery(split[1])
  const a = parts[0]
  const b = parts[1]
  const c = parts[2]

  if (a === 'auth'){
    if (b === 'login' && method === 'POST'){
      for (let i = 0; i < db.users.length; i++){
        if (db.users[i].email === body.email && db.users[i].password === body.password){
          return { user: publicUser(db.users[i]), token: 'mock-' + db.users[i].id }
        }
      }
      fail(400, 'Wrong credentials')
    }
    if (b === 'register' && method === 'POST'){
      for (let i = 0; i < db.users.length; i++){
        if (db.users[i].email === body.email){
          fail(400, 'An account with this email already exists')
        }
      }
      if (body.role === 'admin'){
        fail(400, 'Cannot register as admin')
      }
      const u = { id: newId('u'), name: body.name, email: body.email, password: body.password, role: body.role || 'customer', verified: false, farmName: body.farmName || '', location: body.location || '', bio: body.bio || '', createdAt: now() }
      db.users.push(u)
      return { user: publicUser(u), token: 'mock-' + u.id }
    }
    if (b === 'me'){
      needUser(user)
      return { user: publicUser(user) }
    }
  }

  if (a === 'products'){
    if (!b && method === 'GET'){
      return listProducts(q, user)
    }
    if (!b && method === 'POST'){
      needVerified(user)
      if (!body.name || !body.price){
        fail(400, 'Name and price are required')
      }
      const p = { id: newId('p'), farmer: user.id, name: body.name, description: body.description || '', category: body.category || 'Vegetables', price: Number(body.price), quantity: Number(body.quantity || 0), unit: body.unit || 'kg', images: body.images || [], location: user.location || '', active: true, createdAt: now() }
      db.products.push(p)
      const fol = followersOf(user.id)
      for (let i = 0; i < fol.length; i++){
        notify(fol[i], 'new_product', user.farmName + ' added ' + p.name, '/products/' + p.id)
      }
      return { product: outProduct(p) }
    }
    const p = byId(db.products, b)
    if (!p){
      fail(404, 'Product not found')
    }
    if (method === 'GET'){
      const revs = []
      for (let i = 0; i < db.reviews.length; i++){
        if (db.reviews[i].product === p.id){
          revs.push(outReview(db.reviews[i]))
        }
      }
      return { product: outProduct(p), reviews: newest(revs) }
    }
    needUser(user)
    if (p.farmer !== user.id && user.role !== 'admin'){
      fail(403, 'Not allowed')
    }
    if (method === 'PUT'){
      const keys = ['name', 'description', 'category', 'price', 'quantity', 'unit', 'images', 'active']
      for (let i = 0; i < keys.length; i++){
        if (body[keys[i]] !== undefined){
          p[keys[i]] = body[keys[i]]
        }
      }
      p.price = Number(p.price)
      p.quantity = Number(p.quantity)
      return { product: outProduct(p) }
    }
    if (method === 'DELETE'){
      db.products.splice(db.products.indexOf(p), 1)
      return { ok: true }
    }
  }

  if (a === 'farms'){
    if (b === 'following' && method === 'GET'){
      needUser(user)
      const list = []
      for (let i = 0; i < db.follows.length; i++){
        if (db.follows[i].customer === user.id){
          const f = byId(db.users, db.follows[i].farmer)
          let latest = null
          const ups = newest(db.updates.filter(x => x.farmer === f.id))
          if (ups.length > 0){
            latest = outUpdate(ups[0])
          }
          list.push({ farm: publicUser(f), latestUpdate: latest, productCount: db.products.filter(x => x.farmer === f.id && x.active).length })
        }
      }
      return { farms: list }
    }
    const f = byId(db.users, b)
    if (!f || f.role !== 'farmer'){
      fail(404, 'Farm not found')
    }
    if (c === 'follow'){
      needRole(user, ['customer'])
      let existing = null
      for (let i = 0; i < db.follows.length; i++){
        if (db.follows[i].customer === user.id && db.follows[i].farmer === f.id){
          existing = db.follows[i]
        }
      }
      if (method === 'POST' && !existing){
        db.follows.push({ id: newId('f'), customer: user.id, farmer: f.id })
      }
      if (method === 'DELETE' && existing){
        db.follows.splice(db.follows.indexOf(existing), 1)
      }
      return { following: method === 'POST', followers: followersOf(f.id).length }
    }
    if (method === 'GET'){
      const prods = []
      for (let i = 0; i < db.products.length; i++){
        if (db.products[i].farmer === f.id && db.products[i].active){
          prods.push(outProduct(db.products[i]))
        }
      }
      const ups = []
      for (let i = 0; i < db.updates.length; i++){
        if (db.updates[i].farmer === f.id){
          ups.push(outUpdate(db.updates[i]))
        }
      }
      let following = false
      for (let i = 0; i < db.follows.length; i++){
        if (user && db.follows[i].customer === user.id && db.follows[i].farmer === f.id){
          following = true
        }
      }
      const r = ratingFor(x => x.farmer === f.id)
      return { farm: publicUser(f), products: newest(prods), updates: newest(ups), followers: followersOf(f.id).length, following: following, rating: r.rating, reviewCount: r.reviewCount }
    }
  }

  if (a === 'updates'){
    if (method === 'GET'){
      const fid = q.farmer === 'me' ? (user ? user.id : '') : q.farmer
      const list = []
      for (let i = 0; i < db.updates.length; i++){
        if (!fid || db.updates[i].farmer === fid){
          list.push(outUpdate(db.updates[i]))
        }
      }
      return { updates: newest(list) }
    }
    if (method === 'POST'){
      needVerified(user)
      if (!body.title){
        fail(400, 'Title is required')
      }
      const u = { id: newId('n'), farmer: user.id, title: body.title, body: body.body || '', images: body.images || [], createdAt: now() }
      db.updates.unshift(u)
      const fol = followersOf(user.id)
      for (let i = 0; i < fol.length; i++){
        notify(fol[i], 'new_update', user.farmName + ' posted: ' + u.title, '/farms/' + user.id)
      }
      return { update: outUpdate(u) }
    }
  }

  if (a === 'orders'){
    if (!b && method === 'POST'){
      needRole(user, ['customer'])
      if (!body.items || body.items.length === 0){
        fail(400, 'Cart is empty')
      }
      if (!body.address || !body.phone){
        fail(400, 'Address and phone are required')
      }
      const groups = {}
      for (let i = 0; i < body.items.length; i++){
        const p = byId(db.products, body.items[i].product)
        const qty = Number(body.items[i].qty)
        if (!p || !p.active){
          fail(400, 'A product in your cart is no longer available')
        }
        if (qty < 1){
          fail(400, 'Quantity must be at least 1')
        }
        if (p.quantity < qty){
          fail(400, 'Only ' + p.quantity + ' ' + p.unit + ' of ' + p.name + ' left')
        }
        if (!groups[p.farmer]){
          groups[p.farmer] = []
        }
        groups[p.farmer].push({ product: p.id, name: p.name, price: p.price, qty: qty, unit: p.unit, image: p.images[0] || '' })
      }
      const made = []
      const farmerIds = Object.keys(groups)
      for (let i = 0; i < farmerIds.length; i++){
        const items = groups[farmerIds[i]]
        let total = 0
        for (let j = 0; j < items.length; j++){
          total += items[j].price * items[j].qty
          const p = byId(db.products, items[j].product)
          p.quantity -= items[j].qty
        }
        const o = { id: newId('o'), customer: user.id, farmer: farmerIds[i], items: items, total: total, address: body.address, phone: body.phone, status: 'placed', rider: null, createdAt: now(), history: [{ status: 'placed', at: now(), by: user.name }] }
        db.orders.unshift(o)
        notify(farmerIds[i], 'order_status', 'New order from ' + user.name, '/farmer')
        made.push(outOrder(o))
      }
      return { orders: made }
    }
    if (b === 'mine' && method === 'GET'){
      needUser(user)
      const list = []
      for (let i = 0; i < db.orders.length; i++){
        const o = db.orders[i]
        if (user.role === 'customer' && o.customer === user.id) list.push(outOrder(o))
        if (user.role === 'farmer' && o.farmer === user.id) list.push(outOrder(o))
        if (user.role === 'rider' && o.rider === user.id) list.push(outOrder(o))
        if (user.role === 'admin') list.push(outOrder(o))
      }
      return { orders: newest(list) }
    }
    if (b === 'available' && method === 'GET'){
      needRole(user, ['rider'])
      const list = []
      for (let i = 0; i < db.orders.length; i++){
        if (db.orders[i].status === 'packed' && !db.orders[i].rider){
          list.push(outOrder(db.orders[i]))
        }
      }
      return { orders: newest(list) }
    }
    const o = byId(db.orders, b)
    if (!o){
      fail(404, 'Order not found')
    }
    needUser(user)
    if (c === 'claim' && method === 'POST'){
      needRole(user, ['rider'])
      if (o.status !== 'packed' || o.rider){
        fail(400, 'This order is not available')
      }
      o.rider = user.id
      return { order: outOrder(o) }
    }
    const party = o.customer === user.id || o.farmer === user.id || o.rider === user.id || user.role === 'admin'
    if (!party){
      fail(403, 'Not allowed')
    }
    if (method === 'GET'){
      return { order: outOrder(o) }
    }
    if (c === 'status' && method === 'PATCH'){
      const next = body.status
      const options = allowed[o.status] || {}
      if (!options[next] || options[next].indexOf(user.role) === -1){
        const can = Object.keys(options)
        fail(400, can.length ? 'From ' + o.status + ' this order can only go to ' + can.join(' or ') : 'This order is finished')
      }
      if (user.role === 'rider' && o.rider !== user.id){
        fail(403, 'Claim this order first')
      }
      if (next === 'cancelled'){
        for (let i = 0; i < o.items.length; i++){
          const p = byId(db.products, o.items[i].product)
          if (p) p.quantity += o.items[i].qty
        }
      }
      o.status = next
      o.history.push({ status: next, at: now(), by: user.name })
      const farmName = farmerInfo(o.farmer).farmName
      const words = { packed: 'is packed', out_for_delivery: 'is out for delivery', delivered: 'was delivered', cancelled: 'was cancelled' }
      notify(o.customer, 'order_status', 'Your order from ' + farmName + ' ' + words[next], '/orders/' + o.id)
      if (next === 'cancelled'){
        notify(o.farmer, 'order_status', 'Order ' + o.id + ' was cancelled by ' + user.name, '/farmer')
      }
      return { order: outOrder(o) }
    }
  }

  if (a === 'reviews'){
    if (method === 'GET'){
      const list = []
      for (let i = 0; i < db.reviews.length; i++){
        if (!q.product || db.reviews[i].product === q.product){
          list.push(outReview(db.reviews[i]))
        }
      }
      return { reviews: newest(list) }
    }
    if (method === 'POST'){
      needRole(user, ['customer'])
      const o = byId(db.orders, body.order)
      if (!o || o.customer !== user.id || o.status !== 'delivered'){
        fail(400, 'You can only review products from a delivered order')
      }
      let inOrder = false
      for (let i = 0; i < o.items.length; i++){
        if (o.items[i].product === body.product) inOrder = true
      }
      if (!inOrder){
        fail(400, 'That product is not in this order')
      }
      for (let i = 0; i < db.reviews.length; i++){
        const r = db.reviews[i]
        if (r.customer === user.id && r.product === body.product && r.order === o.id){
          fail(400, 'You already reviewed this product')
        }
      }
      const rating = Number(body.rating)
      if (!(rating >= 1 && rating <= 5)){
        fail(400, 'Rating must be 1 to 5')
      }
      const r = { id: newId('r'), customer: user.id, product: body.product, farmer: o.farmer, order: o.id, rating: rating, comment: body.comment || '', createdAt: now() }
      db.reviews.unshift(r)
      return { review: outReview(r) }
    }
  }

  if (a === 'notifications'){
    needUser(user)
    const mine = []
    for (let i = 0; i < db.notifications.length; i++){
      if (db.notifications[i].user === user.id){
        mine.push(db.notifications[i])
      }
    }
    if (method === 'GET'){
      let unread = 0
      for (let i = 0; i < mine.length; i++){
        if (!mine[i].read) unread++
      }
      return { notifications: newest(mine), unread: unread }
    }
    if (b === 'read' && method === 'PATCH'){
      for (let i = 0; i < mine.length; i++){
        mine[i].read = true
      }
      return { ok: true }
    }
  }

  if (a === 'admin'){
    needRole(user, ['admin'])
    if (b === 'farmers' && method === 'GET'){
      const list = []
      for (let i = 0; i < db.users.length; i++){
        const u = db.users[i]
        if (u.role !== 'farmer') continue
        if (q.verified === 'false' && (u.verified || u.rejected)) continue
        if (q.verified === 'true' && !u.verified) continue
        list.push(publicUser(u))
      }
      return { farmers: list }
    }
    if (b === 'farmers' && c && method === 'PATCH'){
      const f = byId(db.users, c)
      if (!f || f.role !== 'farmer'){
        fail(404, 'Farmer not found')
      }
      f.verified = !!body.approve
      f.rejected = !body.approve
      notify(f.id, 'order_status', body.approve ? 'Your farm has been verified. You can start selling.' : 'Your farm verification was rejected.', '/farmer')
      return { farmer: publicUser(f) }
    }
    if (b === 'users' && method === 'GET'){
      const list = []
      for (let i = 0; i < db.users.length; i++){
        list.push(publicUser(db.users[i]))
      }
      return { users: list }
    }
    if (b === 'orders' && method === 'GET'){
      const list = []
      for (let i = 0; i < db.orders.length; i++){
        list.push(outOrder(db.orders[i]))
      }
      return { orders: newest(list) }
    }
  }

  fail(404, 'No route for ' + method + ' /' + parts.join('/'))
}
