
const Common = require("./webpack.common.js");
const Merge = require("webpack-merge");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const Webpack = require("webpack");

const mode = "production";

module.exports = Merge(Common, {
  devtool: "source-map",
  mode: mode,
  plugins: [
    new UglifyJSPlugin({
      sourceMap: true
    }),
    new Webpack.DefinePlugin({
      WebpackMode: JSON.stringify(mode),
    }),
  ],
});
