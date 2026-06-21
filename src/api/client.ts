import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refreshToken')
      if (!refresh) { clearAuth(); return Promise.reject(err) }
      try {
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken: refresh })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        clearAuth()
        return Promise.reject(err)
      }
    }
    return Promise.reject(err)
  }
)

function clearAuth() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  window.location.href = '/login'
}
