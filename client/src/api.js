import { mockrequest } from './mock/handler'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function token() {
  return localStorage.getItem('token')
}

async function request(method, url, body) {
  if (USE_MOCK) {
    try {
      const data = await mockrequest(method, url, body ? JSON.parse(JSON.stringify(body)) : body, token())
      return JSON.parse(JSON.stringify(data))
    } catch (e) {
      if (e.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      throw e
    }
  }
  const options = { method: method, headers: {} }
  if (body) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }
  if (token()) {
    options.headers['Authorization'] = 'Bearer ' + token()
  }
  const res = await fetch('/api' + url, options)
  const data = await res.json()
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
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
