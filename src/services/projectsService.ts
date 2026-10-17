import { apiRequest } from './api';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  assigned_to?: string | null;
  assigned_name?: string | null;
  due_date?: string | null;
  created_at?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  backlog_count?: number;
  in_progress_count?: number;
  done_count?: number;
  total_tasks?: number;
  tasks?: Task[];
  created_at?: string;
}

export async function fetchProjects(status?: string): Promise<{ data: Project[]; total: number }> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<{ data: Project[]; total: number }>(`/api/admin/projects${qs}`);
}

export async function fetchProjectDetails(id: string): Promise<{ data: Project }> {
  return apiRequest<{ data: Project }>(`/api/admin/projects/${id}`);
}

export async function createProject(data: { title: string; description?: string }): Promise<{ data: Project }> {
  return apiRequest<{ data: Project }>('/api/admin/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createTask(projectId: string, data: {
  title: string;
  description?: string;
  status?: 'backlog' | 'in_progress' | 'review' | 'done';
  assigned_name?: string;
  due_date?: string;
}): Promise<{ data: Task }> {
  return apiRequest<{ data: Task }>(`/api/admin/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(taskId: string, data: Partial<Task>): Promise<{ data: Task }> {
  return apiRequest<{ data: Task }>(`/api/admin/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(taskId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/admin/tasks/${taskId}`, {
    method: 'DELETE',
  });
}
