/**
 * API Configuration for Spring Boot Backend
 * This file configures the Spring Boot API base URL and related settings
 */

// Determine the API URL based on environment
const API_CONFIG = {
  development: {
    baseURL: "http://localhost:8080",
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  },
  production: {
    baseURL: "https://lms-app-uat-792341416101.asia-south1.run.app",
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  },
};

const env = import.meta.env.MODE || "development";
const currentConfig = API_CONFIG[env] || API_CONFIG.development;

export const API_BASE_URL = currentConfig.baseURL;
export const API_TIMEOUT = currentConfig.timeout;
export const API_HEADERS = currentConfig.headers;


export default {
  API_BASE_URL,
  API_TIMEOUT,
  API_HEADERS,
};
