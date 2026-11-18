const { CITIES, findcity } = require('./cities')

const BASE = 100
const PER_KM = 15
const MAX_FEE = 1500
const LOCAL_KM = 5
const ROAD_FACTOR = 1.25

function straightkm(a, b) {
  const r = Math.PI / 180
  const h =
    Math.sin(((b[0] - a[0]) * r) / 2) ** 2 +
    Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(((b[1] - a[1]) * r) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

function quote(farmLocation, address) {
  const from = findcity(farmLocation)
  const to = findcity(address) || from
  let km = LOCAL_KM
  if (from && to && from !== to) {
    km = Math.max(LOCAL_KM, Math.round(straightkm(CITIES[from], CITIES[to]) * ROAD_FACTOR))
  }
  const fee = Math.min(MAX_FEE, Math.round((BASE + PER_KM * km) / 10) * 10)
  return { distanceKm: km, deliveryFee: fee }
}

module.exports = { quote, straightkm, BASE, PER_KM, MAX_FEE }
