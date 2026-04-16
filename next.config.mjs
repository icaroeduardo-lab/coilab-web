/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coilab-tasks-design.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "coilab-tasks-design.s3.amazonaws.com",
      },
    ],
  },
}

export default nextConfig
