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

// Helper function to get JWT token from localStorage or cookie
const getToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  // Try localStorage first
  const token = localStorage.getItem("token");
  if (token) {
    return token;
  }

  // Fallback to cookie
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  return cookieToken || null;
};

// Helper function for API calls
// Automatically adds /api prefix, Content-Type for JSON requests, and JWT token
// Skips Content-Type for FormData (lets browser set multipart boundary)
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const fullUrl = getApiUrl(url);
  const isFormData = options.body instanceof FormData;
  const token = getToken();

  const config: RequestInit = {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  return fetch(fullUrl, config);
};
