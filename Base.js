/*jslint browser: true */
/*global x, console */

// like lazuli/base/base, but for browser, and includes logging

var x;
if (x) {
    throw new Error("global 'x' already defined");
}
x = {};

/**
* Top-level Archetype object, from which all others should be cloned
*/
x.Base = {
    id : "Base",
    log_level : 2,      // debug, initially
    log_levels : {
        trace :  0,
        into  :  1,
        debug :  2,
        info  :  4,
        warn  :  6,
        error :  8,
        fatal : 10
    },
    log_levels_text : [
        "TRACE", "INTO",
        "DEBUG", null,
        "INFO ", null,
        "WARN ", null,
        "ERROR", null,
        "FATAL", null
    ]
};

// sanity check method - ensures key doesn't already exist anywhere in prototype chain
x.Base.define = function (key, value) {
    if (this[key] !== undefined) {
        this.throwError("key already exists in prototype chain: " + key);
    }
    this[key] = value;
    return value;
};

// sanity check method - ensures key doesn't already exist in this object
x.Base.override = function (key, value) {
    if (this.hasOwnProperty(key)) {
        this.throwError("key already exists in object: " + key);
    }
    if (this[key] === undefined) {
        this.throwError("key does not exist in prototype chain: " + key);
    }
    this[key] = value;
    return value;
};

// sanity check method - reassign key if it already exist in this object
x.Base.reassign = function (key, value) {
    if (!this.hasOwnProperty(key)) {
        this.throwError("key does not exist in object: " + key);
    }
    this[key] = value;
    return value;
};


/**
* Create a new object inherited from this one
* @param spec: object map of properties to be set in the new object
* @return Newly cloned object
*/
x.Base.define("clone", function (spec) {
    var obj;
    if (typeof spec !== "object") {
        this.throwError("clone requires spec object");
    }
    if (typeof spec.id !== "string" || spec.id === "") {
        this.throwError("clone requires id");
    }
    if (this.instance) {
        this.throwError("cannot clone instance");
    }
    obj = Object.create(this);
    obj.parent = this;
    if (typeof obj.addProperties !== "function") {
        this.throwError("suspect new keyword used");
    }
    if (spec) {
        obj.addProperties(spec);
    }
    // if (obj.init && typeof obj.init === "function") {
    //     obj.init();
    // }
    return obj;
});



/**
* Remove this object from its owning OrderedMap (if there is one), as identified by the 'owner' property
*/
x.Base.define("remove", function () {
    if (!this.owner || typeof this.owner.remove !== "function") {
        this.throwError("no owner with a remove() function");
    }
    this.owner.remove(this.id);
});


/**
* Output a string representation of the object, including all its ancesters, delimited by '/'s
* @return String representation of the object
*/
x.Base.override("toString", function () {
    var out = "",
        level = this;

    while (level) {
        out = "/" + level.id + out;
        level = level.parent;
    }
    return out;
});


/**
* Add the given properties to this object
* @param spec: object map of properties to add
*/
x.Base.define("addProperties", function (spec) {
    var n;
    for (n in spec) {
        if (spec.hasOwnProperty(n)) {
            this[n] = spec[n];
        }
    }
});


/**
* Return string argument with tokens (delimited by braces) replaced by property values
* @param str: string argument, possibly including tokens surrounded by braces
* @return String argument, with tokens replaced by property values
*/
x.Base.define("detokenize", function (str, replaceToken) {
    var regex = /\{[a-zA-Z0-9_\.\/\| ]+?\}/g,         // replace(regex, callback) doesn't seem to support capturing groups
        that = this;

    if (typeof str !== "string") {
        this.throwError("invalid argument");
    }
    if (typeof replaceToken !== "function") {
        replaceToken = this.replaceToken;
    }
    return str.replace(regex, function (token) {
        return replaceToken.call(that, token);
    });
});



x.Base.define("replaceToken", function (token) {
    token = token.substr(1, token.length - 2);
    return (typeof this[token] === "string" ? this[token] : "{unknown: " + token + "}");
});


/**
* Return a string representation of this object's properties, by calling toString() on each
* @return String representation of this object's properties
*/
x.Base.define("view", function (format) {
    var str = (format === "block" ? "" : "{"),
        n,
        delim = "";

    for (n in this) {
        if (this.hasOwnProperty(n) && typeof this[n] !== "function") {
            str += delim + n + "=" + this[n];
            delim = (format === "block" ? "\n" : ", ");
        }
    }

    return str + (format === "block" ? "" : "}");
});


// overcome issues with strack traces
x.Base.define("throwError", function (str_or_spec) {
    throw new Error(str_or_spec);
});


// should be static
/**
* Return an object from the global memory structure using a fully-qualified string
* @param Fully-qualified string, beginning with 'x.'
* @return Object referenced by the string, throwing an x.Exception if not found
*/
x.Base.define("getObject", function (str) {
    var parts,
        obj,
        i;

    if (typeof str !== "string") {
        this.throwError("invalid argument");
    }
    parts = str.split(".");
    if (parts[0] !== "x") {
        this.throwError("invalid ref string");
    }
    obj = this;
    for (i = 1; i < parts.length; i += 1) {
        if (!obj[parts[i]]) {
            this.throwError("invalid ref string");
        }
        obj = obj[parts[i]];
    }
    return obj;
});


/**
* To check if an Object is a descendant of another, through its parent property
* @param Object
* @return Boolean true if descendant false otherwise
*/
x.Base.define("isDescendantOf", function (obj) {
    return !!this.parent && (this.parent === obj || this.parent.isDescendantOf(obj));
});



// moving from arguments (str) to (this, str)...
x.Base.define("trace", function (str) {
    this.outputLogMessage(str, this.log_levels.trace);
});


x.Base.define("debug", function (str) {
    this.outputLogMessage(str, this.log_levels.debug);
});


x.Base.define("info", function (str) {
    this.outputLogMessage(str, this.log_levels.info );
});


x.Base.define("warn", function (str) {
    this.outputLogMessage(str, this.log_levels.warn );
});


x.Base.define("error", function (str) {
    this.outputLogMessage(str, this.log_levels.error);
});


x.Base.define("fatal", function (str) {
    this.outputLogMessage(str, this.log_levels.fatal);
});


x.Base.define("reportError", function (e, log_level) {
    log_level = log_level || this.log_levels.error;
    this.outputLogMessage(e.toString() + (e.hasOwnProperty ? ", " + this.view.call(e) : " [Java Object]"), null, log_level);
});


x.Base.define("outputLogMessage", function (str, log_level) {
    if (log_level >= this.log_level) {
        console.log(this.log_levels_text[log_level] + ": " + this.toString() + " " + str.replace(/'/g, ""));
    }
});

