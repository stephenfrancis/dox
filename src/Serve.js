const Koa = require("koa");
const send = require("koa-send");

const app = new Koa();

const index = process.cwd().lastIndexOf("/");
const localDirName = process.cwd().substring(index + 1);
const isLocal = localDirName === "dox";
const appFilesRoot = isLocal ? "/" : "/node_modules/dox/";

console.log(
  `cwd: ${process.cwd()}, isLocal? ${isLocal}, appFilesRoot: ${appFilesRoot}`
);

const koaSendOpts = {
  maxAge: 365 * 24 * 60 * 60 * 1000,
  root: process.cwd(),
};

app.use(async (ctx, next) => {
  const pathElems = ctx.path.split("/");
  const tweakedPath = pathElems.filter((elem) => !!elem).join("/");
  const filename = pathElems.pop();
  const lastDir = pathElems.pop();
  const wantingHTML = ctx.headers["accept"].indexOf("text/html") > -1;
  // console.log(
  //   `filename: ${filename}, lastDir: ${lastDir}, wantingHTML: ${wantingHTML}`
  // );
  if (wantingHTML) {
    // SPA: serve the main HTML file at ALL navigation URLs if looking for HTML
    await send(ctx, `${appFilesRoot}src/public/index.html`, koaSendOpts);
  } else if (lastDir === "dox-built") {
    // built app files
    await send(ctx, `${appFilesRoot}dist/${filename}`, koaSendOpts);
  } else if (lastDir === "dox-static" || filename.indexOf("favicon") > -1) {
    // static app files
    await send(ctx, `${appFilesRoot}src/public/${filename}`, koaSendOpts);
  } else {
    // content files
    await send(ctx, tweakedPath, koaSendOpts);
  }
});

const port = process.env.PORT || 10001;
const server = app.listen(port);
console.log(
  `serving ${isLocal ? "locally" : "dox"} - listening on port ${port}`
);
