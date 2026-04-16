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
      {
        protocol: "https",
        hostname: "*.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "figma-alpha-api.s3.us-west-2.amazonaws.com",
      },
    ],
  },
}

export default nextConfig
