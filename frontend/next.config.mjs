/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // <--- ADICIONA ESTA LINHA
  reactCompiler: true,
};

export default nextConfig;