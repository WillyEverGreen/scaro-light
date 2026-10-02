const { getDefaultConfig } = require("expo/metro-config");
const { createProxyMiddleware } = require("http-proxy-middleware");

const config = getDefaultConfig(__dirname);

// Add proxy middleware for API calls in development
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Proxy /api/* requests to the backend server
      if (req.url.startsWith("/api")) {
        return createProxyMiddleware({
          target: "http://localhost:5000",
          changeOrigin: true,
        })(req, res, next);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
