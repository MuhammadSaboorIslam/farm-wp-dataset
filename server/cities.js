const CITIES = {
  Lahore: [31.5204, 74.3587],
  Karachi: [24.8607, 67.0011],
  Islamabad: [33.6844, 73.0479],
  Rawalpindi: [33.5651, 73.0169],
  Faisalabad: [31.4504, 73.135],
  Multan: [30.1575, 71.5249],
  Peshawar: [34.0151, 71.5249],
  Quetta: [30.1798, 66.975],
  Sialkot: [32.4945, 74.5229],
  Gujranwala: [32.1877, 74.1945],
  Hyderabad: [25.396, 68.3578],
  Bahawalpur: [29.3544, 71.6911],
  Sargodha: [32.0836, 72.6711],
  Sukkur: [27.7052, 68.8574],
  Sahiwal: [30.6682, 73.1114],
  Okara: [30.8138, 73.4534],
  Kasur: [31.1187, 74.4634],
  Sheikhupura: [31.7167, 73.985],
  Gujrat: [32.5731, 74.1005],
  Jhang: [31.2681, 72.3181],
  'Rahim Yar Khan': [28.4202, 70.2952],
  Abbottabad: [34.1688, 73.2215],
  Mardan: [34.1986, 72.0404],
  'Dera Ghazi Khan': [30.0459, 70.6403],
  Larkana: [27.557, 68.2264],
  Jhelum: [32.9425, 73.7257],
  Khanewal: [30.3017, 71.9321],
  Vehari: [30.0445, 72.3556],
  Muzaffargarh: [30.0703, 71.1933],
  Chiniot: [31.72, 72.9789],
  Mingora: [34.7717, 72.36],
  Gilgit: [35.9208, 74.3089],
  Muzaffarabad: [34.37, 73.4711],
  Hafizabad: [32.0709, 73.688],
  Narowal: [32.102, 74.873],
  Attock: [33.766, 72.3609],
  Chakwal: [32.9328, 72.863],
  'Mandi Bahauddin': [32.5861, 73.4917],
  Pakpattan: [30.3436, 73.387],
  Nawabshah: [26.2442, 68.41],
  'Mirpur Khas': [25.5276, 69.0111],
}

function norm(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findcity(text) {
  const t = ' ' + norm(text) + ' '
  let best = null
  for (const name in CITIES) {
    if (t.includes(' ' + norm(name) + ' ') && (!best || name.length > best.length)) best = name
  }
  return best
}

module.exports = { CITIES, findcity }
