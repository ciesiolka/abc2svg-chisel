// abc2svg - deco.js - decorations
//
// Copyright (C) 2014-2022 Jean-Francois Moine
//
// This file is part of abc2svg-core.
//
// abc2svg-core is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg-core is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

// Decoration objects
// dd {			// decoration definition (static)
//	dd_en,			// definition of the ending decoration
//	dd_st,			// definition of the starting decoration
//	func,			// function
//	glyph,			// glyph
//	h,			// height / ascent
//	hd,			// descent
//	inv,			// inverted glyph
//	name,			// name
//	str,			// string
//	wl,			// left width
//	wr,			// right width
// }
// de {			// decoration elements (in an array - one list per music line)
//	dd,			// definition of the decoration
//	defl {			// flags
//		noen,			// no end of this decoration
//		nost,			// no start of this decoration
//	},
//	has_val,		// defined value
//	ix,			// index of the decoration in the 'de' list
//	lden,			// end of a long decoration
//	ldst,			// start of a long decoration if true
//	m,			// note index when note decoration
//	prev,			// previous decoration (hack for 'tr~~~~~')
//	s,			// symbol
//	start,			// start of the decoration (in the ending element)
//	up,			// above the symbol
//	val,			// value
//	x,			// x offset
//	y,			// y offset
// }

var	dd_tb = {},		// definition of the decorations
	a_de,			// array of the decoration elements
	cross			// cross voice decorations

// decorations - populate with standard decorations
var decos = {
	dot: "0 stc 6 1 1",
	tenuto: "0 emb 6 3 3",
	slide: "1 sld 3 7 0",
	arpeggio: "2 arp 12 10 2",
	roll: "3 roll 3,3 6 6",
	emphasis: "3 accent 3.5,3.5 4 4",
	lowermordent: "3 lmrd 4,4 5 5",
	uppermordent: "3 umrd 4,4 5 5",
	trill: "3 trl 14 5 5",
	upbow: "3 upb 10 5 5",
	downbow: "3 dnb 9 5 5",
	gmark: "3 grm 6 5 5",
	wedge: "0 wedge 8 3 3",	// (staccatissimo or spiccato)
	longphrase: "3 lphr 0 1 1",
	mediumphrase: "3 mphr 0 1 1",
	shortphrase: "3 sphr 0 1 1",
	turnx: "3 turnx 5,5 6 6",
	invertedturn: "3 turn 5,5 6 6",
	invertedturnx: "3 turnx 5,5 6 6",
	"0": "3 fng 5,5 3 3 0",
	"1": "3 fng 5,5 3 3 1",
	"2": "3 fng 5,5 3 3 2",
	"3": "3 fng 5,5 3 3 3",
	"4": "3 fng 5,5 3 3 4",
	"5": "3 fng 5,5 3 3 5",
	plus: "3 dplus 7 3 3",
	"+": "3 dplus 7 3 3",
	accent: "3 accent 3.5,3.5 4 4",
	">": "3 accent 3.5,3.5 4 4",
	marcato: "3 marcato 9 3 3",
	"^": "3 marcato 9 3 3",
	mordent: "3 lmrd 4,4 5 5",
	open: "3 opend 10 3 3",
	snap: "3 snap 14 3 3",
	thumb: "3 thumb 14 3 3",
	turn: "3 turn 5,5 6 6",
	"trill(": "3 ltr 8 4 0",
	"trill)": "3 ltr 8 4 0",
	"8va(": "5 8va 12 6 6",
	"8va)": "5 8va 12 6 6",
	"8vb(": "7 8vb 12 6 6",
	"8vb)": "7 8vb 12 6 6",
	"15ma(": "5 15ma 12 9 9",
	"15ma)": "5 15ma 12 9 9",
	"15mb(": "7 15mb 12 9 9",
	"15mb)": "7 15mb 12 9 9",
	breath: "5 brth 0 1 20",
	caesura: "5 caes 0 1 10",
	short: "5 short 0 1 4",
	tick: "5 tick 0 1 4",
	coda: "5 coda 24 10 10",
	dacapo: "5 dacs 16 20 20 Da Capo",
	dacoda: "5 dacs 16 20 20 Da Coda",
	"D.C.": "5 dcap 16 10 10",
	"D.S.": "5 dsgn 16 10 10",
	"D.C.alcoda": "5 dacs 16 38 38 D.C. al Coda",
	"D.S.alcoda": "5 dacs 16 38 38 D.S. al Coda",
	"D.C.alfine": "5 dacs 16 38 38 D.C. al Fine",
	"D.S.alfine": "5 dacs 16 38 38 D.S. al Fine",
	fermata: "5 hld 12 7 7",
	fine: "5 dacs 16 10 10 Fine",
	invertedfermata: "7 hld 12 7 7",
	segno: "5 sgno 22 8 8",
	f: "6 f 18 4 4",
	ff: "6 ff 18 6 6",
	fff: "6 fff 18 9 9",
	ffff: "6 ffff 18 12 12",
	mf: "6 mf 18 9 9",
	mp: "6 mp 18 10 10",
	p: "6 p 18 5 5",
	pp: "6 pp 18 9 9",
	ppp: "6 ppp 18 13 13",
	pppp: "6 pppp 18 17 17",
	pralltriller: "3 umrd 4,4 5 5",
	sfz: "6 sfz 18 8 8",
	ped: "4 ped 18 6 10",
	"ped-up": "4 pedoff 12 4 4",
	"ped(": "4 lped 20 5 5",
	"ped)": "4 lped 20 5 5",
	"crescendo(": "6 cresc 18 0 0",
	"crescendo)": "6 cresc 18 0 0",
	"<(": "6 cresc 18 0 0",
	"<)": "6 cresc 18 0 0",
	"diminuendo(": "6 dim 18 0 0",
	"diminuendo)": "6 dim 18 0 0",
	">(": "6 dim 18 0 0",
	">)": "6 dim 18 0 0",
	"-(": "8 gliss 0 0 0",
	"-)": "8 gliss 0 0 0",
	"~(": "8 glisq 0 0 0",
	"~)": "8 glisq 0 0 0",
// internal
//	color: "10 0 0 0 0",
	invisible: "32 0 0 0 0",
	beamon: "33 0 0 0 0",
	trem1: "34 0 0 0 0",
	trem2: "34 0 0 0 0",
	trem3: "34 0 0 0 0",
	trem4: "34 0 0 0 0",
	xstem: "35 0 0 0 0",
	beambr1: "36 0 0 0 0",
	beambr2: "36 0 0 0 0",
	rbstop: "37 0 0 0 0",
	"/": "38 0 0 6 6",
	"//": "38 0 0 6 6",
	"///": "38 0 0 6 6",
	"beam-accel": "39 0 0 0 0",
	"beam-rall": "39 0 0 0 0",
	stemless: "40 0 0 0 0",
	rbend: "41 0 0 0 0",
	editorial: "42 0 0 0 0",
	"sacc-1": "3 sacc-1 6,4 4 4",
	sacc3: "3 sacc3 6,5 4 4",
	sacc1: "3 sacc1 6,4 4 4",
	courtesy: "43 0 0 0 0",
	"cacc-1": "3 cacc-1 0 0 0",
	cacc3: "3 cacc3 0 0 0",
	cacc1: "3 cacc1 0 0 0",
	"tie(": "44 0 0 0 0",
	"tie)": "44 0 0 0 0"},

	// types of decoration per function
	f_near = [
		d_near,		// 0 - near the note
		d_slide,	// 1
		d_arp		// 2
	],
	f_note = [
		null, null, null,
		d_upstaff,	// 3 - tied to note
		d_upstaff	// 4 (below the staff)
	],
	f_staff = [
		null, null, null, null, null,
		d_upstaff,	// 5 (above the staff)
		d_pf,		// 6 - tied to staff (dynamic marks)
		d_upstaff	// 7 (below the staff)
	]

/* -- get the max/min vertical offset -- */
function y_get(st, up, x, w) {
	var	y,
		p_staff = staff_tb[st],
	i = (x / 2) | 0,
	j = ((x + w) / 2) | 0

	if (i < 0)
		i = 0
	if (j >= YSTEP) {
		j = YSTEP - 1
		if (i > j)
			i = j
	}
	if (up) {
		y = p_staff.top[i++]
		while (i <= j) {
			if (y < p_staff.top[i])
				y = p_staff.top[i];
			i++
		}
	} else {
		y = p_staff.bot[i++]
		while (i <= j) {
			if (y > p_staff.bot[i])
				y = p_staff.bot[i];
			i++
		}
	}
	return y
}

/* -- adjust the vertical offsets -- */
function y_set(st, up, x, w, y) {
    var	p_staff = staff_tb[st],
	i = (x / 2) | 0,
	j = ((x + w) / 2) | 0

	/* (may occur when annotation on 'y' at start of an empty staff) */
	if (i < 0)
		i = 0
	if (j >= YSTEP) {
		j = YSTEP - 1
		if (i > j)
			i = j
	}
	if (up) {
		while (i <= j) {
			if (p_staff.top[i] < y)
				p_staff.top[i] = y;
			i++
		}
	} else {
		while (i <= j) {
			if (p_staff.bot[i] > y)
				p_staff.bot[i] = y;
			i++
		}
	}
}

// get the staff position
// - of the ornements
function up3(s, pos) {
	switch (pos & 0x07) {
	case C.SL_ABOVE:
		return 1	// true
	case C.SL_BELOW:
		return 0	// false
	}
	if (s.multi)
		return s.multi > 0
	return 1		// true
} // up3()

// - of the dynamic and volume marks
function up6(s, pos) {
	switch (pos & 0x07) {
	case C.SL_ABOVE:
		return true
	case C.SL_BELOW:
		return false
	}
	if (s.multi)
		return s.multi > 0
	if (!s.p_v.have_ly)
		return false

	/* above if the lyrics are below the staff */
	return (s.pos.voc & 0x07) != C.SL_ABOVE
}

/* -- drawing functions -- */
/* 2: special case for arpeggio */
function d_arp(de) {
	var	m, h, dx,
		s = de.s,
		dd = de.dd,
		xc = dd.wr

	if (s.type == C.NOTE) {
		for (m = 0; m <= s.nhd; m++) {
			if (s.notes[m].acc) {
				dx = s.notes[m].shac
			} else {
				dx = 1 - s.notes[m].shhd
				switch (s.head) {
				case C.SQUARE:
					dx += 3.5
					break
				case C.OVALBARS:
				case C.OVAL:
					dx += 2
					break
				}
			}
			if (dx > xc)
				xc = dx
		}
	}
	h = 3 * (s.notes[s.nhd].pit - s.notes[0].pit) + 4;
	m = dd.h			/* minimum height */
	if (h < m)
		h = m;

	de.has_val = true;
	de.val = h;
//	de.x = s.x - xc;
	de.x -= xc;
	de.y = 3 * ((s.notes[0].pit + s.notes[s.nhd].pit) / 2 - 18) - h / 2 - 3
}

// special case for long dynamic decorations
function d_cresc(de) {
	if (de.ldst)			// skip start of deco
		return
    var	up, dx, x2, i, de3,
	dd = de.dd,
	s2 = de.s,
	de2 = de.start,			// start of the deco
	s = de2.s,
	x = s.x + 3			// x left

	de.st = s2.st;
	de.lden = false;		/* old behaviour */
	de.has_val = true;
	if (dd.ty == '^')
		up = 1
	else if (dd.ty != '_')
		up = up6(s2, s2.pos.dyn)
	if (up)
		de.up = true

	// shift the starting point if any dynamic mark on this symbol
	i = de2.ix
	while (--i >= 0) {
		de3 = a_de[i]
		if (!de3 || de3.s != s)
			break
	}
	while (1) {
		i++
		de3 = a_de[i]
		if (!de3 || de3.s != s)
			break
		if (de3 == de || de3 == de2)
			continue
		if (!(de.up ^ de3.up)
		 && f_staff[de3.dd.func]) {	// if dynamic mark
//			x2 = de3.x + de3.val + 4
			x2 = de3.x + de3.dd.wr + 2
			if (x2 > x)
				x = x2
			break
		}
	}

	if (de.defl.noen) {		/* if no decoration end */
		dx = de.x - x
		if (dx < 20) {
			x = de.x - 20 - 3;
			dx = 20
		}
	} else {

		// shift the ending point if any dynamic mark
		x2 = s2.x
		i = de.ix
		while (--i > 0) {
			de3 = a_de[i]
			if (!de3 || de3.s != s2)
				break
		}
		while (1) {
			i++
			de3 = a_de[i]
			if (!de3 || de3.s != s2)
				break
			if (de3 == de || de3 == de2)
				continue
			if (!(de.up ^ de3.up)
			 && f_staff[de3.dd.func]) {	// if dynamic mark
				x2 -= de3.dd.wl
				break
			}
		}
		dx = x2 - x - 4
		if (dx < 20) {
			x -= (20 - dx) * .5;
			dx = 20
		}
	}

	de.val = dx;
	de.x = x;
	de.y = y_get(de.st, up, x, dx)
	if (!up)
		de.y -= dd.h
	else
		de.y += dd.hd
	/* (y_set is done later in draw_deco_staff) */
}

/* 0: near the note (dot, tenuto) */
function d_near(de) {
	var	y, up,
		s = de.s,
		dd = de.dd

	if (dd.str) {			// annotation like decoration
//		de.x = s.x;
//		de.y = s.y;
		return
	}
	if (dd.ty == '^')
		up = 1
	else if (dd.ty == '_')
		up = 0
	else if (s.multi)
		up = s.multi > 0
	else
		up = s.stem < 0
	y = up ? s.ymx : s.ymn
	if (y > -6 && y < 30) {
		y = (((y + 9) / 6) | 0) * 6 - 6	// between lines
	}
	if (up) {
		y += dd.hd
		s.ymx = y + dd.h
	} else if (dd.name[0] == 'w') {		// wedge (no descent)
		de.inv = true
		y -= dd.h
		s.ymn = y
	} else {
		y -= dd.h
		s.ymn = y - dd.hd
	}
	de.y = y
	if (s.type == C.NOTE)
		de.x += s.notes[s.stem >= 0 ? 0 : s.nhd].shhd
	if (dd.name[0] == 'd'			/* if dot decoration */
	 && s.nflags >= -1) {			/* on stem */
		if (up) {
			if (s.stem > 0)
				de.x += 3.5	// stem_xoff
		} else {
			if (s.stem < 0)
				de.x -= 3.5
		}
	}
}

/* 6: dynamic marks */
function d_pf(de) {
	var	dd2, x2, x, up,
		s = de.s,
		dd = de.dd,
		de_prev;

	// don't treat here the long decorations
	if (de.ldst)			// if long deco start
		return
	if ((de.pos & C.SL_ALI_MSK) == C.SL_CLOSE
	 || ((de.pos & C.SL_ALI_MSK) == 0
	  && s.fmt.dynalign < 0)) {	// if no dynalign
		d_upstaff(de)		// then, do as above/below the staff
		return
	}
	if (de.start) {			// if long decoration
		d_cresc(de)
		return
	}

	de.val = dd.wl + dd.wr;
	up = up6(s, de.pos)
	if (up)
		de.up = true;
	x = s.x
	if (de.ix > 0) {
		de_prev = a_de[de.ix - 1]
		if (de_prev.s == s
		 && ((de.up && !de_prev.up)
		  || (!de.up && de_prev.up))) {
			dd2 = de_prev.dd
			if (f_staff[dd2.func]) {	/* if dynamic mark */
				x2 = de_prev.x + de_prev.val + 4;
				if (x2 > x)
					x = x2
			}
		}
	}

	de.x = x;
	de.y = y_get(s.st, up, x, de.val)
	if (!up)
		de.y -= dd.h
	else
		de.y += dd.hd
	/* (y_set is done later in draw_deco_staff) */
}

/* 1: special case for slide */
function d_slide(de) {
	var	m, dx,
		s = de.s,
		yc = s.notes[0].pit,
		xc = 5

	for (m = 0; m <= s.nhd; m++) {
		if (s.notes[m].acc) {
			dx = 4 + s.notes[m].shac
		} else {
			dx = 5 - s.notes[m].shhd
			switch (s.head) {
			case C.SQUARE:
				dx += 3.5
				break
			case C.OVALBARS:
			case C.OVAL:
				dx += 2
				break
			}
		}
		if (s.notes[m].pit <= yc + 3 && dx > xc)
			xc = dx
	}
//	de.x = s.x - xc;
	de.x -= xc;
	de.y = 3 * (yc - 18)
}

// special case for long decoration
function d_trill(de) {
	if (de.ldst)
		return
    var	up, y, w, tmp,
	dd = de.dd,
	de2 = de.prev,
		s2 = de.s,
		st = s2.st,
		s = de.start.s,
		x = s.x

	if (de2) {			// same height
		x = de2.s.x + de.dd.wl + 2
		de2.val -= de2.dd.wr
		if (de2.val < 8)
			de2.val = 8
	}
	de.st = st

	switch (dd.func) {
	case 5:
		up = 1
		break
	case 4:
	case 7:
		break
	case 3:			// tied to note
	case 6:			// dynamic mark
			if (dd.func == 6)
				up = up6(s, de.pos)
			else
				up = up3(s, de.pos)
			break
	}
	if (dd.ty == '^')
		up = 1
	else if (dd.ty == '_')
		up = 0

	if (de.defl.noen) {		/* if no decoration end */
		w = de.x - x
		if (w < 20) {
			x = de.x - 20 - 3;
			w = 20
		}
	} else {
		w = s2.x - x - 6
		if (s2.type == C.NOTE)
			w -= 6
		if (w < 10) {
			x -= 10 - w
			w = 10
		}
	}
	y = y_get(st, up, x - dd.wl - 5, w)
	if (up) {
		tmp = staff_tb[s.st].topbar + 2
		if (y < tmp)
			y = tmp
	} else {
		tmp = staff_tb[s.st].botbar - 2
		if (y > tmp)
			y = tmp
		y -= dd.h
	}
	if (de2) {			// if same height
		if (up) {
			if (y < de2.y)
				y = de2.y	// (only on one note)
		} else {
			if (y >= de2.y) {
				y = de2.y
			} else {
				do {
					de2.y = y
					de2 = de2.prev	// go backwards
				} while (de2)
			}
		}
	}

	de.lden = false;
	de.has_val = true;
	de.val = w;
	de.x = x;
	de.y = y
	de.up = up
	if (up)
		y += dd.h;
	y_set(st, up, x, w, y)
	if (up)
		s.ymx = s2.ymx = y
	else
		s.ymn = s2.ymn = y
}

/* 3, 4, 5, 7: above (or below) the staff */
function d_upstaff(de) {

	// don't treat here the long decorations
	if (de.ldst)			// if long deco start
		return
	if (de.start) {			// if long decoration
		d_trill(de)
		return
	}

    var	y, up, inv,
	s = de.s,
	dd = de.dd,
	x = de.x,
	w = dd.wl + dd.wr,
	stafft = staff_tb[s.st].topbar + 2 + dd.hd,
	staffb = staff_tb[s.st].botbar - 2 - dd.h

	// glyphs inside the staff
	switch (dd.glyph) {
	case "brth":
	case "caes":
	case "lphr":
	case "mphr":
	case "sphr":
	case "short":
	case "tick":
		y = stafft
		if (s.type == C.BAR) {
			s.invis = 1
		} else {
		if (dd.glyph == "brth" && y < s.ymx)
				y = s.ymx
			for (s = s.ts_next; s; s = s.ts_next)
				if (s.seqst)
					break
			x += ((s ? s.x : realwidth) - x) * .45
		}
		de.x = x
		de.y = y
		return
	}

	if (s.nhd)
		x += s.notes[s.stem >= 0 ? 0 : s.nhd].shhd;
	de.up = up = (dd.func == 4 || dd.func == 7) ? 0
			: dd.func == 6 ? up6(s, de.pos)
					: up3(s, de.pos)

	switch (dd.ty) {
	case '@':
	case '<':
	case '>':
		y = de.y
		break
	}
	if (y == undefined) {
		if (up) {
			y = y_get(s.st, true, x - dd.wl, w)
					+ dd.hd
			if (y < stafft)
				y = stafft
			if (de.y > y)
				y = de.y
			s.ymx = y + dd.h
		} else {
			y = y_get(s.st, false, x - dd.wl, w)
				- dd.h
			if (y > staffb)
				y = staffb
			if (de.y < y)
				y = de.y
			if (dd.name == "fermata"
			 || dd.glyph == "accent"
			 || dd.glyph == "roll")
				de.inv = 1
			s.ymn = y - dd.hd
		}
	}

	if (dd.func != 6) {			// if not d_pf
		if (y >= stafft)
			y_set(s.st, 1, x - dd.wl, w, y + dd.h)
		else if (y <= staffb)
			y_set(s.st, 0, x - dd.wl, w, y - dd.hd)
	}

	de.x = x;
	de.y = y
}

// add a decoration
/* syntax:
 *	%%deco <name> <c_func> <glyph> <h> <wl> <wr> [<str>]
 * "<h>" may be followed by ",<hd>" (descent)
 */
function deco_add(param) {
	var dv = param.match(/(\S*)\s+(.*)/);
	decos[dv[1]] = dv[2]
}

// define a decoration
// nm is the name of the decoration
// nmd is the name of the definition in the table 'decos'
function deco_def(nm, nmd) {
	if (!nmd)
		nmd = nm
    var a, dd, dd2, nm2, c, i, elts, str, hd,
	text = decos[nmd]

	// check if a long decoration with number
	if (!text && /\d[()]$/.test(nmd))
		text = decos[nmd.replace(/\d/, '')]

	if (!text) {
		if (cfmt.decoerr)
			error(1, null, "Unknown decoration '$1'", nm)
		return //undefined
	}

	// extract the values
	a = text.match(/(\d+)\s+(.+?)\s+([0-9.,]+)\s+([0-9.]+)\s+([0-9.]+)/)
	if (!a) {
		error(1, null, "Invalid decoration '$1'", nm)
		return //undefined
	}
	var	c_func = Number(a[1]),
//		glyph = a[2],
		h = a[3],
		wl = parseFloat(a[4]),
		wr = parseFloat(a[5])

	if (isNaN(c_func)) {
		error(1, null, "%%deco: bad C function value '$1'", a[1])
		return //undefined
	}
	if (c_func > 10
	 && (c_func < 32 || c_func > 44)) {
		error(1, null, "%%deco: bad C function index '$1'", c_func)
		return //undefined
	}
//	if (c_func == 5)			// old !trill(!
//		c_func = 3
//	if (c_func == 7)			// old !cresc(!
//		c_func = 6

	if (h.indexOf(',') > 0) {
		h = h.split(',')
		hd = h[1]
		h = h[0]
	} else {
		hd = 0
	}
	if (h > 50 || wl > 80 || wr > 80) {
		error(1, null, "%%deco: abnormal h/wl/wr value '$1'", text)
		return //undefined
	}

	// create/redefine the decoration
	dd = dd_tb[nm]
	if (!dd) {
		dd = {
			name: nm
		}
		dd_tb[nm] = dd
	}

	/* set the values */
	dd.func = nm.indexOf("head-") == 0 ? 9 : c_func;
	dd.glyph = a[2];
	dd.h = Number(h)
	dd.hd = Number(hd)
	dd.wl = wl;
	dd.wr = wr;
	str = text.replace(a[0], '').trim()
	if (str) {				// optional string
		if (str[0] == '"')
			str = str.slice(1, -1);
		if (str[0] == '@'
		 && !str.match(/^@([0-9.-]+),([0-9.-]+);?/)) {
			error(1, null, "%%deco: bad position '$1'", str)
			return
		}
		dd.str = str
	}

	/* compatibility */
	if (dd.func == 6 && dd.str == undefined)
		dd.str = nm

	// link the start and end of long decorations
	c = nm.slice(-1)
	if (c == '(' ||
	    (c == ')' && nm.indexOf('(') < 0)) {	// not (#)
		dd.str = null;			// (no string)
		nm2 = nm.slice(0, -1) + (c == '(' ? ')' : '(');
		dd2 = dd_tb[nm2]
		if (dd2) {
			if (c == '(') {
				dd.dd_en = dd2;
				dd2.dd_st = dd
			} else {
				dd.dd_st = dd2;
				dd2.dd_en = dd
			}
		}
	}
	return dd
}

// define a cross-voice tie
// @nm = decoration name
// @s = note symbol
// @nt1 = note
function do_ctie(nm, s, nt1) {
    var	nt2 = cross[nm],
	nm2 = nm.slice(0, -1) + (nm.slice(-1) == '(' ? ')' : '(')

	if (nt2) {
		error(1, s, "Conflict on !$1!", nm)
		return
	}
	nt1.s = s
	nt2 = cross[nm2]
	if (!nt2) {
		cross[nm] = nt1		// keep the start/end
		return
	}
	if (nm.slice(-1) == ')') {
		nt2 = nt1
		nt1 = cross[nm2]
	}
	cross[nm2] = null
	if (nt1.midi != nt2.midi
	 || nt1.s.time + nt1.s.dur != nt2.s.time) {
		error(1, s, "Bad tie")
	} else {
		nt1.tie_ty = C.SL_AUTO
		nt1.tie_e = nt2
		nt2.tie_s = nt1
		nt1.s.ti1 = nt2.s.ti2 = true
	}
} // do_ctie()

// get/create the definition of a decoration
function get_dd(nm) {
    var	ty, p,
	dd = dd_tb[nm]

	if (dd)
		return dd
	if ("<>^_@".indexOf(nm[0]) >= 0	// if position
	 && !/^([>^]|[<>]\d?[()])$/.test(nm)) {
		ty = nm[0]
		if (ty == '@') {
			p = nm.match(/@([-\d]+),([-\d]+)/)
			if (!p) {
				error(1, s, "Bad position in !$1!", nm)
				return
			}
			ty = p[0]
		}
		dd = deco_def(nm, nm.replace(ty, ''))
	} else {
		dd = deco_def(nm)
	}
	if (!dd)
		return
	if (ty) {
		if (ty[0] == '@') {		// if with x,y
			dd.x = Number(p[1])
			dd.y = Number(p[2])
			ty = '@'
		}
		dd.ty = ty
	}
	return dd
} // get_dd()

/* -- convert the decorations -- */
function deco_cnv(s, prev) {
    var	j, dd, nm, note, s1, court

	while (1) {
		nm = a_dcn.shift()
		if (!nm)
			break
		dd = get_dd(nm)
		if (!dd)
			continue

		/* special decorations */
		switch (dd.func) {
		case 0:			// near
			if (s.type == C.BAR && nm == "dot") {
				s.bar_dotted = true
				continue
			}
			// fall thru
		case 1:			// slide
		case 2:			// arp
//			if (s.type != C.NOTE && s.type != C.REST) {
			if (!s.notes) {
				error(1, s, errs.must_note_rest, nm)
				continue
			}
			break
		case 8:			// gliss
			if (s.type != C.NOTE) {
				error(1, s, errs.must_note, nm)
				continue
			}
			note = s.notes[s.nhd] // move to the upper note of the chord
			if (!note.a_dd)
				note.a_dd = []
			note.a_dd.push(dd)
			continue
		case 9:			// alternate head
			if (!s.notes) {
				error(1, s, errs.must_note_rest, nm)
				continue
			}

			// move the alternate head of the chord to the notes
			for (j = 0; j <= s.nhd; j++) {
				note = s.notes[j]
				note.invis = true
				if (!note.a_dd)
					note.a_dd = []
				note.a_dd.push(dd)
			}
			continue
		case 10:		/* color */
			if (s.notes) {
				for (j = 0; j <= s.nhd; j++)
					s.notes[j].color = nm
			} else {
				s.color = nm
			}
			break
		case 32:		/* invisible */
			s.invis = true
			break
		case 33:		/* beamon */
			if (s.type != C.BAR) {
				error(1, s, "!beamon! must be on a bar")
				continue
			}
			s.beam_on = true
			break
		case 34:		/* trem1..trem4 */
			if (s.type != C.NOTE
			 || !prev
			 || prev.type != C.NOTE
			 || s.dur != prev.dur) {
				error(1, s,
					"!$1! must be on the last of a couple of notes",
					nm)
				continue
			}
			s.trem2 = true;
			s.beam_end = true;
			s.beam_st = false;
			prev.beam_st = true;
			prev.beam_end = false;
			s.ntrem = prev.ntrem = Number(nm[4]);
			for (j = 0; j <= s.nhd; j++)
				s.notes[j].dur *= 2;
			for (j = 0; j <= prev.nhd; j++)
				prev.notes[j].dur *= 2
			break
		case 35:		/* xstem */
			if (s.type != C.NOTE) {
				error(1, s, errs.must_note, nm)
				continue
			}
			s.xstem = true;
			break
		case 36:		/* beambr1 / beambr2 */
			if (s.type != C.NOTE) {
				error(1, s, errs.must_note, nm)
				continue
			}
			if (nm[6] == '1')
				s.beam_br1 = true
			else
				s.beam_br2 = true
			break
		case 37:		/* rbstop */
			s.rbstop = 1	// open
			break
		case 38:		/* /, // and /// = tremolo */
			if (s.type != C.NOTE) {
				error(1, s, errs.must_note, nm)
				continue
			}
			s.trem1 = true;
			s.ntrem = nm.length	/* 1, 2 or 3 */
			break
		case 39:		/* beam-accel/beam-rall */
			if (s.type != C.NOTE) {
				error(1, s, errs.must_note, nm)
				continue
			}
			s.feathered_beam = nm[5] == 'a' ? 1 : -1;
			break
		case 40:		/* stemless */
			s.stemless = true
			break
		case 41:		/* rbend */
			s.rbstop = 2	// with end
			break
		case 42:		// editorial
			if (!s.notes[0].acc)
				continue
			nm = "sacc" + s.notes[0].acc.toString() // small accidental
			dd = dd_tb[nm]
			if (!dd) {
				dd = deco_def(nm)
				if (!dd) {
					error(1, s, errs.bad_val, "!editorial!")
					continue
				}
			}
			delete s.notes[0].acc
			curvoice.acc[s.notes[0].pit + 19] = 0	// ignore the accidental
			break
		case 43:		// courtesy
			j = curvoice.acc[s.notes[0].pit + 19]
			if (s.notes[0].acc || !j)
				continue
			court = 1			// defer
			break
		case 44:		// cross-voice ties
			do_ctie(nm, s, s.notes[0])	// (only one note for now)
			continue
//		default:
//			break
		}

		// add the decoration in the symbol
		if (!s.a_dd)
			s.a_dd = []
		s.a_dd.push(dd)
	}
	// handle the possible courtesy accidental
	if (court) {
		a_dcn.push("cacc" + j)
		dh_cnv(s, s.notes[0])
	}
}

// -- convert head decorations --
// The decorations are in the global array a_dcn
function dh_cnv(s, nt) {
    var	k, nm, dd

	while (1) {
		nm = a_dcn.shift()
		if (!nm)
			break
		dd = get_dd(nm)
		if (!dd)
			continue

		switch (dd.func) {
		case 0:
		case 1:
		case 3:
		case 4:
		case 8:			// gliss
			break
		default:
//		case 2:			// arpeggio
//		case 5:			// trill
//		case 7:			// d_cresc
			error(1, s, "Cannot have !$1! on a head", nm)
			continue
		case 9:			// head replacement
		case 32:		// invisible
			nt.invis = true
			break
		case 10:		// color
			nt.color = nm
			continue
		case 40:		// stemless chord (abcm2ps behaviour)
			s.stemless = true
			continue
		case 44:		// cross-voice ties
			do_ctie(nm, s, nt)
			continue
		}

		// add the decoration in the note
		if (!nt.a_dd)
			nt.a_dd = []
		nt.a_dd.push(dd)
	}
} // dh_cnv()

/* -- update the x position of a decoration -- */
// used to center the rests
function deco_update(s, dx) {
	var	i, de,
		nd = a_de.length

	for (i = 0; i < nd; i++) {
		de = a_de[i]
		if (de.s == s)
			de.x += dx
	}
}

/* -- adjust the symbol width -- */
function deco_width(s) {
    var	dd, i, w,
		wl = 0,
		a_dd = s.a_dd,
		nd = a_dd.length

	for (i = 0; i < nd; i++) {
		dd =  a_dd[i]
		switch (dd.func) {
		case 1:			/* slide */
			if (wl < 7)
				wl = 7
			break
		case 2:			/* arpeggio */
			if (wl < 14)
				wl = 14
			break
		case 3:
			switch (dd.glyph) {
			case "brth":
			case "lphr":
			case "mphr":
			case "sphr":
				if (s.wr < 20)
					s.wr = 20
				break
			}
			// fall thru
		default:
			switch (dd.ty) {
			case '<':
				w = dd.wl + dd.wr + 6
				if (wl < w)
					wl = w
				break
			case '>':
				w = dd.wl + dd.wr + 8
				if (s.wr < w)
					s.wr = w
				break
			}
			break
		}
	}
	if (wl && s.prev && s.prev.type == C.BAR)
		wl -= 3
	return wl
}

// compute the width of decorations in chord
function deco_wch(nt) {
    var	i, w, dd,
	wl = 0,
	n = nt.a_dd.length

	for (i = 0; i < n; i++) {
		dd = nt.a_dd[i]
		if (dd.ty == '<') {
			w = dd.wl + dd.wr + 8
			if (w > wl)
				wl = w
		}
	}
	return wl
} // deco_wch()

/* -- draw the decorations -- */
/* (the staves are defined) */
Abc.prototype.draw_all_deco = function() {
	if (!a_de.length)
		return
	var	de, dd, s, note, f, st, x, y, y2, ym, uf, i, str, a,
		new_de = [],
		ymid = []

		st = nstaff;
		y = staff_tb[st].y
		while (--st >= 0) {
			y2 = staff_tb[st].y;
			ymid[st] = (y + 24 + y2) * .5;
			y = y2
		}

	while (1) {
		de = a_de.shift()
		if (!de)
			break
		dd = de.dd
		if (!dd)
			continue		// deleted

		if (dd.dd_en)			// start of long decoration
			continue

		// handle the stem direction
		s = de.s
		f = dd.glyph;
		i = f.indexOf('/')
		if (i > 0) {
			if (s.stem >= 0)
				f = f.slice(0, i)
			else
				f = f.slice(i + 1)
		}

		// no voice scale if staff decoration
		if (f_staff[dd.func])
			set_sscale(s.st)
		else
			set_scale(s);

		st = de.st;
		if (!staff_tb[st].topbar)
			continue		// invisible staff
		x = de.x;
		y = de.y + staff_tb[st].y

		// update the coordinates if head decoration
		if (de.m != undefined) {
			note = s.notes[de.m];
			if (note.shhd)
				x += note.shhd * stv_g.scale;

		/* center the dynamic marks between two staves */
/*fixme: KO when deco on other voice and same direction*/
		} else if (dd.func == 6
			&& ((de.pos & C.SL_ALI_MSK) == C.SL_CENTER
			 || ((de.pos & C.SL_ALI_MSK) == 0
			  && !s.fmt.dynalign))
			&& ((de.up && st > 0)
			 || (!de.up && st < nstaff))) {
			if (de.up)
				ym = ymid[--st]
			else
				ym = ymid[st++];
			ym -= dd.h * .5
			if ((de.up && y < ym)
			 || (!de.up && y > ym)) {
//				if (s.st > st) {
//					while (s.st != st)
//						s = s.ts_prev
//				} else if (s.st < st) {
//					while (s.st != st)
//						s = s.ts_next
//				}
				y2 = y_get(st, !de.up, de.x, de.val)
					+ staff_tb[st].y
				if (de.up)
					y2 -= dd.h
//fixme: y_set is not used later!
				if ((de.up && y2 > ym)
				 || (!de.up && y2 < ym)) {
					y = ym;
//					y_set(st, de.up, de.x, de.val,
//						(de.up ? y + dd.h : y)
//							- staff_tb[st].y)
					if (stv_g.scale != 1)
						y += stv_g.dy / 2
				}
			}
		}

		// check if user JS decoration
		uf = user[f]
		if (uf && typeof(uf) == "function") {
			uf(x, y, de)
			continue
		}

		// check if user PS definition
		if (self.psdeco(f, x, y, de))
			continue

		anno_start(s, 'deco')
//		if (de.flags.grace) {
//			g_open(x, y, 0, .7, de.inv ? -.7 : 0);
//			x = y = 0
//		} else
		if (de.inv) {
			y = y + dd.h - dd.hd
			g_open(x, y, 0, 1, -1);
			x = y = 0
		}
		if (de.has_val) {
			if (dd.func != 2	// if not !arpeggio!
			 || stv_g.st < 0)	// or not staff scale
// || voice_tb[s.v].scale != 1)
				out_deco_val(x, y, f, de.val / stv_g.scale, de.defl)
			else
				out_deco_val(x, y, f, de.val, de.defl)
			if (de.cont)
				new_de.push(de.start)	// to be continued next line
		} else if (dd.str != undefined) {
			str = dd.str
			if (str[0] == '@') {
				a = str.match(/^@([0-9.-]+),([0-9.-]+);?/);
				x += Number(a[1]);
				y += Number(a[2]);
				str = str.replace(a[0], "")
			}
//			out_deco_str(x, y + de.dy,	// - dd.h * .2,
			out_deco_str(x, y,		// - dd.h * .2,
					f, str)
		} else if (de.lden) {
			out_deco_long(x, y, de)
		} else {
			xygl(x, y, f)
		}
		if (stv_g.g)
			g_close();
		anno_stop(s, 'deco')
	}

	// keep the long decorations which continue on the next line
	a_de = new_de
}

/* -- create the decorations and define the ones near the notes -- */
/* (the staves are not yet defined) */
/* (delayed output) */
/* this function must be called first as it builds the deco element table */
function draw_deco_near() {
    var	s, g

	// update starting old decorations
	function ldeco_update(s) {
		var	i, de,
//			x = s.ts_prev.x + s.ts_prev.wr
			x = s.x - s.wl,
			nd = a_de.length

		for (i = 0; i < nd; i++) {
			de = a_de[i];
			de.ix = i;
			de.s.x = de.x = x;
			de.defl.nost = true
		}
	}

	/* -- create the deco elements, and treat the near ones -- */
	function create_deco(s) {
	    var	dd, k, pos, de, x, y, v,
		nd = s.a_dd.length

		if (s.y == undefined)
			s.y = 0			// (no y in measure bars)

/*fixme:pb with decorations above the staff*/
		for (k = 0; k < nd; k++) {
			dd = s.a_dd[k]

			// adjust the position
			x = s.x
			y = s.y
			switch (dd.func) {
			default:
				if (dd.func >= 10)
					continue
				pos = 0
				break
			case 3:				/* d_upstaff */
			case 4:
			case 5:				// after slurs
			case 7:
				pos = s.pos.orn
				break
			case 6:				/* d_pf */
				pos = s.pos.vol
				break
			case 7:				/* d_cresc */
				pos = s.pos.dyn
				break
			}

			switch (dd.ty) {		// explicit position
			case '^':
				pos = (pos & ~0x07) | C.SL_ABOVE
				break
			case '_':
				pos = (pos & ~0x07) | C.SL_BELOW
				break
			case '<':
			case '>':
				pos = (pos & 0x07) | C.SL_CLOSE
				if (dd.ty == '<') {
					x -= dd.wr + 8
					if (s.notes[0].acc)
						x -= 5.5
				} else {
					x += dd.wl + 8
				}
				y = 3 * (s.notes[0].pit - 18)
						- (dd.h - dd.hd) / 2
				break
			case '@':
				x += dd.x
				y += dd.y
				break
			}

			if ((pos & 0x07) == C.SL_HIDDEN)
				continue

			de = {
				s: s,
				dd: dd,
				st: s.st,
				ix: a_de.length,
				defl: {},
				x: x,
				y: y,
				pos: pos
//				dy: 0
			}
			if (dd.name.indexOf("invert") == 0)
				de.inv = 1
			if (s.type == C.BAR && !dd.ty)
				de.x -= s.wl / 2 - 2
			a_de.push(de)
			if (dd.dd_en) {
				de.ldst = true
			} else if (dd.dd_st) {
//fixme: pb with "()"
				de.lden = true;
				de.defl.nost = true
			}

			if (f_near[dd.func])
				f_near[dd.func](de)
		}
	} // create_deco()

	// create the decorations of note heads
	function create_dh(s, m) {
	    var	de, k, dd,
		note = s.notes[m],
		nd = note.a_dd.length,
		x = s.x

		for (k = 0; k < nd; k++) {
			dd = note.a_dd[k]

//fixme: check if hidden?
			de = {
				s: s,
				dd: dd,
				st: s.st,
				m: m,
				ix: 0,
				defl: {},
				x: x,
				y: 3 * (note.pit - 18)
//				dy: 0
			}

			if (dd.ty) {		// if explicit position
				if (dd.ty == '@') {
					de.x += dd.x
					de.y += dd.y
				} else {
					de.y -= (dd.h - dd.hd) / 2	// center
					if (dd.ty == '<')
						de.x -= dd.wr + 8
					else if (dd.ty == '>')
						de.x += dd.wr + 8
				}
			}

			a_de.push(de)
			if (dd.dd_en) {
				de.ldst = true
			} else if (dd.dd_st) {
				de.lden = true;
				de.defl.nost = true
			}
		}
	} // create_dh()

	// create all decorations of a note (chord and heads)
	function create_all(s) {
		if (s.invis && s.play)	// play sequence: no decoration
			return
		if (s.a_dd)
			create_deco(s)
		if (s.notes) {
			for (var m = 0; m < s.notes.length; m++) {
				if (s.notes[m].a_dd)
					create_dh(s, m)
			}
		}
	} // create_all()

	// link the long decorations
	function ll_deco() {
	    var	i, j, de, de2, de3, dd, dd2, v, s, st,
			n_de = a_de.length

		// add ending decorations
		for (i = 0; i < n_de; i++) {
			de = a_de[i]
			if (!de.ldst)	// not the start of long decoration
				continue
			dd = de.dd;
			dd2 = dd.dd_en;
			s = de.s;
			v = s.v			// search later in the voice
			for (j = i + 1; j < n_de; j++) {
				de2 = a_de[j]
				if (!de2.start
				 && de2.dd == dd2 && de2.s.v == v)
					break
			}
			if (j == n_de) {	// no end, search in the staff
				st = s.st;
				for (j = i + 1; j < n_de; j++) {
					de2 = a_de[j]
					if (!de2.start
					 && de2.dd == dd2 && de2.s.st == st)
						break
				}
			}
			if (j == n_de) {	// no end, insert one
				de2 = {
					s: s,
					st: de.st,
					dd: dd2,
					ix: a_de.length - 1,
					x: realwidth - 6,
					y: s.y,
					cont: true,	// keep for next line
					lden: true,
					defl: {
						noen: true
					}
				}
				if (de2.x < s.x + 10)
					de2.x = s.x + 10
				if (de.m != undefined)
					de2.m = de.m;
				a_de.push(de2)
			}
			de2.start = de;
			de2.defl.nost = de.defl.nost

			// handle same decoration ending at a same time
			j = i
			while (--j >= 0) {
				de3 = a_de[j]
				if (!de3.start)
					continue
				if (de3.s.time < s.time)
					break
				if (de3.dd.name == de2.dd.name) {
					de2.prev = de3
					break
				}
			}
		}

		// add starting decorations
		for (i = 0; i < n_de; i++) {
			de2 = a_de[i]
			if (!de2.lden	// not the end of long decoration
			 || de2.start)	// start already found
				continue
			s = de2.s;
			de = {
				s: prev_scut(s),
				st: de2.st,
				dd: de2.dd.dd_st,
				ix: a_de.length - 1,
//				x: s.x - s.wl - 4,
				y: s.y,
				ldst: true
			}
			de.x = de.s.x
			if (de2.m != undefined)
				de.m = de2.m;
			a_de.push(de);
			de2.start = de
		}
	} // ll_deco

	// update the long decorations started in the previous line
	for (s = tsfirst ; s; s = s.ts_next) {
		switch (s.type) {
		case C.CLEF:
		case C.KEY:
		case C.METER:
			continue
		}
		break
	}
	if (a_de.length)
		ldeco_update(s)

	for ( ; s; s = s.ts_next) {
		switch (s.type) {
		case C.BAR:
		case C.MREST:
		case C.NOTE:
		case C.REST:
		case C.SPACE:
			break
		case C.GRACE:
			for (g = s.extra; g; g = g.next)
				create_all(g)
			break
		default:
			continue
		}
		create_all(s)
	}
	ll_deco()			// link the long decorations
}

/* -- define the decorations tied to a note -- */
/* (the staves are not yet defined) */
/* (delayed output) */
function draw_deco_note() {
	var	i, de, dd, f,
		nd = a_de.length

	for (i = 0; i < nd; i++) {
		de = a_de[i];
		dd = de.dd;
		f = dd.func
		if (f_note[f]
		 && de.m == undefined)
			f_note[f](de)
	}
}

// -- define the music elements tied to the staff --
//	- decoration tied to the staves
//	- chord symbols
//	- repeat brackets
/* (the staves are not yet defined) */
/* (unscaled delayed output) */
function draw_deco_staff() {
    var	s, p_voice, y, i, v, de, dd,
	minmax = new Array(nstaff + 1),
	nd = a_de.length

	/* draw the repeat brackets */
	function draw_repbra(p_voice) {
		var s, s1, x, y, y2, i, p, w, wh, first_repeat;

		// search the max y offset of the line
		y = staff_tb[p_voice.st].topbar + 25	// 20 (vert bar) + 5 (room)
		for (s = p_voice.sym; s; s = s.next) {
			if (s.type != C.BAR)
				continue
			if (!s.rbstart || s.norepbra)
				continue
/*fixme: line cut on repeat!*/
			if (!s.next)
				break
			if (!first_repeat) {
				first_repeat = s;
				set_font("repeat")
			}
			s1 = s
			for (;;) {
				if (!s.next)
					break
				s = s.next
				if (s.rbstop)
					break
			}
			y2 = y_get(p_voice.st, true, s1.x, s.x - s1.x) + 2
			if (y < y2)
				y = y2

			// have room for the vertical lines and the repeat numbers
			if (s1.rbstart == 2) {
				y2 = y_get(p_voice.st, true, s1.x, 3) + 20
				if (y < y2)
					y = y2
			}
			if (s.rbstop == 2) {
				y2 = y_get(p_voice.st, true, s.x - 3, 3) + 20
				if (y < y2)
					y = y2
			}
			if (s1.text) {
				wh = strwh(s1.text);
				y2 = y_get(p_voice.st, true, s1.x + 4, wh[0]) +
						wh[1]
				if (y < y2)
					y = y2
			}
			if (s.rbstart)
				s = s.prev
		}

		/* draw the repeat indications */
		s = first_repeat
		if (!s)
			return
		set_dscale(p_voice.st, true);
		y2 =  y * staff_tb[p_voice.st].staffscale
		for ( ; s; s = s.next) {
			if (!s.rbstart || s.norepbra)
				continue
			s1 = s
			while (1) {
				if (!s.next)
					break
				s = s.next
				if (s.rbstop)
					break
			}
			if (s1 == s)
				break
			x = s1.x
			if (cfmt.measurenb > 0 & s.bar_num
			 && s.bar_num % cfmt.measurenb)
				x += 6
			if (s.type != C.BAR) {
				w = s.rbstop ? 0 : s.x - realwidth + 4
			} else if ((s.bar_type.length > 1	// if complex bar
				 && s.bar_type != "[]")
				|| s.bar_type == "]") {
//				if (s.bar_type == "]")
//					s.invis = true
//fixme:%%staves: cur_sy moved?
				if (s1.st > 0
				 && !(cur_sy.staves[s1.st - 1].flags & STOP_BAR))
					w = s.wl
				else if (s.bar_type.slice(-1) == ':')
					w = 12
				else if (s.bar_type[0] != ':')
//				      || s.bar_type == "]")
					w = 0		/* explicit repeat end */
				else
					w = 8
			} else {
				w = s.rbstop ? 0 : 8
			}
			w = (s.x - x - w)	// / staff_tb[p_voice.st].staffscale;

			if (!s.next		// 2nd ending at end of line
			 && !s.rbstop
			 && !p_voice.bar_start) { // continue on next line
				p_voice.bar_start = _bar(s)
				p_voice.bar_start.bar_type = ""
				p_voice.bar_start.rbstart = 1
			}
			if (s1.text)
				xy_str(x + 4, y2 - gene.curfont.size - 3,
					s1.text);
			xypath(x, y2);
			if (s1.rbstart == 2)
				output += 'm0 20v-20';
			output+= 'h' + w.toFixed(1)
			if (s.rbstop == 2)
				output += 'v20';
			output += '"/>\n';
			y_set(s1.st, true, x, w, y + 2)

			if (s.rbstart)
				s = s.prev
		}
	} // draw_repbra()

	/* create the decorations tied to the staves */
	for (i = 0; i <= nstaff; i++)
		minmax[i] = {
			ymin: 0,
			ymax: 0
		}
	for (i = 0; i < nd; i++) {
		de = a_de[i];
		dd = de.dd
		if (!dd)		// if error
			continue
		if (!f_staff[dd.func]	/* if not tied to the staff */
		 || de.m != undefined)	// or head decoration
			continue
		f_staff[dd.func](de)
		if (dd.dd_en)		// if start
			continue
		if ((de.pos & C.SL_ALI_MSK) == C.SL_ALIGN
		 || ((de.pos & C.SL_ALI_MSK) == 0
		  && de.s.fmt.dynalign > 0)) {	// if align
			if (de.up) {
				if (de.y > minmax[de.st].ymax)
					minmax[de.st].ymax = de.y
			} else {
				if (de.y < minmax[de.st].ymin)
					minmax[de.st].ymin = de.y
			}
		}
	}

	/* and, if wanted, set them at a same vertical offset */
	for (i = 0; i < nd; i++) {
		de = a_de[i];
		dd = de.dd
		if (!dd)		// if error
			continue
		if (dd.dd_en		// if start
		 || !f_staff[dd.func])
			continue
		if (dd.func == 6
		 &&((de.pos & C.SL_ALI_MSK) == C.SL_ALIGN
		  || ((de.pos & C.SL_ALI_MSK) == 0
		   && de.s.fmt.dynalign > 0))) {	// if align
			if (de.up)
				y = minmax[de.st].ymax
			else
				y = minmax[de.st].ymin;
			de.y = y
		} else {
			y = de.y
		}
		if (de.up)
			y += dd.h;
		y_set(de.st, de.up, de.x, de.val, y)
	}

	draw_all_chsy()		// draw all chord symbols

	/* draw the repeat brackets */
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (p_voice.second || !p_voice.sym)
			continue
		draw_repbra(p_voice)
	}
}

/* -- draw the measure bar numbers -- */
/* (scaled delayed output) */
function draw_measnb() {
	var	s, st, bar_num, x, y, w, any_nb, font_size, w0,
		sy = cur_sy

	/* search the top staff */
	for (st = 0; st <= nstaff; st++) {
		if (sy.st_print[st])
			break
	}
	if (st > nstaff)
		return				/* no visible staff */
	set_dscale(st)

	/* leave the measure numbers as unscaled */
	if (staff_tb[st].staffscale != 1) {
		font_size = get_font("measure").size;
		param_set_font("measurefont", "* " +
			(font_size / staff_tb[st].staffscale).toString())
	}
	set_font("measure");
	w0 = cwidf('0');			// (greatest) width of a number

	s = tsfirst;				/* clef */
	bar_num = gene.nbar
	if (bar_num > 1) {
		if (cfmt.measurenb == 0) {
			any_nb = true;
			y = y_get(st, true, 0, 20)
			if (y < staff_tb[st].topbar + 14)
				y = staff_tb[st].topbar + 14;
			xy_str(0, y, bar_num.toString());
			y_set(st, true, 0, 20, y + gene.curfont.size + 2)
		} else if (bar_num % cfmt.measurenb == 0) {
			for ( ; ; s = s.ts_next) {
				switch (s.type) {
				case C.CLEF:
				case C.KEY:
				case C.METER:
				case C.STBRK:
					continue
				}
				break
			}

			// don't display the number twice
		     if (s.type != C.BAR || !s.bar_num) {
			any_nb = true;
			w = w0
			if (bar_num >= 10)
				w *= bar_num >= 100 ? 3 : 2
			if (gene.curfont.pad)
				w += gene.curfont.pad * 2
			x = s.x - s.wl + 2	// if clef, shift a bit
			y = y_get(st, true, x, w)
			if (y < staff_tb[st].topbar + 6)
				y = staff_tb[st].topbar + 6;
			y += 2 + gene.curfont.pad
			xy_str(x, y, bar_num.toString())
			y += gene.curfont.size + gene.curfont.pad
			y_set(st, true, x, w, y);
//			s.ymx = y
		     }
		}
	}

	for ( ; s; s = s.ts_next) {
		switch (s.type) {
		case C.STAVES:
			sy = s.sy
			for (st = 0; st < nstaff; st++) {
				if (sy.st_print[st])
					break
			}
			set_dscale(st)
			continue
		default:
			continue
		case C.BAR:
			if (!s.bar_num || s.bar_num <= 1)
				continue
			break
		}

		bar_num = s.bar_num
		if (cfmt.measurenb == 0
		 || (bar_num % cfmt.measurenb) != 0
		 || !s.next
		 || s.bar_mrep)
			continue
		if (!any_nb)
			any_nb = true;
		w = w0
		if (bar_num >= 10)
			w *= bar_num >= 100 ? 3 : 2
		if (gene.curfont.pad)
			w += gene.curfont.pad * 2
		x = s.x
		y = y_get(st, true, x, w)
		if (y < staff_tb[st].topbar + 6)
			y = staff_tb[st].topbar + 6
		if (s.next.type == C.NOTE) {
			if (s.next.stem > 0) {
				if (y < s.next.ys - gene.curfont.size)
					y = s.next.ys - gene.curfont.size
			} else {
				if (y < s.next.y)
					y = s.next.y
			}
		}
		y += 2 + gene.curfont.pad
		xy_str(x, y, bar_num.toString())
		y += gene.curfont.size + gene.curfont.pad
		y_set(st, true, x, w, y);
//		s.ymx = y
	}
	gene.nbar = bar_num

	if (font_size)
		param_set_font("measurefont", "* " + font_size.toString());
}

/* -- draw the parts and the tempo information -- */
/* (the staves are being defined) */
function draw_partempo(st, top) {
    var	s, s2, some_part, some_tempo, h, w, y,
	dy = 0,		/* put the tempo indication at top */
	ht = 0

	/* get the minimal y offset */
	var	ymin = staff_tb[st].topbar + 8,
		dosh = 0,
		shift = 1,
		x = -100	// (must be negative for %%soloffs)

	for (s = tsfirst; s; s = s.ts_next) {
		if (s.type != C.TEMPO || s.invis)
			continue
		if (!some_tempo)
			some_tempo = s;
		w = s.tempo_wh[0]
		if (s.time == 0 && s.x > 40)	// at start of tune and no %%soloffs,
			s.x = 40;	// shift the tempo over the key signature
		y = y_get(st, true, s.x - 16, w)
		if (y > ymin)
			ymin = y
		if (x >= s.x - 16 && !(dosh & (shift >> 1)))
			dosh |= shift;
		shift <<= 1;
		x = s.x - 16 + w
	}
	if (some_tempo) {
		set_sscale(-1);
		set_font("tempo");
		ht = gene.curfont.size + 8;
		y = 2 - ht;
		h = y - ht
		if (dosh != 0)
			ht *= 2
		if (top < ymin + ht)
			dy = ymin + ht - top

		/* draw the tempo indications */
		for (s = some_tempo; s; s = s.ts_next) {
			if (s.type != C.TEMPO
			 || s.invis)		// (displayed by %%titleformat)
				continue
			if (user.anno_start || user.anno_stop) {
				s.wl = 16;
				s.wr = 30;
				s.ymn = (dosh & 1) ? h : y;
				s.ymx = s.ymn + 14;
				anno_start(s)
			}
			writempo(s, s.x - 16, (dosh & 1) ? h : y);
			anno_stop(s);
			dosh >>= 1
			while (s.ts_next && s.ts_next.type == C.TEMPO)
				s = s.ts_next
		}
	}

	/* then, put the parts */
/*fixme: should reduce vertical space if parts don't overlap tempo...*/
	ymin = staff_tb[st].topbar + 6
	for (s = tsfirst; s; s = s.ts_next) {
		s2 = s.part
		if (!s2 || s2.invis)
			continue
		if (!some_part) {
			some_part = s;
			set_font("parts");
			h = gene.curfont.size + 2 +
				gene.curfont.pad * 2
		}
		if (s2.x == undefined)
			s2.x = s.x - 10
		w = strwh(s2.text)[0]
		y = y_get(st, true, s2.x, w + 3)
		if (ymin < y)
			ymin = y
	}
	if (some_part) {
		set_sscale(-1)
		ht += h
		if (top + dy < ymin + ht)
			dy = ymin + ht - top

		for (s = some_part; s; s = s.ts_next) {
			s2 = s.part
			if (!s2 || s2.invis)
				continue
			if (user.anno_start || user.anno_stop) {
				s2.type = C.PART
				s2.p_v = s.p_v
				s2.v = s.v
				s2.st = s2.wl = 0
				s2.wr = strwh(s2.text)[0]
				s2.ymn = -ht
				s2.ymx = s2.ymn + h
				anno_start(s2)
			}
			xy_str(s2.x, 2 - ht, s2.text)
			anno_stop(s2)
		}
	}
	return dy /= staff_tb[0].staffscale
}
