import axios from 'axios'
import { agentToken } from '../services/access.js'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = agentToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
