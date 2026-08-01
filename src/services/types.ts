export interface ProductSpec {
  label: string;
  icon_name?: string;
}

export interface Product {
  id: string;
  title: string;
  category: 'Air Compressors' | 'Generators' | 'Pumps' | 'Air Dryers' | string;
  brand: string;
  driven_type?: 'Electric' | 'Diesel Driven' | string;
  capacity?: number;
  badge?: string | null;
  specs?: ProductSpec[];
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface Part {
  id: string;
  title: string;
  category: 'Air Filtration' | 'Control Systems' | 'Electrical Spares' | 'Mechanical Gaskets' | string;
  brand: string;
  sku: string;
  compatibility?: string;
  condition?: 'New OEM' | 'Refurbished' | string;
  badge?: string | null;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface TechnicalDocument {
  id: string;
  title: string;
  file_url: string;
  file_size?: string;
  read_duration?: string;
  icon_emoji?: string;
}

export interface Inquiry {
  id?: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  message: string;
  equipment_interests?: string[];
  newsletter_opt_in?: boolean;
  status?: 'new' | 'in_review' | 'responded' | 'closed';
  created_at?: string;
}

export interface ServiceTicket {
  id?: string;
  asset_serial_id: string;
  service_type: string;
  description: string;
  urgency: 'Standard Route' | 'High Priority' | 'Emergency Site Breakdown';
  authorize_dispatch: boolean;
  status?: string;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}
