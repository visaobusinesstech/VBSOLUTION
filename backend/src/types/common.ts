export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    cursor?: string;
  };
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface FileUploadResponse {
  fileId: string;
  url: string;
  mimeType: string;
  filename: string;
  size: number;
}
