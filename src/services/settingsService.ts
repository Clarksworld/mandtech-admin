import { apiRequest } from './api';

export interface NotificationSettings {
  emails: string[];
  enabled_types: string[];
  updated_at?: string | null;
  is_default?: boolean;
}

export async function fetchNotificationSettings(): Promise<{ data: NotificationSettings }> {
  return apiRequest<{ data: NotificationSettings }>('/api/admin/settings/notifications');
}

export async function updateNotificationSettings(
  emails: string[],
  enabled_types: string[]
): Promise<{ message: string; data: NotificationSettings }> {
  return apiRequest<{ message: string; data: NotificationSettings }>('/api/admin/settings/notifications', {
    method: 'PUT',
    body: JSON.stringify({ emails, enabled_types }),
  });
}

export async function sendTestNotificationAlert(
  emails?: string[]
): Promise<{ success: boolean; message: string; recipients: string[] }> {
  return apiRequest<{ success: boolean; message: string; recipients: string[] }>(
    '/api/admin/settings/notifications/test',
    {
      method: 'POST',
      body: JSON.stringify({ emails }),
    }
  );
}
