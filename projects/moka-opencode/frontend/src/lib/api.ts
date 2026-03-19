export const getApiUrl = (path: string = "") => {
  if (typeof window !== "undefined") {
    // Browser environment
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:13001";
    return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  } else {
    // Server environment
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:13001";
    return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  }
};

// Helper function for API calls
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const fullUrl = getApiUrl(url);
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  return fetch(fullUrl, config);
};
