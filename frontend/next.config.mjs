/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { webpack }) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }
    config.externals.push("pino-pretty", "lokijs", "encoding")

    // Ignore React Native async storage (not needed in web)
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
      })
    )

    return config
  },
  // Suppress hydration warnings from wallet connectors
  reactStrictMode: true,
}

export default nextConfig
