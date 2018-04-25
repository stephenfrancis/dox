
const Merge = require("webpack-merge");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const Common = require("./webpack.common.js");

module.exports = Merge(Common, {
  devtool: "source-map",
  plugins: [
    new UglifyJSPlugin({
      sourceMap: true
    }),
  ],
});
