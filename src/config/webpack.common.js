
const Path = require("path");
const Pkg = require("../package.json");
const Webpack = require("webpack");

module.exports = {
  entry: "./src/App.tsx",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            // options: {
            //   configFile: "config/tsconfig.webpack.json",
            // },
          },
        ],
      },
    ],
  },
  output: {
    filename: "app.min.js",
    path: Path.resolve(__dirname, "../public")
  },
  plugins: [
    new Webpack.DefinePlugin({
      AppVersion: JSON.stringify(Pkg.version),
    }),
  ],
  resolve: {
    extensions: [ ".tsx", ".ts", ".js", ".json" ]
  },
};
