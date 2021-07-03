
const Common = require("./webpack.common.js");
const Merge = require("webpack-merge");
const Webpack = require("webpack");

const mode = "development";

module.exports = Merge(Common, {
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./public"
  },
  mode: mode,
  plugins: [
    new Webpack.DefinePlugin({
      WebpackMode: JSON.stringify(mode),
    }),
  ],
});
