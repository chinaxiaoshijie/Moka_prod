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
// Automatically adds /api prefix and Content-Type for JSON requests
// Skips Content-Type for FormData (lets browser set multipart boundary)
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const fullUrl = getApiUrl(url);
  const isFormData = options.body instanceof FormData;

  const config: RequestInit = {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  };

  return fetch(fullUrl, config);
};
