import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getProjects = (params = {}) => api.get('/projects', { params })
export const deleteProject = (id) => api.delete(`/projects/${id}`)
export const clearProjects = () => api.delete('/projects')
export const getSummary = () => api.get('/dashboard/summary')

export default api
