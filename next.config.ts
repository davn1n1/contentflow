import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "emtgpbcpqkmsodxqejgs.supabase.co" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleapis.com" },
      { protocol: "https", hostname: "*.heygen.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "*.shotstack.io" },
    ],
  },
};

export default nextConfig;
