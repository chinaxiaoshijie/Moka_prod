export const getApiUrl = (path: string = "") => {
  // Always use /api prefix for proxy to nginx
  const apiPath = path.startsWith("/") ? path : `/${path}`;
  const fullPath = apiPath.startsWith("/api") ? apiPath : `/api${apiPath}`;
  
  if (typeof window !== "undefined") {
    // Browser environment - use relative path for proxy
    return fullPath;
  } else {
    // Server environment - use configured API URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    return `${baseUrl}${apiPath}`;
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
