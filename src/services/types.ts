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
  assigned_to?: string | null;
  assigned_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InquiryStats {
  total: number;
  new: number;
  in_review: number;
  responded: number;
  closed: number;
  by_class?: {
    new_purchase: number;
    rental: number;
    spare_parts: number;
    service_request: number;
  };
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

export interface CompressorRequest {
  id: string;
  compressor_type: 'ELECTRIC AIR COMPRESSOR' | 'DIESEL AIR COMPRESSOR';
  brand: 'ATLAS COPCO' | 'SULLAIR' | 'INGERSOLL RAND' | 'DENAIR';
  condition?: 'NEW' | 'USED';
  company_name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'quoted' | 'closed';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompressorRequestStats {
  total: number;
  new: number;
  contacted: number;
  quoted: number;
  closed: number;
  types: {
    electric: number;
    diesel: number;
  };
  brands: {
    atlas_copco: number;
    sullair: number;
    ingersoll_rand: number;
    denair: number;
  };
}

export interface SparePartsRequest {
  id: string;
  brand: "ATLAS COPCO" | "SULLAIR" | "INGERSOLL RAND" | "DENAIR";
  part_name: string;
  company_name: string;
  email: string;
  phone: string;
  status: "new" | "contacted" | "quoted" | "closed";
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SparePartsRequestStats {
  total: number;
  new: number;
  contacted: number;
  quoted: number;
  closed: number;
  brands: {
    atlas_copco: number;
    sullair: number;
    ingersoll_rand: number;
    denair: number;
  };
}


export interface LeasingRequest {
  id: string;
  compressor_type: string;
  brand: string;
  duration: string;
  hub: string;
  company_name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'quoted' | 'closed';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeasingRequestStats {
  total: number;
  new: number;
  contacted: number;
  quoted: number;
  closed: number;
  brands: {
    atlas_copco: number;
    sullair: number;
    ingersoll_rand: number;
    denair: number;
  };
  types: {
    electric: number;
    diesel: number;
  };
}

export interface LubricantRequest {
  id: string;
  brand: string;
  fluid_type: string;
  volume: string;
  hub: string;
  company_name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'quoted' | 'closed';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LubricantRequestStats {
  total: number;
  new: number;
  contacted: number;
  quoted: number;
  closed: number;
  brands: {
    atlas_copco: number;
    sullair: number;
    ingersoll_rand: number;
    denair: number;
    others: number;
  };
}

export interface OrderItem {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  quantity?: number;
  price?: number;
}

export interface TrackingStep {
  status: string;
  title: string;
  description: string;
  timestamp: string;
  location?: string;
}

export type OrderStatus = 'order_placed' | 'confirmed' | 'processing' | 'in_transit' | 'delivered' | 'cancelled';

export interface OrderRecord {
  id: string;
  user_id?: string | null;
  customer_name: string;
  company?: string;
  email: string;
  phone: string;
  delivery_address: string;
  fulfillment_hub: string;
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  tracking_history: TrackingStep[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStats {
  total: number;
  order_placed: number;
  confirmed: number;
  processing: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
}
