/* parser generated by jison 0.4.17 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var dot = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[8,18,48,49,50,52],$V1=[8,48,49,50,52],$V2=[8,48,49,50],$V3=[1,10],$V4=[1,11],$V5=[1,12],$V6=[8,10,12,17,22,24,26,31,32,36,48,49,50],$V7=[1,21],$V8=[1,22],$V9=[1,23],$Va=[10,12],$Vb=[10,12,22,31,32],$Vc=[2,54],$Vd=[1,29],$Ve=[1,34],$Vf=[1,35],$Vg=[1,36],$Vh=[1,44],$Vi=[1,45],$Vj=[1,46],$Vk=[1,47],$Vl=[1,48],$Vm=[1,49],$Vn=[1,50],$Vo=[1,51],$Vp=[1,52],$Vq=[1,53],$Vr=[48,49,50],$Vs=[10,12,22],$Vt=[24,48,49,50];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"graph":3,"graph_option0":4,"graph_option1":5,"graph_option2":6,"graph_option3":7,"{":8,"stmt_list":9,"}":10,"stmt":11,";":12,"node_stmt":13,"edge_stmt":14,"attr_stmt":15,"id":16,"=":17,"GRAPH":18,"attr_list":19,"NODE":20,"EDGE":21,"[":22,"attr_list2":23,"]":24,"attr":25,",":26,"node_id":27,"edgeRHS":28,"edge_stmt_option0":29,"edgeop":30,"--":31,"->":32,"node_stmt_option0":33,"node_id_option0":34,"port":35,":":36,"compass_pt":37,"N":38,"NE":39,"E":40,"SE":41,"S":42,"SW":43,"W":44,"NW":45,"C":46,"_":47,"WORD":48,"NUMBER":49,"QUOTED_STRING":50,"STRICT":51,"DIGRAPH":52,"$accept":0,"$end":1},
terminals_: {2:"error",8:"{",10:"}",12:";",17:"=",18:"GRAPH",20:"NODE",21:"EDGE",22:"[",24:"]",26:",",31:"--",32:"->",36:":",38:"N",39:"NE",40:"E",41:"SE",42:"S",43:"SW",44:"W",45:"NW",46:"C",47:"_",48:"WORD",49:"NUMBER",50:"QUOTED_STRING",51:"STRICT",52:"DIGRAPH"},
productions_: [0,[3,7],[9,1],[9,2],[9,3],[11,1],[11,1],[11,1],[11,3],[15,2],[15,2],[15,2],[19,3],[19,4],[23,1],[23,2],[25,3],[25,4],[25,4],[14,3],[28,2],[28,3],[30,1],[30,1],[13,2],[27,2],[35,2],[35,4],[35,2],[37,1],[37,1],[37,1],[37,1],[37,1],[37,1],[37,1],[37,1],[37,1],[37,1],[16,1],[16,1],[16,1],[4,0],[4,1],[5,0],[5,1],[6,0],[6,1],[7,0],[7,1],[29,0],[29,1],[33,0],[33,1],[34,0],[34,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 this.$ = {}; this.$.strict = $$[$0-6]; this.$.type = ($$[$0-5] ? "graph" : ($$[$0-4] ? "digraph" : null)); this.$.id = $$[$0-3]; this.$.statements = $$[$0-1]; return this.$; 
break;
case 2:
 this.$ = [ $$[$0] ]; 
break;
case 3:
 this.$ = [ $$[$0-1] ]; 
break;
case 4:
 this.$ = $$[$0]; this.$.push($$[$0-2]); 
break;
case 5:
 this.$ = $$[$0]; $$[$0].type = 'node'; 
break;
case 6:
 this.$ = $$[$0]; $$[$0].type = 'edge'; 
break;
case 7:
 this.$ = $$[$0]; 
break;
case 8:
 this.$ = {}; this.$[$$[$0-2]] = $$[$0]; 
break;
case 9:
 $$[$0].type = 'graph_attrs'; this.$ = $$[$0]; 
break;
case 10:
 $$[$0].type = 'node_attrs' ; this.$ = $$[$0]; 
break;
case 11:
 $$[$0].type = 'edge_attrs' ; this.$ = $$[$0]; 
break;
case 12:
 this.$ = $$[$0-1]; 
break;
case 13:
 this.$ = $$[$0-2]; mergeObjects($$[$0-2], $$[$0]); 
break;
case 14:
 this.$ = {}; this.$[$$[$0][0]] = $$[$0][1]; 
break;
case 15:
 this.$ = $$[$0]; this.$[$$[$0-1][0]] = $$[$0-1][1]; 
break;
case 16:
 this.$ = [ $$[$0-2], $$[$0] ]; 
break;
case 17: case 18:
 this.$ = [ $$[$0-3], $$[$0-1] ]; 
break;
case 19:
 this.$ = $$[$0-1]; this.$.from_node     = $$[$0-2]; mergeObjects($$[$0-1], $$[$0]); 
break;
case 20:
 this.$ = { op: $$[$0-1], to_node: $$[$0] }; 
break;
case 21:
 this.$ = $$[$0]; this.$.op = $$[$0-2]; 
break;
case 22:
 this.$ = "undir"; 
break;
case 23:
 this.$ =   "dir"; 
break;
case 24:
 this.$ = $$[$0-1]; mergeObjects($$[$0-1], $$[$0]); 
break;
case 25:
 this.$ = ($$[$0] || {}); this.$.id = $$[$0-1]; 
break;
case 26:
 this.$ = { port_id: $$[$0] }; 
break;
case 27:
 this.$ = { port_id: $$[$0-2], compass_pt: $$[$0] }; 
break;
case 28:
 this.$ = { 			  compass_pt: $$[$0] }; 
break;
case 39:
 this.$ = yytext; 
break;
case 40:
 this.$ = Number(yytext); 
break;
case 41:
 this.$ = yytext.substr(1, yytext.length - 2); 
break;
}
},
table: [o($V0,[2,42],{3:1,4:2,51:[1,3]}),{1:[3]},o($V1,[2,44],{5:4,18:[1,5]}),o($V0,[2,43]),o($V2,[2,46],{6:6,52:[1,7]}),o($V1,[2,45]),{7:8,8:[2,48],16:9,48:$V3,49:$V4,50:$V5},o($V2,[2,47]),{8:[1,13]},{8:[2,49]},o($V6,[2,39]),o($V6,[2,40]),o($V6,[2,41]),{9:14,11:15,13:16,14:17,15:18,16:19,18:$V7,20:$V8,21:$V9,27:20,48:$V3,49:$V4,50:$V5},{10:[1,24]},{10:[2,2],12:[1,25]},o($Va,[2,5]),o($Va,[2,6]),o($Va,[2,7]),o($Vb,$Vc,{34:27,35:28,17:[1,26],36:$Vd}),o($Va,[2,52],{33:30,28:31,19:32,30:33,22:$Ve,31:$Vf,32:$Vg}),{19:37,22:$Ve},{19:38,22:$Ve},{19:39,22:$Ve},{1:[2,1]},{9:40,10:[2,3],11:15,13:16,14:17,15:18,16:19,18:$V7,20:$V8,21:$V9,27:20,48:$V3,49:$V4,50:$V5},{16:41,48:$V3,49:$V4,50:$V5},o($Vb,[2,25]),o($Vb,[2,55]),{16:42,37:43,38:$Vh,39:$Vi,40:$Vj,41:$Vk,42:$Vl,43:$Vm,44:$Vn,45:$Vo,46:$Vp,47:$Vq,48:$V3,49:$V4,50:$V5},o($Va,[2,24]),o($Va,[2,50],{29:54,19:55,22:$Ve}),o($Va,[2,53]),{16:57,27:56,48:$V3,49:$V4,50:$V5},{16:60,23:58,25:59,48:$V3,49:$V4,50:$V5},o($Vr,[2,22]),o($Vr,[2,23]),o($Va,[2,9]),o($Va,[2,10]),o($Va,[2,11]),{10:[2,4]},o($Va,[2,8]),o($Vb,[2,26],{36:[1,61]}),o($Vb,[2,28]),o($Vb,[2,29]),o($Vb,[2,30]),o($Vb,[2,31]),o($Vb,[2,32]),o($Vb,[2,33]),o($Vb,[2,34]),o($Vb,[2,35]),o($Vb,[2,36]),o($Vb,[2,37]),o($Vb,[2,38]),o($Va,[2,19]),o($Va,[2,51]),o($Vs,[2,20],{30:33,28:62,31:$Vf,32:$Vg}),o($Vb,$Vc,{34:27,35:28,36:$Vd}),{24:[1,63]},{16:60,23:64,24:[2,14],25:59,48:$V3,49:$V4,50:$V5},{17:[1,65]},{37:66,38:$Vh,39:$Vi,40:$Vj,41:$Vk,42:$Vl,43:$Vm,44:$Vn,45:$Vo,46:$Vp,47:$Vq},o($Vs,[2,21]),o($Va,[2,12],{19:67,22:$Ve}),{24:[2,15]},{16:68,48:$V3,49:$V4,50:$V5},o($Vb,[2,27]),o($Va,[2,13]),o($Vt,[2,16],{12:[1,69],26:[1,70]}),o($Vt,[2,17]),o($Vt,[2,18])],
defaultActions: {9:[2,49],24:[2,1],40:[2,4],64:[2,15]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        function _parseError (msg, hash) {
            this.message = msg;
            this.hash = hash;
        }
        _parseError.prototype = Error;

        throw new _parseError(str, hash);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

	function mergeObjects(obj1, obj2) {
		var keys = obj2 && Object.keys(obj2),
			i;

		for (i = 0; obj2 && i < keys.length; i += 1) {
			obj1[keys[i]] = obj2[keys[i]];
		}
		return obj1;
	}

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 18;
break;
case 2:return 52;
break;
case 3:return 'SUBGRAPH';
break;
case 4:return 51;
break;
case 5:return 20;
break;
case 6:return 21;
break;
case 7:return 8;
break;
case 8:return 10;
break;
case 9:return 22;
break;
case 10:return 24;
break;
case 11:return 12;
break;
case 12:return 26;
break;
case 13:return 47;
break;
case 14:return 17;
break;
case 15:return 31;
break;
case 16:return 32;
break;
case 17:return 38;
break;
case 18:return 39;
break;
case 19:return 40;
break;
case 20:return 41;
break;
case 21:return 42;
break;
case 22:return 43;
break;
case 23:return 44;
break;
case 24:return 45;
break;
case 25:return 46;
break;
case 26:return 49;
break;
case 27:return 48;
break;
case 28:return 50;
break;
}
},
rules: [/^(?:\s+)/,/^(?:graph\b)/,/^(?:digraph\b)/,/^(?:subgraph\b)/,/^(?:strict\b)/,/^(?:node\b)/,/^(?:edge\b)/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:;)/,/^(?:,)/,/^(?:_\b)/,/^(?:=)/,/^(?:--)/,/^(?:->)/,/^(?:n\b)/,/^(?:ne\b)/,/^(?:e\b)/,/^(?:se\b)/,/^(?:s\b)/,/^(?:sw\b)/,/^(?:w\b)/,/^(?:nw\b)/,/^(?:c\b)/,/^(?:[-]?[0-9]+(\.[0-9]+)?\b)/,/^(?:[a-zA-Z\200-\377_][a-zA-Z\200-\377_\d]*)/,/^(?:".*?")/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = dot;
exports.Parser = dot.Parser;
exports.parse = function () { return dot.parse.apply(dot, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}