// page.js - module to generate one SVG image per page
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%pageheight" appears in a ABC source.
//
// Parameters
//	%%pageheight <unit>

abc2svg.page = {

    // output a new block
    img_out: function(p) {
    var	page = this.page;

	page.user_out(p)
	
	// user.img_out may have been changed
	if (user.img_out != page.img_out_sav) {
		page.user_out = user.img_out;
		user.img_out = abc2svg.page.img_in.bind(this);
		page.img_out_sav = user.img_out	// keep our reference
	}
    },

    //function called at end of generation
    abc_end: function(of) {
    var page = this.page
	if (page.h) {
		abc2svg.page.img_out.call(this,
			page.head + page.style + page.hf + page.out + '</svg>');
		abc2svg.page.img_out.call(this, '</div>');
		page.h = 0;
		page.out = ''
	}
	of()
    }, // abc_end()

    // define the SVG header of the page
    svg_head: function(cfmt) {
	return '<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
 xmlns:xlink="http://www.w3.org/1999/xlink"\n\
 color="black" class="music" stroke-width=".7"\n\
 width="' + cfmt.pagewidth.toFixed(0) +
 'px" height="' + cfmt.pageheight.toFixed(0) + 'px"' +
 (cfmt.bgcolor ? (' style="background-color: ' + cfmt.bgcolor + '"') : '') +
 '>\n'
    }, // svg_head()

    // start a new page
    svg_out: function(abc, page) {
    var	h,
	cfmt = abc.cfmt()

	function header_footer(str) {
	    var	c, i, t,
		nl = 1,
		j = 0,
		r = ["", "", ""]

		if (str[0] == '"')
			str = str.slice(1, -1)
		if (str.indexOf('\t') < 0)		// if no TAB
			str = '\t' + str		// center

		for (i = 0; i < str.length; i++) {
			c = str[i]
			switch (c) {
			case '\t':
				if (j < 2)
					j++		// next column
				continue
			case '\\':			// hope '\n'
				for (j = 0; j < 3; j++)
					r[j] += '\n';
				nl++;
				j = 0;
				i++
				continue
			default:
				r[j] += c
				continue
			case '$':
				break
			}
			c = str[++i]
			switch (c) {
			case 'd':	// cannot know the modification date of the file
				break
			case 'D':
				r[j] += new Date().toUTCString()
				break
			case 'F':
				r[j] += abc.get_fname()
				break
			case 'I':
				c = str[++i]
			case 'T':
				t = abc.info()[c]
				if (t)
					r[j] += t.split('\n', 1)[0]
				break
			case 'P':
			case 'Q':
				t = c == 'P' ? page.pn : page.pna
				switch (str[i + 1]) {
				case '0':
					i++
					if (!(t & 1))
						r[j] += t
					break
				case '1':
					i++
					if (t & 1)
						r[j] += t
					break
				default:
					r[j] += t
					break
				}
				break
			case 'V':
				r[j] += "abc2svg-" + abc2svg.version
				break
//fixme: handle the font changes ($<number>) ?
			}
		}
		r[4] = nl		// number of lines
		return r
	} // header_footer()

	function font_class(font) {
		if (font.class)
			return 'f' + font.fid + cfmt.fullsvg + ' ' + font.class
		return 'f' + font.fid + cfmt.fullsvg
	}

	// generate a header or footer
	function gen_hf(up, font, str) {
	    var	a, i, j, k, x, y, y0, s,
		fh = font.size * 1.1,
		pos = [ '">',
			'" text-anchor="middle">',
			'" text-anchor="end">' ]

		if (str[0] == '-') {		// not on 1st page
			if (page.pn == 1)
				return 0
			str = str.slice(1)
		}

		a = header_footer(str)
		if (up)
			y0 = page.hbase + fh
		else
			y0 = cfmt.pageheight - page.topmargin - fh * a[4]
		for (i = 0; i < 3; i++) {
			str = a[i]
			if (!str)
				continue
			if (i == 0)
				x = cfmt.leftmargin
			else if (i == 1)
				x = cfmt.pagewidth / 2
			else
				x = cfmt.pagewidth - cfmt.rightmargin;
			y = y0;
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
							'" x="' + x.toFixed(2) +
							'" y="' + y.toFixed(2) +
							pos[i] +
							s + '</text>\n'
				if (j < 0)
					break
				k = j + 1;
				y += fh
			}
					
		}
		return fh * a[4]
	} // gen_hf()

	// svg_out()

	// start a new SVG container for the page
	abc2svg.page.img_out.call(abc, '<div>');

	page.hbase = page.topmargin;
	page.hmax = cfmt.pageheight - cfmt.topmargin - page.botmargin;
	page.pn++;
	page.pna++;

	// define the header/footer
	page.hf = ''
	if (page.header) {
		h = gen_hf(true, abc.get_font("header"), page.header);
		page.hmax -= h;
		page.hbase += h
	}
	if (page.footer)
		page.hmax -= gen_hf(false, abc.get_font("footer"), page.footer);

	page.h = page.hb = 0;
	page.out = ''
    }, // svg_out()

    // handle the output flow of the abc2svg generator
    img_in: function(p) {
    var h, i,
	page = this.page

	// copy a block
	function blkcpy(page) {
	    var b, h, i

		if (!page.blk || !page.blk.length) {
			page.blk = null
			return
		}
		h = page.hb
		for (i = 0; i < page.blk.length; i++) {
			b = page.blk[i]
			page.out += b.p
			    .replace(/<svg(.|\n)*?>/,
				'<g transform="translate(0,' +
				(h + page.hbase).toFixed(2) +
				')">')
			    .replace('</svg>', '</g>');
			h += b.h
		}
		page.blk = null
		page.h = h
	} // blkcpy()

	// get the style from the image and remove it from the block
	function get_style(p, page) {
	    var	i,
		sty = p.match(/<style.*?>((.|\n)*?)<\/style>/)

		if (!sty)
			return p
		sty = sty[1].split('\n')
		if (!page.style)
			page.style = '<style type="text/css">\n</style>\n'
		for (i = 0; i < sty.length; i++) {
			if (page.style.indexOf(sty[i]) < 0)
				page.style = page.style.replace('</style>\n',
						sty[i] + '\n</style>\n')
		}
		return p.replace(/<style(.|\n)*?\/style>\n/, '')
	} // get_style()

	// img_in()
	switch (p.slice(0, 4)) {
	case "<div":				// new block (tune / paragraph)
		if (p.indexOf('newpage') > 0
		 || (page.oneperpage && this.info().X)
		 || page.h == 0) {
			if (page.h) {
				abc2svg.page.img_out.call(this,
						page.head + page.style + page.hf +
						page.out + '</svg>');
				abc2svg.page.img_out.call(this, '</div>')
			}
			abc2svg.page.svg_out(this, page)
			if (!this.cfmt().fullsvg)
				page.style = ''
		}
		page.blk = [];
		page.hb = page.h
		break
	case "<svg":				// SVG image
		h = Number(p.match(/height="(\d+)px"/)[1])
		if (h + page.h >= page.hmax && page.h) { // if page overflow
			blkcpy(page);
			abc2svg.page.img_out.call(this,
					page.head + page.style + page.hf +
					page.out + '</svg>');
			abc2svg.page.img_out.call(this, '</div>');
			abc2svg.page.svg_out(this, page);
			page.h = this.cfmt().topspace
			if (!this.cfmt().fullsvg)
				page.style = ''
		}

		p = get_style(p, page)

		// output the block part or keep it until page overflow
		if (page.blk) {
			page.blk.push({p: p, h: h})
		} else {
			page.out += p
			    .replace(/<svg(.|\n)*?>/,
				'<g transform="translate(0,' +
				(page.h + page.hbase).toFixed(2) + ')">')
			    .replace('</svg>', '</g>\n')
		}
		page.h += h
		break
	case "</di":				// end of block
		blkcpy(page);
		page.out += '\n'
		break
//	default:
////fixme: %%beginml cannot be treated (no information about its height)
////		page.out += p
//		break
	}
    }, // img_in()

    // handle the page related parameters
    set_fmt: function(of, cmd, parm, lock) {
    var	v,
	cfmt = this.cfmt(),
	page = this.page

	if (cmd == "pageheight") {
		v = this.get_unit(parm)
		if (isNaN(v)) {
			this.syntax(1, errs.bad_val, '%%' + cmd)
			return
		}
		cfmt.pageheight = v

		// if first definition, install the hook
		if (!page && user.img_out && abc2svg.abc_end) {
			this.page = page = {
				topmargin: 38,	// 1cm
				botmargin: 38,	// 1cm
				h: 0,		// current page height
				pn: 0,		// page number
				pna: 0,		// absolute page number
				out: '',	// page content
				head: abc2svg.page.svg_head(cfmt),
				user_out: user.img_out
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

			// set the hooks
			user.img_out = abc2svg.page.img_in.bind(this);
			page.img_out_sav = user.img_out;
			abc2svg.abc_end = abc2svg.page.abc_end.bind(this,
								abc2svg.abc_end)
		}
		return
	}
	if (page) {
		switch (cmd) {
		case "header":
		case "footer":
			page[cmd] = parm
			return
		case "newpage":
			if (!parm)
				break
			v = Number(parm)
			if (isNaN(v)) {
				this.syntax(1, errs.bad_val, '%%' + cmd)
				return
			}
			page.pn = v - 1
			return
		case "botmargin":
		case "topmargin":
			v = this.get_unit(parm)
			if (isNaN(v)) {
				this.syntax(1, errs.bad_val, '%%' + cmd)
				return
			}
			page[cmd] = v
			return
		case "oneperpage":
			page[cmd] = this.get_bool(parm)
			return
		}
	}
	of(cmd, parm, lock)
	if (page) {
		switch (cmd) {
		case "pagewidth":
		case "bgcolor":
			page.head = abc2svg.page.svg_head(cfmt)
			break
		}
	}
    }, // set_fmt()

    set_hooks: function(abc) {
	abc.set_format = abc2svg.page.set_fmt.bind(abc, abc.set_format)
    }
} // page

abc2svg.modules.hooks.push(abc2svg.page.set_hooks);

// the module is loaded
abc2svg.modules.pageheight.loaded = true
