

/* description: Parses GraphViz diagrams */

/* lexical grammar */
%lex

%%

\s+                   /* skip whitespace */
"graph"										return 'GRAPH';
"digraph"									return 'DIGRAPH';
"subgraph"									return 'SUBGRAPH';
"strict"									return 'STRICT';
"node"										return 'NODE';
"edge"										return 'EDGE';
"{"											return '{';
"}"											return '}';
"["											return '[';
"]"											return ']';
";"											return ';';
","											return ',';
"_"											return '_';
"="											return '=';
"--"										return '--';
"->"										return '->';
"n"											return 'N';
"ne"										return 'NE';
"e"											return 'E';
"se"										return 'SE';
"s"											return 'S';
"sw"										return 'SW';
"w"											return 'W';
"nw"										return 'NW';
"c"											return 'C';
[-]?[0-9]+("."[0-9]+)?\b 					return 'NUMBER';
[a-zA-Z\200-\377_][a-zA-Z\200-\377_\d]*		return 'WORD';
\".*?\" 									return 'QUOTED_STRING';
/lex


%{
	function mergeObjects(obj1, obj2) {
		var keys = Objects.keys(obj2),
			i;

		for (i = 0; i < keys.length; i += 1) {
			obj1[keys[i]] = obj2[keys[2]];
		}
		return obj1;
	}
%}

%ebnf

%start graph

%% /* language grammar */


graph		:	STRICT? GRAPH? DIGRAPH? id? '{' stmt_list '}'
					{ $$ = {}; $$.strict = $1; $$.type = ($2 ? "graph" : ($3 ? "digraph" : null)); $$.id = $4; console.log($$); return $$; }
			;

graph_type	:	GRAPH   graph_ident						{ $$ = $2; $$.type =   "graph"; }
			|	DIGRAPH graph_ident						{ $$ = $2; $$.type = "digraph"; }
			;

graph_ident	:	id '{' stmt_list '}'					{ $$ = { id: $1, stmts: $3 }; }
			|      '{' stmt_list '}'					{ $$ = {         stmts: $3 }; }
			;

stmt_list	:	stmt 									{ $$ = [ $1 ]; }
			| 	stmt ';' 								{ $$ = [ $1 ]; }
			|   stmt ';' stmt_list						{ $$ = $3; $$.push($1); console.log("next statement"); }
			;

stmt		:	node_stmt 								{ $$ = $1; }
			|	edge_stmt 								{ $$ = $1; }
			|	attr_stmt 								{ $$ = $1; }
			|	id '=' id 								{ $$ = {}; $$[$1] = $3; }
			|	subgraph 								{ $$ = $1; }
			;

attr_stmt	:	GRAPH attr_list 						{ $2.type = 'graph'; $$ = $2; }
			| 	NODE  attr_list 						{ $2.type = 'node' ; $$ = $2; }
			| 	EDGE  attr_list 						{ $2.type = 'edge' ; $$ = $2; }
			;

attr_list	:	'['        ']'							{ $$ = {}; }
			|	'[' a_list ']'							{ $$ = $2; }
			|	'['        ']' attr_list				{ $$ = $3; }
			|	'[' a_list ']' attr_list				{ $$ = $4; }
			;

a_list		:	id '=' id 								{ $$ = {}; $$[$1] = $3; }
			|   id '=' id ';'							{ $$ = {}; $$[$1] = $3; }
			|   id '=' id ','							{ $$ = {}; $$[$1] = $3; }
			|   id '=' id     a_list					{ $$ = $4; $$[$1] = $3; }
			|   id '=' id ';' a_list					{ $$ = $5; $$[$1] = $3; }
			|   id '=' id ',' a_list					{ $$ = $5; $$[$1] = $3; }
			;

edge_stmt	:	node_id  edgeRHS 						{ $$ = $2; $$.from_node = $1; }
			|   subgraph edgeRHS 						{ $$ = $2; $$.from_subgraph = $1; }
			|   node_id  edgeRHS attr_list 				{ $$ = $2; $$.from_node = $1; }
			|   subgraph edgeRHS attr_list 				{ $$ = $2; $$.from_subgraph = $1; }
			;

edgeRHS		:	edgeop node_id							{ $$ = { op: $1, to_node: $2 }; }
			|	edgeop subgraph 						{ $$ = { op: $1, to_subgraph: $2 }; }
			|	edgeop node_id  edgeRHS 				{ $$ = $3; $$.op = $1; }
			|	edgeop subgraph edgeRHS					{ $$ = $3; $$.op = $1; }
			;

edgeop		:	'--'									{ $$ = "undir"; }
			|	'->'									{ $$ = "dir"; }
			;

node_stmt	:	node_id									{ $$ = { id: $1 }; }
			| 	node_id attr_list						{ $$ = $2; $$.id = $1; }
			;

node_id		:	id 										{ $$ = $1; }
			|	id port									{ $$ = $1; }
			;

port		:	':' id
			|	':' id ':' compass_pt
			|	       ':' compass_pt
			;

subgraph	:	SUBGRAPH id '{' stmt_list '}'
			|	SUBGRAPH    '{' stmt_list '}'
			|	            '{' stmt_list '}'
			;

compass_pt	:	N
			| 	NE
			| 	E
			|	SE
			|	S
			|	SW
			|	W
			|	NW
			|	C
			|	'_'
			;

id 			:	WORD									{ $$ = yytext; }
			|	NUMBER 									{ $$ = Number(yytext); }
			|	QUOTED_STRING 							{ $$ = yytext; }
			;

