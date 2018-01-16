
const fs = require("fs");
const Marked = require("marked");
const paths_to_ignore = [
    /\/admin$/,
    /\/bpmn_wfs$/,
    /\/drivers$/,
    /\/inputs$/,
];
const files_to_ignore = [
    /myrullion_manual_sections\.md/,
];

function doFile(source_path) {
    var data = fs.readFileSync(source_path);
    process.stdout.write("\n<code>Document: " + source_path + "</code><br/>");
    process.stdout.write(Marked(data.toString("utf8"), { smartypants: true }));
    process.stdout.write("\n\n<hr/>\n\n");
}


function ignoreThisPath(source_path) {
    var out = false;
    paths_to_ignore.forEach(function (regex) {
        out = out || regex.exec(source_path);
    });
    return out;
}


function ignoreThisFile(file_name) {
    var out = false;
    files_to_ignore.forEach(function (regex) {
        out = out || regex.exec(file_name);
    });
    return out;
}


function doDirOrFile(source_path) {
    var stats;
    var files;
    function doFileInArray(file) {
        var index = files.indexOf(file);
        if (index > -1) {
            files.splice(index, 1);
            if (!ignoreThisFile(file)) {
                doFile(source_path + "/" + file);
            }
        }
    }
    if (ignoreThisPath(source_path)) {
        console.error("path ignored: " + source_path);
        return;
    }
    try {
        stats = fs.statSync(source_path);
        if (stats.isDirectory()) {
            process.stdout.write("\n\n<code>Folder:   " + source_path + "</code><br/>");
            files = fs.readdirSync(source_path);
            doFileInArray("README.md");
            files.forEach(function (file) {
                if (file.match(/\.md$/)) {
                    doFileInArray(file);
                }
            });
            files.forEach(function (file) {
                if (file.indexOf(".") !== 0) {
                    doDirOrFile(source_path + "/" + file);
                }
            });
        // } else if (source_path.match(/\.md$/)) {
        //     doFile(source_path);
        }
    } catch (err) {
        console.error(err);
    }
}

process.stdout.write("\n\n<style>body { font-family: Arial; }</style>\n\n");
doDirOrFile(process.argv[2]);
