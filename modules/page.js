// page.js - module to generate pages
//
// Copyright (C) 2018-2023 Jean-Francois Moine
//
// This file is part of abc2svg.
//
// abc2svg is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with abc2svg.  If not, see <http://www.gnu.org/licenses/>.
//
// This module is loaded when "%%pageheight" appears in a ABC source.
//
// Parameters
//	%%pageheight <unit>

abc2svg.page = {

    // function called at end of generation
    abc_end: function(of) {
    var page = this.page
	if (page && page.in_page)
		abc2svg.page.close_page(page)
	if (abc2svg.page.user_out) {
		user.img_out = abc2svg.page.user_out
		abc2svg.page.user_out = null
	}
	of()
    }, // abc_end()

    // generate a header or a footer in page.hf and return its height
    gen_hf: function(page, ty) {
    var	a, i, j, k, x, y, y0, s, str,
	font = page.abc.get_font(ty.substr(0, 6)),
	cfmt = page.abc.cfmt(),
	fh = font.size * 1.1,
	pos = [ '">',
		'" text-anchor="middle">',
		'" text-anchor="end">' ]

	// replace <>& by XML character references
	function clean_txt(txt) {
		return txt.replace(/<|>|&.*?;|&/g, function(c) {
			switch (c) {
			case '<': return "&lt;"
			case '>': return "&gt;"
			case '&': return "&amp;"
			}
			return c
		})
	} // clean_txt()

	// clear a field if $x said so
	function clr(str) {
		return str.indexOf('\u00ff') >= 0 ? '' : str
	} //clr()

	// create the text of a header or a footer
	function header_footer(o_font, str) {
	    var	c, d, i, k, t, n_font, s,
		c_font = o_font,
		nl = 1,
		j = 0,
		r = ["", "", ""]

		if (str[0] == '"')
			str = str.slice(1, -1)
		while (1) {
			i = str.indexOf('$', j)
			if (i < 0)
				break
			c = str[++i]
			s = '$' + c		// string to replace
			switch (c) {
			case 'd':
				if (!abc2svg.get_mtime)
					break // cannot know the change time of the file
				d = abc2svg.get_mtime(abc.parse.fname)
				// fall thru
			case 'D':
				if (c == 'D')
					d = new Date()
				if (cfmt.dateformat[0] == '"')
					cfmt.dateformat = cfmt.dateformat.slice(1, -1)
				d = strftime(cfmt.dateformat, d)
				break
			case 'F':
				d = page.abc.parse.fname
				break
			case 'I':
				c = str[++i]
				s += c
				// fall thru
			case 'T':
				t = page.abc.info()[c]
				d = t ? t.split('\n', 1)[0] : ''
				break
			case 'P':			// current page number
			case 'Q':			// absolute page number
				t = c == 'P' ? page.pn : page.pna
				switch (str[i + 1]) {
				case '0':
					s += '0'
					d = (t & 1) ? '\u00ff' : t
					break
				case '1':
					s += '1'
					d = (t & 1) ? t : '\u00ff'
					break
				default:
					d = t
					break
				}
				break
			case 'V':
				d = "abc2svg-" + abc2svg.version
				break
			default:
				d = ''
				if (c == '0')
					n_font = o_font
				else if (c >= '1' && c < '9')
					n_font = page.abc.get_font("u" + c)
				else
					break

				// handle the font changes
				if (n_font == c_font)
					break
				if (c_font != o_font)
					d += "</tspan>"
				c_font = n_font
				if (c_font == o_font)
					break
				d += '<tspan class="' +
					font_class(n_font) + '">'
				break
			}
			str = str.replace(s, d)
			j = i
		}
		if (c_font != o_font)
			str += "</tspan>";

		str = str.split('\n')
		r[4] = str.length		// number of lines
		for (j = 0; j < str.length; j++) {
			if (j != 0)
				for (i = 0; i < 3; i++)
					r[i] += '\n'
			t = str[j].split('\t')
			if (t.length == 1) {
				r[1] += clr(t[0])
			} else {
				for (i = 0; i < 3; i++) {
					if (t[i])
						r[i] += clr(t[i])
				}
			}
		}
		return r
	} // header_footer()

	function font_class(font) {
		if (font.class)
			return 'f' + font.fid + cfmt.fullsvg + ' ' + font.class
		return 'f' + font.fid + cfmt.fullsvg
	}

	// gen_hf

	if (!(page.pn & 1))
		str = page[ty + '2'] || page[ty]
	else
		str = page[ty]

	if (str[0] == '-') {		// not on 1st page
		if (page.pn == 1)
			return 0
		str = str.slice(1)
	}

	a = header_footer(font, clean_txt(str))
	y0 = font.size * .8
	for (i = 0; i < 3; i++) {
		str = a[i]
		if (!str)
			continue
		if (i == 0)
			x = cfmt.leftmargin
		else if (i == 1)
			x = cfmt.pagewidth / 2
		else
			x = cfmt.pagewidth - cfmt.rightmargin
		y = y0
		k = 0
		while (1) {
			j = str.indexOf('\n', k)
			if (j >= 0)
				s = str.slice(k, j)
			else
				s = str.slice(k)
			if (s)
				page.hf += '<text class="' +
						font_class(font) +
						'" x="' + x.toFixed(1) +
						'" y="' + y.toFixed(1) +
						pos[i] +
						s + '</text>\n'
			if (j < 0)
				break
			k = j + 1
			y += fh
		}
	}
	return fh * a[4]
    }, // gen_hf()

    // start a new page
    open_page: function(page,
			ht) {	// spacing under the header
    var	h, l,
	abc = page.abc,
	cfmt = abc.cfmt(),
	sty = '<div style="line-height:0'

	page.pn++
	page.pna++

	// start a new page
	if (page.first)
		page.first = false
	else
		sty += ";page-break-before:always"
	if (page.gutter)
		sty += ";margin-left:" +
			((page.pn & 1) ? page.gutter : -page.gutter).toFixed(1) + "px"
	abc2svg.page.user_out(sty + '">')
	page.in_page = true

	ht += page.topmargin
	page.hmax = cfmt.pageheight - page.botmargin - ht

	// define the header/footer
	page.hf = ''
	if (page.header) {
		l = abc.get_font_style().length
		h = abc2svg.page.gen_hf(page, "header")
		if (!h && page.pn == 1 && page.header1)
			h = abc2svg.page.gen_hf(page, "header1")
		sty = abc.get_font_style().slice(l)		// new style(s)
		if (cfmt.fullsvg || sty != page.hsty) {
			page.hsty = sty
			sty = '<style>' + sty + '\n</style>\n'
		} else {
			sty = ''
		}
		abc2svg.page.user_out(
			'<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
	xmlns:xlink="http://www.w3.org/1999/xlink"\n\
	width="' + cfmt.pagewidth.toFixed(0) +
			'px" height="' + (ht + h).toFixed(0) +
			'px">\n' + sty +
			'<g transform="translate(0,' +
				page.topmargin.toFixed(1) + ')">' +
				page.hf + '</g>\n</svg>')
		page.hmax -= h;
		page.hf = ''
	} else {
		abc2svg.page.user_out(
			'<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
	xmlns:xlink="http://www.w3.org/1999/xlink"\n\
	width="' + cfmt.pagewidth.toFixed(0) +
			'px" height="' + ht.toFixed(0) +
			'px">\n</svg>')
	}
	if (page.footer) {
		l = abc.get_font_style().length
		page.fh = abc2svg.page.gen_hf(page, "footer")
		sty = abc.get_font_style().slice(l)		// new style(s)
		if (cfmt.fullsvg || sty != page.fsty) {
			page.fsty = sty
			page.ffsty = '<style>' + sty + '\n</style>\n'
		} else {
			page.ffsty = ''
		}
		page.hmax -= page.fh
	}

	page.h = 0
    }, // open_page()

    close_page: function(page) {
    var	h,
	cfmt = page.abc.cfmt()

	page.in_page = false
	if (page.footer) {
		h = page.hmax + page.fh - page.h
		abc2svg.page.user_out(
			'<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
	xmlns:xlink="http://www.w3.org/1999/xlink"\n\
	width="' + cfmt.pagewidth.toFixed(0) +
			'px" height="' + h.toFixed(0) +
			'px">\n' + page.ffsty +
			'<g transform="translate(0,' +
				(h - page.fh).toFixed(1) + ')">' +
			page.hf + '</g>\n</svg>')
	}
	abc2svg.page.user_out('</div>')
	page.h = 0
    }, // close_page()

    // handle the output flow of the abc2svg generator
    img_in: function(p) {
    var h, ht, nh,
	page = this.page

	// copy a block
	function blkcpy(page) {
		while (page.blk.length)
			abc2svg.page.user_out(page.blk.shift())
		page.blk = null			// direct output
	} // blkcpy()

	// img_in()
	switch (p.slice(0, 4)) {
	case "<div":				// block of new tune
		if (p.indexOf('newpage') > 0
		 || (page.oneperpage && this.info().X)
		 || !page.h) {			// empty page
			if (page.in_page)
				abc2svg.page.close_page(page)
			abc2svg.page.open_page(page, 0)
		}
		page.blk = []			// in block
		page.hb = page.h		// keep the offset of the start of tune
		break
	case "<svg":				// SVG image
		h = Number(p.match(/viewBox="0 0 \d+ (\d+)"/)[1])
		while (h + page.h >= page.hmax) { // if (still) page overflow
			ht = page.blk ? 0 :
				this.cfmt().topspace // tune continuation

			if (page.blk) {
				if (!page.hb) {	// overflow on the first page
					blkcpy(page)
					nh = 0
				} else {
					nh = page.h - page.hb
					page.h = page.hb
				}
			}
			abc2svg.page.close_page(page)
			abc2svg.page.open_page(page, ht)

			if (page.blk) {		// if inside a block
				blkcpy(page)	// output the beginning of the tune
				page.h = nh
			}
			if (h > page.hmax)
				break		// error
		}

		// if no overflow yet, keep the block
		if (page.blk)
			page.blk.push(p)
		else
			abc2svg.page.user_out(p)
		page.h += h
		break
	case "</di":				// end of block
		if (page.blk)
			blkcpy(page)
		break
//	default:
////fixme: %%beginml cannot be treated (no information about its height)
//		break
	}
    }, // img_in()

    // handle the page related parameters
    set_fmt: function(of, cmd, parm) {
    var	v,
	cfmt = this.cfmt(),
	page = this.page

	if (cmd == "pageheight") {
		v = this.get_unit(parm)
		if (isNaN(v)) {
			this.syntax(1, this.errs.bad_val, '%%' + cmd)
			return
		}
		if (!user.img_out || !abc2svg.abc_end)
			v = 0
		cfmt.pageheight = v
		if (!v)
			return

		// if first definition, install the hook
		if (!page || !abc2svg.page.user_out) {
			this.page = page = {
				abc: this,
				topmargin: 38,	// 1cm
				botmargin: 38,	// 1cm
//				gutter: 0,
				h: 0,		// current page height
				pn: 0,		// page number
				pna: 0,		// absolute page number
				first: true	// no skip to next page
			}

			// don't let the backend handle the header/footer
			if (cfmt.header) {
				page.header = cfmt.header;
				cfmt.header = null
			}
			if (cfmt.footer) {
				page.footer = cfmt.footer;
				cfmt.footer = null
			}
			if (cfmt.header1) {
				page.header1 = cfmt.header1
				cfmt.header1 = null
			}
			if (cfmt.header2) {
				page.header2 = cfmt.header2
				cfmt.header2 = null
			}
			if (cfmt.footer2) {
				page.footer2 = cfmt.footer2
				cfmt.footer2 = null
			}

			// get the previously defined page parameters
			if (cfmt.botmargin != undefined) {
				v = this.get_unit(cfmt.botmargin)
				if (!isNaN(v))
					page.botmargin = v
			}
			if (cfmt.topmargin != undefined) {
				v = this.get_unit(cfmt.topmargin)
				if (!isNaN(v))
					page.topmargin = v
			}
			if (cfmt.gutter != undefined) {
				v = this.get_unit(cfmt.gutter)
				if (!isNaN(v))
					page.gutter = v
			}
			if (cfmt.oneperpage)
				page.oneperpage = this.get_bool(cfmt.oneperpage)
			if (!cfmt.dateformat)
				cfmt.dateformat = "%b %e, %Y %H:%M"

			// set the hooks
			if (!abc2svg.page.user_out)
				abc2svg.page.user_out = user.img_out
			user.img_out = abc2svg.page.img_in.bind(this);
			abc2svg.abc_end = abc2svg.page.abc_end.bind(this,
								abc2svg.abc_end)
		}
		return
	}
	if (page) {
		switch (cmd) {
		case "header":
		case "footer":
		case "header1":
		case "header2":
		case "footer2":
			page[cmd] = parm
			return
		case "newpage":
			if (!parm)
				break
			v = Number(parm)
			if (isNaN(v)) {
				this.syntax(1, this.errs.bad_val, '%%' + cmd)
				return
			}
			page.pn = v - 1
			return
		case "gutter":
		case "botmargin":
		case "topmargin":
			v = this.get_unit(parm)
			if (isNaN(v)) {
				this.syntax(1, this.errs.bad_val, '%%' + cmd)
				return
			}
			page[cmd] = v
			return
		case "oneperpage":
			page[cmd] = this.get_bool(parm)
			return
		}
	}
	of(cmd, parm)
    }, // set_fmt()

    set_hooks: function(abc) {
	abc.set_format = abc2svg.page.set_fmt.bind(abc, abc.set_format)
	user.page_format = true			// do page formatting
	abc.set_pagef()
    }
} // page

abc2svg.modules.hooks.push(abc2svg.page.set_hooks);

// the module is loaded
abc2svg.modules.pageheight.loaded = true
