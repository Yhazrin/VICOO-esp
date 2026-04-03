import { AxiosError } from 'axios';

export function getErrorMessage(error: unknown, defaultMessage = 'An unexpected error occurred'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    
    // Check for FastAPI detail
    if (data?.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
    
    // Check for custom message field
    if (data?.message) {
      return data.message;
    }

    // Fallback to Axios generic message
    return error.message || defaultMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage;
}
