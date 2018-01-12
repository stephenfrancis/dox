
const fs = require("fs");
const url = require("url");
const http = require("http");
const https = require("https");
var serveStatic = require("serve-static");
var finalhandler = require("finalhandler");
var serve = serveStatic(process.cwd() + "/..", {});
var ports = [8080, 8443];

if (process.argv.length > 2 && process.argv[2] === "asroot") {
    ports = [80, 443];
}

/*
// redirect http traffic to https
http.createServer(function(req, res) {
    var new_url = "https://" + req.headers.host.split(":")[0];
    if (ports[1] !== 443) {
        new_url += ":" + ports[1];
    }
    new_url += (req.url || "/");
    console.log("redirecting to: " + new_url);
    res.writeHead(302, {
        "Location": new_url,
  //add other headers here...
    });
    res.end();
}).listen(ports[0]);
*/

http.createServer(function(req, res) {
    serve(req, res, finalhandler(req, res));
}).listen(ports[0]);


https.createServer({
    key: fs.readFileSync("./crypto/key.pem"),
    cert: fs.readFileSync("./crypto/cert.crt")
}, function (req, res) {
    serve(req, res, finalhandler(req, res));
}).listen(ports[1]);

console.log("Running on ports " + JSON.stringify(ports));

/*
    Keypair and Certificate Generation and Installation

    > openssl req -newkey rsa:2048 -nodes -keyout ./crypto/key.pem -x509 \
        -days 365 -out ./crypto/cert.crt

[answer questions as required, putting 'localhost' as the Common Name]

    > sudo cp ./crypto/cert.crt /usr/local/share/ca-certificates

    > sudo update-ca-certificates

*/
