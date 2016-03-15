

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


%start graph

%% /* language grammar */


graph		:	STRICT  graph_type
			|	        graph_type
			;

graph_type	:	GRAPH   graph_ident
			|	DIGRAPH graph_ident
			;

graph_ident	:	id '{' stmt_list '}'
			|      '{' stmt_list '}'
			;

stmt_list	:	stmt
			| 	stmt ';'
			|   stmt ';' stmt_list
			;

stmt		:	node_stmt
			|	edge_stmt
			|	attr_stmt
			|	id '=' id
			|	subgraph
			;

attr_stmt	:	GRAPH attr_list
			| 	NODE  attr_list
			| 	EDGE  attr_list
			;

attr_list	:	'['        ']'
			|	'[' a_list ']'
			|	'['        ']' attr_list
			|	'[' a_list ']' attr_list
			;

a_list		:	id '=' id
			|   id '=' id ';'
			|   id '=' id ','
			|   id '=' id     a_list
			|   id '=' id ';' a_list
			|   id '=' id ',' a_list
			;

edge_stmt	:	node_id  edgeRHS
			|   subgraph edgeRHS
			|   node_id  edgeRHS attr_list
			|   subgraph edgeRHS attr_list
			;

edgeRHS		:	edgeop node_id
			|	edgeop subgraph
			|	edgeop node_id  edgeRHS
			|	edgeop subgraph edgeRHS
			;

edgeop		:	'--'
			|	'->'
			;

node_stmt	:	node_id
			| 	node_id attr_list
			;

node_id		:	id
			|	id port
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

id 			:	WORD
			|	NUMBER
			|	QUOTED_STRING
			;

