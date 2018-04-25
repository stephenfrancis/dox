
const Merge = require("webpack-merge");
const Common = require("./webpack.common.js");

module.exports = Merge(Common, {
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./public"
  }
});
