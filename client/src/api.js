let onlogout = null

export function whenLoggedOut(fn) {
  onlogout = fn
}

function loggedout() {
  localStorage.removeItem('user')
  if (onlogout) {
    onlogout()
  }
}

async function request(method, url, body) {
  const options = { method: method, headers: {} }
  if (body) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }
  const res = await fetch('/api' + url, options)
  const data = await res.json()
  if (!res.ok) {
    if (res.status === 401) {
      loggedout()
    }
    throw new Error(data.message || 'Request failed with status ' + res.status)
  }
  return data
}

export function get(url) {
  return request('GET', url)
}
export function post(url, body) {
  return request('POST', url, body)
}
export function put(url, body) {
  return request('PUT', url, body)
}
export function patch(url, body) {
  return request('PATCH', url, body)
}
export function del(url) {
  return request('DELETE', url)
}

export function toquery(params) {
  let query = ''
  for (const key in params) {
    if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
      query += (query ? '&' : '?') + key + '=' + encodeURIComponent(params[key])
    }
  }
  return query
}
