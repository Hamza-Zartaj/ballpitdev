export default {
  reactStrictMode: true,

  // Enable gzip compression for responses
  compress: true,

  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,

  // Skip page data collection for API routes with dynamic segments
  onDemandEntries: {
    // Pre-renders all pages but allows ISR
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // Tree-shake heavy packages — eliminates unused exports at build time
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      // Temporarily disabled Firebase optimization due to build issues
      // "@firebase/firestore",
      // "@firebase/auth",
      // "@firebase/storage",
      // "@firebase/database",
      // "firebase",
    ],
  },

  env: {
    APP_URL: process.env.APP_URL,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
    // Stripe Payment Links (client-side redirect targets)
    Stripe_monthly: process.env.Stripe_monthly,
    Stripe_yearly: process.env.Stripe_yearly,
    Stripe_portal: process.env.Stripe_portal,
  },
  images: {
    // Modern remotePatterns (replaces deprecated `domains`)
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    // Serve modern formats (WebP/AVIF) automatically
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 30 days
    minimumCacheTTL: 2592000,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Allow all origins for API requests
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};
