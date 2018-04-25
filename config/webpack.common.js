
const Path = require("path");
const Webpack = require("webpack");
const Pkg = require("../package.json");

module.exports = {
  entry: "./src/App.tsx",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
    ],
  },
  output: {
    filename: "app.min.js",
    path: Path.resolve(__dirname, "../public")
  },
  plugins : [
    new Webpack.DefinePlugin({
      AppVersion: JSON.stringify(Pkg.version),
      WebpackMode: JSON.stringify(process.env.NODE_ENV),
    }),
  ],
  resolve: {
    extensions: [ ".tsx", ".ts", ".js", ".json" ]
  },
};
