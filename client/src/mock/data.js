function pic(seed){
  return '/img/' + seed + '.svg'
}

export const users = [
  { id: 'u1', name: 'Admin', email: 'admin@farmdirect.com', password: 'password', role: 'admin', verified: true },
  { id: 'u2', name: 'Ali Raza', email: 'ali@farm.com', password: 'password', role: 'farmer', verified: true, farmName: 'Green Valley Farm', location: 'Lahore', bio: 'Family farm on the outskirts of Lahore. Vegetables all year, strawberries in spring. No chemical sprays, we pick the day before delivery.' },
  { id: 'u3', name: 'Sara Khan', email: 'sara@farm.com', password: 'password', role: 'farmer', verified: true, farmName: 'Sunrise Orchard', location: 'Multan', bio: 'Mangoes, citrus and honey from our orchard near Multan. We also keep a few cows so there is fresh milk most mornings.' },
  { id: 'u4', name: 'Bilal Ahmed', email: 'bilal@farm.com', password: 'password', role: 'farmer', verified: false, farmName: 'Bilal Dairy', location: 'Faisalabad', bio: 'Small dairy with 20 buffaloes. Milk, yogurt and desi ghee.' },
  { id: 'u5', name: 'Ahmed', email: 'customer@test.com', password: 'password', role: 'customer' },
  { id: 'u6', name: 'Usman', email: 'rider@test.com', password: 'password', role: 'rider' },
  { id: 'u7', name: 'Fatima', email: 'fatima@test.com', password: 'password', role: 'customer' },
]

export const products = [
  { id: 'p1', farmer: 'u2', name: 'Tomatoes', description: 'Vine ripened desi tomatoes. Picked the day before delivery.', category: 'Vegetables', price: 120, quantity: 40, unit: 'kg', images: [pic('tomato')], location: 'Lahore', active: true, createdAt: '2026-10-20T09:00:00Z' },
  { id: 'p2', farmer: 'u2', name: 'Spinach', description: 'Fresh palak, washed and bundled.', category: 'Vegetables', price: 60, quantity: 25, unit: 'bunch', images: [pic('spinach')], location: 'Lahore', active: true, createdAt: '2026-10-22T09:00:00Z' },
  { id: 'p3', farmer: 'u2', name: 'Potatoes', description: 'Red potatoes, good for frying and curries.', category: 'Vegetables', price: 80, quantity: 100, unit: 'kg', images: [pic('potato')], location: 'Lahore', active: true, createdAt: '2026-10-25T09:00:00Z' },
  { id: 'p4', farmer: 'u2', name: 'Strawberries', description: 'First strawberries of the season. Small boxes, very sweet.', category: 'Fruits', price: 450, quantity: 12, unit: 'kg', images: [pic('strawberry')], location: 'Lahore', active: true, createdAt: '2026-11-01T09:00:00Z' },
  { id: 'p5', farmer: 'u2', name: 'Free Range Eggs', description: 'Desi eggs from hens that roam the farm.', category: 'Dairy & Eggs', price: 380, quantity: 30, unit: 'dozen', images: [pic('eggs')], location: 'Lahore', active: true, createdAt: '2026-10-18T09:00:00Z' },
  { id: 'p6', farmer: 'u2', name: 'Coriander', description: 'Dhania, cut fresh every morning.', category: 'Herbs', price: 30, quantity: 50, unit: 'bunch', images: [pic('coriander')], location: 'Lahore', active: true, createdAt: '2026-10-28T09:00:00Z' },
  { id: 'p7', farmer: 'u3', name: 'Chaunsa Mangoes', description: 'Last of the Chaunsa this year. Tree ripened.', category: 'Fruits', price: 350, quantity: 0, unit: 'kg', images: [pic('mango')], location: 'Multan', active: true, createdAt: '2026-10-10T09:00:00Z' },
  { id: 'p8', farmer: 'u3', name: 'Kinnow', description: 'Early kinnow, a little tart, great for juice.', category: 'Fruits', price: 150, quantity: 80, unit: 'kg', images: [pic('kinnow')], location: 'Multan', active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'p9', farmer: 'u3', name: 'Raw Honey', description: 'Unfiltered honey from hives in the orchard. 1 litre bottle.', category: 'Honey', price: 1800, quantity: 15, unit: 'litre', images: [pic('honey')], location: 'Multan', active: true, createdAt: '2026-10-15T09:00:00Z' },
  { id: 'p10', farmer: 'u3', name: 'Fresh Milk', description: 'Cow milk, delivered the same morning. Boil before use.', category: 'Dairy & Eggs', price: 220, quantity: 20, unit: 'litre', images: [pic('milk')], location: 'Multan', active: true, createdAt: '2026-10-30T09:00:00Z' },
  { id: 'p11', farmer: 'u3', name: 'Basmati Rice', description: 'Last year harvest, aged 12 months. 5 kg bags.', category: 'Grains', price: 1900, quantity: 10, unit: 'piece', images: [pic('rice')], location: 'Multan', active: true, createdAt: '2026-10-12T09:00:00Z' },
  { id: 'p12', farmer: 'u3', name: 'Lemons', description: 'Thin skin desi lemons.', category: 'Fruits', price: 200, quantity: 35, unit: 'kg', images: [pic('lemon')], location: 'Multan', active: true, createdAt: '2026-10-27T09:00:00Z' },
]

export const orders = [
  { id: 'o1', customer: 'u5', farmer: 'u2', items: [{ product: 'p1', name: 'Tomatoes', price: 120, qty: 2, unit: 'kg', image: pic('tomato') }, { product: 'p5', name: 'Free Range Eggs', price: 380, qty: 1, unit: 'dozen', image: pic('eggs') }], total: 620, address: '12 Canal Road, Lahore', phone: '03001234567', status: 'delivered', rider: 'u6', createdAt: '2026-10-20T10:00:00Z',
    history: [{ status: 'placed', at: '2026-10-20T10:00:00Z', by: 'Ahmed' }, { status: 'packed', at: '2026-10-20T14:00:00Z', by: 'Ali Raza' }, { status: 'out_for_delivery', at: '2026-10-21T08:00:00Z', by: 'Usman' }, { status: 'delivered', at: '2026-10-21T11:30:00Z', by: 'Usman' }] },
  { id: 'o2', customer: 'u5', farmer: 'u3', items: [{ product: 'p9', name: 'Raw Honey', price: 1800, qty: 1, unit: 'litre', image: pic('honey') }], total: 1800, address: '12 Canal Road, Lahore', phone: '03001234567', status: 'out_for_delivery', rider: 'u6', createdAt: '2026-11-02T16:00:00Z',
    history: [{ status: 'placed', at: '2026-11-02T16:00:00Z', by: 'Ahmed' }, { status: 'packed', at: '2026-11-03T09:00:00Z', by: 'Sara Khan' }, { status: 'out_for_delivery', at: '2026-11-04T02:30:00Z', by: 'Usman' }] },
  { id: 'o3', customer: 'u5', farmer: 'u2', items: [{ product: 'p4', name: 'Strawberries', price: 450, qty: 1, unit: 'kg', image: pic('strawberry') }, { product: 'p2', name: 'Spinach', price: 60, qty: 3, unit: 'bunch', image: pic('spinach') }], total: 630, address: '12 Canal Road, Lahore', phone: '03001234567', status: 'packed', rider: null, createdAt: '2026-11-03T18:00:00Z',
    history: [{ status: 'placed', at: '2026-11-03T18:00:00Z', by: 'Ahmed' }, { status: 'packed', at: '2026-11-04T08:00:00Z', by: 'Ali Raza' }] },
  { id: 'o4', customer: 'u5', farmer: 'u3', items: [{ product: 'p8', name: 'Kinnow', price: 150, qty: 5, unit: 'kg', image: pic('kinnow') }], total: 750, address: '12 Canal Road, Lahore', phone: '03001234567', status: 'placed', rider: null, createdAt: '2026-11-04T04:15:00Z',
    history: [{ status: 'placed', at: '2026-11-04T04:15:00Z', by: 'Ahmed' }] },
  { id: 'o5', customer: 'u7', farmer: 'u2', items: [{ product: 'p3', name: 'Potatoes', price: 80, qty: 10, unit: 'kg', image: pic('potato') }], total: 800, address: '5 Model Town, Lahore', phone: '03219876543', status: 'placed', rider: null, createdAt: '2026-11-04T03:40:00Z',
    history: [{ status: 'placed', at: '2026-11-04T03:40:00Z', by: 'Fatima' }] },
]

export const updates = [
  { id: 'n1', farmer: 'u2', title: 'Strawberries are in', body: 'First pick of the season came in this morning. Only a few boxes a day for now, so order early.', images: [pic('strawberryfield', 800, 500)], createdAt: '2026-11-01T08:00:00Z' },
  { id: 'n2', farmer: 'u2', title: 'Winter vegetables planted', body: 'Carrots, peas and cauliflower went into the ground this week. Expect them in late December.', images: [], createdAt: '2026-10-24T08:00:00Z' },
  { id: 'n3', farmer: 'u3', title: 'Kinnow season starts', body: 'Early kinnow is ready. Still a bit tart but perfect for juice. Sweeter batches from mid November.', images: [pic('orchard', 800, 500)], createdAt: '2026-11-02T08:00:00Z' },
  { id: 'n4', farmer: 'u3', title: 'Mangoes finished for the year', body: 'That is the last of the Chaunsa. Thank you to everyone who ordered. See you in June.', images: [], createdAt: '2026-10-12T08:00:00Z' },
]

export const follows = [
  { id: 'f1', customer: 'u5', farmer: 'u2' },
  { id: 'f2', customer: 'u7', farmer: 'u2' },
  { id: 'f3', customer: 'u7', farmer: 'u3' },
]

export const notifications = [
  { id: 'x1', user: 'u5', type: 'order_status', text: 'Your order from Sunrise Orchard is out for delivery', link: '/orders/o2', read: false, createdAt: '2026-11-04T02:30:00Z' },
  { id: 'x2', user: 'u5', type: 'new_product', text: 'Green Valley Farm added Strawberries', link: '/products/p4', read: false, createdAt: '2026-11-01T09:00:00Z' },
  { id: 'x3', user: 'u5', type: 'new_update', text: 'Green Valley Farm posted: Strawberries are in', link: '/farms/u2', read: true, createdAt: '2026-11-01T08:00:00Z' },
  { id: 'x4', user: 'u5', type: 'order_status', text: 'Your order from Green Valley Farm was delivered', link: '/orders/o1', read: true, createdAt: '2026-10-21T11:30:00Z' },
  { id: 'x5', user: 'u2', type: 'order_status', text: 'New order from Fatima', link: '/farmer', read: false, createdAt: '2026-11-04T03:40:00Z' },
  { id: 'x6', user: 'u3', type: 'order_status', text: 'New order from Ahmed', link: '/farmer', read: false, createdAt: '2026-11-04T09:15:00Z' },
]

export const reviews = [
  { id: 'r1', customer: 'u5', product: 'p1', farmer: 'u2', order: 'o1', rating: 5, comment: 'Best tomatoes I have had in months. Actually taste like tomatoes.', createdAt: '2026-10-22T10:00:00Z' },
  { id: 'r2', customer: 'u5', product: 'p5', farmer: 'u2', order: 'o1', rating: 4, comment: 'Good eggs, two were cracked though.', createdAt: '2026-10-22T10:05:00Z' },
  { id: 'r3', customer: 'u7', product: 'p9', farmer: 'u3', order: 'o0', rating: 5, comment: 'Thick, dark, nothing like the shop stuff.', createdAt: '2026-10-05T10:00:00Z' },
]
