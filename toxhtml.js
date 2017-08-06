// abc2svg - toxhtml.js - SVG generation
//
// Copyright (C) 2014-2017 Jean-Francois Moine
//
// This file is part of abc2svg.
//
// abc2svg is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with abc2svg.  If not, see <http://www.gnu.org/licenses/>.

// replace <>& by XML character references
function clean_txt(txt) {
	return txt.replace(/<|>|&.*?;|&/g, function(c) {
		switch (c) {
		case '<': return "&lt;"
		case '>': return "&gt;"
		}
		if (c == '&')
			return "&amp;"
		return c
	})
}

function abort(e) {
	abc.blk_out();
	abc.blk_flush();
	if (errtxt)
		print("<pre>" + clean_txt(errtxt) + "</pre>");
	print("<pre>" + e.message + "\n*** Abort ***\n" + e.stack + "</pre>");
	print("</body> </html>");
	quit()
}

// entry point from cmdline
function abc_init() {
	function get_date() {
		var now = new Date()

		return now.toUTCString()
	} // get_date()

	user.page_format = true;
	user.img_out = function(str) { print(str) };

	print('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"\n\
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1.dtd">\n\
<html xmlns="http://www.w3.org/1999/xhtml">\n\
<head>\n\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>\n\
<meta name="generator" content="abc2svg-' + abc2svg.version + '"/>\n\
<!-- CreationDate: ' + get_date() + '-->');
//fixme: pb with '--' and ','
//		"<!-- CommandLine: " + args.toString() + " -->")
	print('<style type="text/css">\n\
	body {margin:0; padding:0; border:0}\n\
	@page {margin-top: 1cm}\n\
	text, tspan {white-space:pre}\n\
	svg {display:block}\n\
	@media print {\n\
		div.newpage {page-break-before: always}\n\
		div.nobrk {page-break-inside: avoid}\n\
	}\n\
</style>\n\
<title>abc2svg document</title>\n\
</head>\n\
<body>')
}

function abc_end() {
	if (errtxt)
		print("<pre>" + errtxt + "</pre>")
	print("</body>\n</html>")
}

// nodejs
if (typeof module == 'object') {
	exports.abort = abort;
	exports.abc_init = abc_init;
	exports.abc_end = abc_end;
}
