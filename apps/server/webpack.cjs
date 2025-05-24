const path = require("path");
const nodeExternals = require("webpack-node-externals");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: "production",
  entry: "./dist/main.js", // Sử dụng main.js làm entry point duy nhất
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "main.js", // Output bundle file
  },
  snapshot: {
    managedPaths: [], // Hoặc loại bỏ các đường dẫn gây ra cảnh báo khỏi danh sách
    immutablePaths: [/node_modules\/@node-shared/],
  },
  stats: {
    warningsFilter: [/node_modules\/@node-shared/], // Bỏ qua cảnh báo liên quan đến @node-shared
  },
  externals: [nodeExternals()], // Exclude node_modules từ bundle
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      }
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            booleans: true,
            collapse_vars: true,
            comparisons: true,
            conditionals: true,
            drop_console: false, // Loại bỏ các câu lệnh console
            drop_debugger: true, // Loại bỏ các câu lệnh debugger
            evaluate: true,
            hoist_funs: true,
            if_return: true,
            inline: true,
            loops: true,
            passes: 2, // Chạy trình tối ưu hóa 2 lần
            reduce_vars: true,
            sequences: true,
            toplevel: true,
            typeofs: true,
            unused: true
          },
          mangle: true, // Mangle names
          output: {
            comments: false // Remove comments
          }
        },
      }),
    ],
  },
  resolve: {
    extensions: [".js", ".json"],
    alias: {
      '@': path.resolve(__dirname, 'src') // Cập nhật đường dẫn phù hợp với dự án của bạn
    }
  },
  target: "node", // Đảm bảo rằng Webpack biết đây là môi trường Node.js
};
