
var reader = require("./index.js");


module.exports.test_processFragment = function (test) {
    var out = reader.processFragment();
    test.assert(typeof out === "object" && Object.keys(out).length === 0, "empty object");
    out = reader.processFragment("");
    test.assert(typeof out === "object" && Object.keys(out).length === 0, "empty object");
    out = reader.processFragment("blah");
    test.assert(typeof out === "object" && Object.keys(out).length === 1 && out.path === "blah", "single term, no equals, interpreted as a path");
    out = reader.processFragment("blah&deblah&sowhat");
    test.assert(typeof out === "object" && Object.keys(out).length === 1 && out.path === "blah", "multiple terms, no equals, first one used as a path");
};


var test = {
    i: 0,
    assert: function (bool, str) {
        this.i += 1;
        str = ("    ").substr(Math.log(this.i)) + this.i + " " + (str || "--");
        if (bool) {
            str = "  OK    " + str;
        } else {
            str = "*FAIL** " + str;
        }
        console.log(str);
    }
}

module.exports.test_processFragment(test);
