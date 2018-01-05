const Servest = require("serve-static");
const webdriver = require("selenium-webdriver");
// const chrome = require("selenium-webdriver/chrome");
// const Browser = require("zombie");

// We're going to make requests to http://example.com/signup
// Which will be routed to our test server localhost:3000

const x = {};


function setup() {
    // Create a node-static server instance to serve this folder
    var Server = Servest("..", {});
    x.server = require("http").createServer(function (req, res) {
        Server(req, res, function () {
            console.log("error serving url: " + req.url);
        });
    });
    x.server.listen(8080);

    x.driver = new webdriver.Builder()
        .forBrowser("chrome")
        .build();
    // Browser.localhost("doc_reader.com", 8080);
};



function testOne() {
    var out = reader.processFragment();
    test.assert(typeof out === "object" && Object.keys(out).length === 0, "empty object");
    out = reader.processFragment("");
    test.assert(typeof out === "object" && Object.keys(out).length === 0, "empty object");
    out = reader.processFragment("blah");
    test.assert(typeof out === "object" && Object.keys(out).length === 1 && out.path === "blah", "single term, no equals, interpreted as a path");
    out = reader.processFragment("blah&deblah&sowhat");
    test.assert(typeof out === "object" && Object.keys(out).length === 1 && out.path === "blah", "multiple terms, no equals, first one used as a path");
};

function testTwo() {
    x.driver.get("http://localhost:8080/doc_reader/index.html");
    // const browser = new Browser();
    // browser.visit("/doc_reader/index.html", function () {
    //     console.log("got index.html");
    //     browser.assert.success();
    // });
};


function teardown() {
    x.server.close();
};


function main() {
    setup();
    testTwo();
    // teardown();
}

main();


/*
describe('User visits signup page', function() {

    const browser = new Browser();

    before(function(done) {
        browser.visit('/signup', done);
    });

    describe('submits form', function() {
        before(function(done) {
            browser
                .fill('email',    'zombie@underworld.dead')
                .fill('password', 'eat-the-living')
                .pressButton('Sign Me Up!', done);
        });

        it('should be successful', function() {
            browser.assert.success();
        });

        it('should see welcome page', function() {
            browser.assert.text('title', 'Welcome To Brains Depot');
        });
    });
});
*/
