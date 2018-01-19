

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
		var keys = obj2 && Object.keys(obj2),
			i;

		for (i = 0; obj2 && i < keys.length; i += 1) {
			obj1[keys[i]] = obj2[keys[i]];
		}
		return obj1;
	}
%}

%ebnf

%start graph

%% /* language grammar */


graph		:	STRICT? GRAPH? DIGRAPH? id? '{' stmt_list '}'
					{ $$ = {}; $$.strict = $1; $$.type = ($2 ? "graph" : ($3 ? "digraph" : null)); $$.id = $4; $$.statements = $6; return $$; }
			;

stmt_list	:	stmt 									{ $$ = [ $1 ]; }
			| 	stmt ';' 								{ $$ = [ $1 ]; }
			|   stmt ';' stmt_list						{ $$ = $3; $$.push($1); }
			;

stmt		:	node_stmt 								{ $$ = $1; $1.type = 'node'; }
			|	edge_stmt 								{ $$ = $1; $1.type = 'edge'; }
			|	attr_stmt 								{ $$ = $1; }
			|	id '=' id 								{ $$ = {}; $$[$1] = $3; }
/*			|	subgraph 								{ $$ = $1; $1.type = 'subgraph'; }							*/
			;

attr_stmt	:	GRAPH attr_list 						{ $2.type = 'graph_attrs'; $$ = $2; }
			| 	NODE  attr_list 						{ $2.type = 'node_attrs' ; $$ = $2; }
			| 	EDGE  attr_list 						{ $2.type = 'edge_attrs' ; $$ = $2; }
			;

attr_list	:	'[' attr_list2 ']'						{ $$ = $2; }
			|	'[' attr_list2 ']' attr_list			{ $$ = $2; mergeObjects($2, $4); }
			;

attr_list2	:	attr									{ $$ = {}; $$[$1[0]] = $1[1]; }
			|	attr attr_list2 						{ $$ = $2; $$[$1[0]] = $1[1]; }
			;

attr		:	id '=' id 								{ $$ = [ $1, $3 ]; }
			|   id '=' id ';'							{ $$ = [ $1, $3 ]; }
			|   id '=' id ','							{ $$ = [ $1, $3 ]; }
			;

edge_stmt	:	node_id  edgeRHS attr_list?				{ $$ = $2; $$.from_node     = $1; mergeObjects($2, $3); }
/*			|   subgraph edgeRHS attr_list?				{ $$ = $2; $$.from_subgraph = $1; mergeObjects($2, $3); }		*/
			;

edgeRHS		:	edgeop node_id							{ $$ = { op: $1, to_node: $2 }; }
/*			|	edgeop subgraph 						{ $$ = { op: $1, to_subgraph: $2 }; }	*/
			|	edgeop node_id  edgeRHS					{ $$ = $3; $$.op = $1; }
/*			|	edgeop subgraph edgeRHS					{ $$ = $3; $$.op = $1; }				*/
			;

edgeop		:	'--'									{ $$ = "undir"; }
			|	'->'									{ $$ =   "dir"; }
			;

node_stmt	:	node_id	attr_list?						{ $$ = $1; mergeObjects($1, $2); }
			;

node_id		:	id port?								{ $$ = ($2 || {}); $$.id = $1; }
			;

port		:	':' id 									{ $$ = { port_id: $2 }; }
			|	':' id ':' compass_pt					{ $$ = { port_id: $2, compass_pt: $4 }; }
			|	       ':' compass_pt					{ $$ = { 			  compass_pt: $2 }; }
			;

/*
subgraph	:	SUBGRAPH? id? '{' stmt_list '}'
			;
*/

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
			|	QUOTED_STRING 							{ $$ = yytext.substr(1, yytext.length - 2); }
			;

%%
