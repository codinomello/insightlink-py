import axios, { type AxiosResponse } from 'axios';
import type { DashboardSummary, Project } from './types';

const api = axios.create({ baseURL: '/api' });

export interface UploadResponse {
  imported: number;
}

export const uploadFile = (file: File): Promise<AxiosResponse<UploadResponse>> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getProjects = (params: Record<string, unknown> = {}): Promise<AxiosResponse<Project[]>> => 
  api.get<Project[]>('/projects', { params });

export const deleteProject = (id: string | number): Promise<AxiosResponse<void>> => 
  api.delete(`/projects/${id}`);

export const clearProjects = (): Promise<AxiosResponse<void>> => 
  api.delete('/projects');

export const getSummary = (): Promise<AxiosResponse<DashboardSummary>> => 
  api.get<DashboardSummary>('/dashboard/summary');

export default api;