
// abc2svg - parse.js - ABC parse
//
// Copyright (C) 2014-2019 Jean-Francois Moine
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

var	a_gch,		// array of parsed guitar chords
	a_dcn,		// array of parsed decoration names
	multicol,	// multi column object
	maps = {}	// maps object - hashcode = map name
			//	-> object - hashcode = note
			//	[0] array of heads
			//	[1] print
			//	[2] color
var	qplet_tb = new Int8Array([ 0, 1, 3, 2, 3, 0, 2, 0, 3, 0 ]),
	ntb = "CDEFGABcdefgab"

// set the source references of a symbol
function set_ref(s) {
	s.fname = parse.fname;
	s.istart = parse.istart;
	s.iend = parse.iend
}

// -- %% pseudo-comment

// clef definition (%%clef, K: and V:)
function new_clef(clef_def) {
	var	s = {
			type: C.CLEF,
			clef_line: 2,
			clef_type: "t",
			v: curvoice.v,
			p_v: curvoice,
			time: curvoice.time,
			dur: 0
		},
		i = 1

	set_ref(s)

	switch (clef_def[0]) {
	case '"':
		i = clef_def.indexOf('"', 1);
		s.clef_name = clef_def.slice(1, i);
		i++
		break
	case 'a':
		if (clef_def[1] == 'u') {	// auto
			s.clef_type = "a";
			s.clef_auto = true;
			i = 4
			break
		}
		i = 4				// alto
	case 'C':
		s.clef_type = "c";
		s.clef_line = 3
		break
	case 'b':				// bass
		i = 4
	case 'F':
		s.clef_type = "b";
		s.clef_line = 4
		break
	case 'n':				// none
		i = 4
		s.invis = true
		break
	case 't':
		if (clef_def[1] == 'e') {	// tenor
			s.clef_type = "c";
			s.clef_line = 4
			break
		}
		i = 6
	case 'G':
//		s.clef_type = "t"		// treble
		break
	case 'p':
		i = 4
	case 'P':				// perc
		s.clef_type = "p";
		s.clef_line = 3;
		curvoice.key.k_sf = 0;		// no accidental
		curvoice.ckey.k_drum = true	// no transpose
		break
	default:
		syntax(1, "Unknown clef '$1'", clef_def)
		return //undefined
	}
	if (clef_def[i] >= '1' && clef_def[i] <= '9') {
		s.clef_line = Number(clef_def[i]);
		i++
	}
	if (clef_def[i + 1] != '8')
		return s
	switch (clef_def[i]) {			// octave
	case '^':
		s.clef_oct_transp = true
	case '+':
		s.clef_octave = 7
		break
	case '_':
		s.clef_oct_transp = true
	case '-':
		s.clef_octave = -7
		break
	}
	return s
}

// get a transposition value as a base-40 interval
function get_transp(param,
			type) {		// undefined or "instr"
	if (param[0] == '0')
		return 0

    var	i, val, tmp, note, pit,
	ts = [0, 1, 6,11,12,17,18,23,28,29,34,35],
	tf = [0, 5, 6,11,12,17,22,23,28,29,34,39]

	if ("123456789-+".indexOf(param[0]) >= 0) {	// by semi-tone
		val = parseInt(param)
		if (isNaN(val) || val < -36 || val > 36) {
//fixme: no source reference...
			syntax(1, "Bad transpose value")
			return
		}
		return ((val / 12) | 0) * 40 +
			(param.slice(-1) == 'b' ?
					abc2svg.ifb40 :
					abc2svg.isb40)[(val + 36) % 12]
	}

	// by music interval
	if (type == "instr") {	// convert instrument= into score= or sound=
		tmp = param.indexOf('/')
		if (!cfmt.sound) {
			if (tmp < 0)
				return 0	// written pitch
			param = param.replace('/', '')
		} else {
			if (tmp < 0)
				param = 'c' + param
			else
				param = param.replace(/.*\//, 'c')
		}
	}

	tmp = new scanBuf;
	tmp.buffer = param
	pit = []
	for (i = 0; i < 2; i++) {
		note = tmp.buffer[tmp.index] ? parse_acc_pit(tmp) : null
		if (!note) {
			syntax(1, "Bad transpose value")
			return
		}
		pit[i] = abc2svg.pab40(note.pit, note.acc)
	}
	return pit[1] - pit[0]
}

// set the linebreak character
function set_linebreak(param) {
	var i, item

	for (i = 0; i < 128; i++) {
		if (char_tb[i] == "\n")
			char_tb[i] = nil	// remove old definition
	}
	param = param.split(/\s+/)
	for (i = 0; i < param.length; i++) {
		item = param[i]
		switch (item) {
		case '!':
		case '$':
		case '*':
		case ';':
		case '?':
		case '@':
			break
		case "<none>":
			continue
		case "<EOL>":
			item = '\n'
			break
		default:
			syntax(1, "Bad value '$1' in %%linebreak - ignored",
					item)
			continue
		}
		char_tb[item.charCodeAt(0)] = '\n'
	}
}

// set a new user character (U: or %%user)
function set_user(parm) {
    var	k, c, v,
	a = parm.match(/(.*?)[= ]*([!"].*[!"])/)

	if (!a) {
		syntax(1, 'Lack of starting ! or " in U: / %%user')
		return
	}
	c = a[1];
	v = a[2]
	if (v.slice(-1) != v[0]) {
		syntax(1, "Lack of ending $1 in U:/%%user", v[0])
		return
	}
	if (c[0] == '\\') {
		if (c[1] == 't')
			c = '\t'
		else if (!c[1])
			c = ' '
	}

	k = c.charCodeAt(0)
	if (k >= 128) {
		syntax(1, errs.not_ascii)
		return
	}
	switch (char_tb[k][0]) {
	case '0':			// nil
	case 'd':
	case 'i':
	case ' ':
		break
	case '"':
	case '!':
		if (char_tb[k].length > 1)
			break
		// fall thru
	default:
		syntax(1, "Bad user character '$1'", c)
		return
	}
	switch (v) {
	case "!beambreak!":
		v = " "
		break
	case "!ignore!":
		v = "i"
		break
	case "!nil!":
	case "!none!":
		v = "d"
		break
	}
	char_tb[k] = v
}

// get a stafflines value
function get_st_lines(param) {
	if (!param)
		return
	if (/^[\]\[|.-]+$/.test(param))
		return param.replace(/\]/g, '[')

    var	n = parseInt(param)
	switch (n) {
	case 0: return "..."
	case 1: return "..|"
	case 2: return ".||"
	case 3: return ".|||"
	}
	if (isNaN(n) || n < 0 || n > 16)
		return //undefined
	return "||||||||||||||||".slice(0, n)
}

// create a block symbol in the tune body
function new_block(subtype) {
	var	s = {
			type: C.BLOCK,
			subtype: subtype,
			dur: 0
		}

	if (parse.state == 2)
		goto_tune()
	sym_link(s)
	return s
}

// set the voice parameters
// (possible hook)
Abc.prototype.set_vp = function(a) {
    var	s, item, pos, val, clefpit

	while (1) {
		item = a.shift()
		if (!item)
			break
		if (item[item.length - 1] == '='
		 && a.length == 0) {
			syntax(1, errs.bad_val, item)
			break
		}
		switch (item) {
		case "clef=":
			s = a.shift()		// keep last clef
			break
		case "clefpitch=":
			item = a.shift()		// (<note><octave>)
			if (item) {
				val = ntb.indexOf(item[0])
				if (val >= 0) {
					switch (item[1]) {
					case "'":
						val += 7
						break
					case ',':
						val -= 7
						if (item[2] == ',')
							val -= 7
						break
					}
					clefpit = 4 - val	// 4 = 'G'
					break
				}
			}
			syntax(1, errs.bad_val, item)
			break
		case "octave=":
		case "uscale=":			// %%microscale
			val = parseInt(a.shift())
			if (isNaN(val))
				syntax(1, errs.bad_val, item)
			else
				curvoice[item.slice(0, -1)] = val
			break
		case "cue=":
			curvoice.scale = a.shift() == 'on' ? .7 : 1
			break
		case "instrument=":
			curvoice.transp = get_transp(a.shift(), 'instr')
			break
		case "map=":			// %%voicemap
			curvoice.map = a.shift()
			break
		case "name=":
		case "nm=":
			curvoice.nm = a.shift()
			if (curvoice.nm[0] == '"')
				curvoice.nm = curvoice.nm.slice(1, -1);
			curvoice.new_name = true
			break
		case "stem=":
		case "pos=":
			if (item == "pos=")
				item = a.shift().split(' ')
			else
				item = ["stm", a.shift()];
			val = posval[item[1]]
			if (val == undefined) {
				syntax(1, errs.bad_val, item[0])
				break
			}
			if (!pos)
				pos = {}
			pos[item[0]] = val
			break
		case "scale=":			// %%voicescale
			val = parseFloat(a.shift())
			if (isNaN(val) || val < .6 || val > 1.5)
				syntax(1, errs.bad_val, "%%voicescale")
			else
				curvoice.scale = val
			break
		case "score=":
			item = a.shift()
			if (cfmt.sound)
				break
			curvoice.transp = get_transp(item)
			break
		case "shift=":
			curvoice.shift = get_transp(a.shift())
			break
		case "sound=":
		case "transpose=":		// (abcMIDI compatibility)
			item = a.shift()
			if (!cfmt.sound)
				break
			curvoice.transp = get_transp(item)
			break
		case "subname=":
		case "sname=":
		case "snm=":
			curvoice.snm = a.shift()
			if (curvoice.snm[0] == '"')
				curvoice.snm = curvoice.snm.slice(1, -1);
			break
		case "stafflines=":
			val = get_st_lines(a.shift())
			if (val == undefined)
				syntax(1, "Bad %%stafflines value")
			else if (curvoice.st != undefined)
				par_sy.staves[curvoice.st].stafflines = val
			else
				curvoice.stafflines = val
			break
		case "staffnonote=":
			val = parseInt(a.shift())
			if (isNaN(val))
				syntax(1, "Bad %%staffnonote value")
			else
				curvoice.staffnonote = val
			break
		case "staffscale=":
			val = parseFloat(a.shift())
			if (isNaN(val) || val < .3 || val > 2)
				syntax(1, "Bad %%staffscale value")
			else
				curvoice.staffscale = val
			break
		default:
			switch (item.slice(0, 4)) {
			case "treb":
			case "bass":
			case "alto":
			case "teno":
			case "perc":
				s = item
				break
			default:
				if ("GFC".indexOf(item[0]) >= 0)
					s = item
				else if (item.slice(-1) == '=')
					a.shift()
				break
			}
			break
		}
	}
	if (pos) {
		curvoice.pos = clone(curvoice.pos)
		for (item in pos)
			if (pos.hasOwnProperty(item))
				curvoice.pos[item] = pos[item]
	}

	if (s) {
		s = new_clef(s)
		if (s) {
			if (clefpit)
				s.clefpit = clefpit
			get_clef(s)
		}
	}
} // set_vp()

// set the K: / V: parameters
function set_kv_parm(a) {	// array of items
	if (!curvoice.init) {	// add the global parameters if not done yet
		curvoice.init = true
		if (info.V) {
			if (info.V['*'])
				a = info.V['*'].concat(a)
			if (info.V[curvoice.id])
				a = info.V[curvoice.id].concat(a)
		}
	}
	if (a.length != 0)
		self.set_vp(a)
} // set_kv_parm()

// memorize the K:/V: parameters
function memo_kv_parm(vid,	// voice ID (V:) / '*' (K:/V:*)
			a) {	// array of items
	if (a.length == 0)
		return
	if (!info.V)
		info.V = {}
	if (info.V[vid])
		Array.prototype.push.apply(info.V[vid], a)
	else
		info.V[vid] = a
}

// K: key signature
// return the key and the voice/clef parameters
function new_key(param) {
    var	i, clef, key_end, c, tmp,
	sf = "FCGDAEB".indexOf(param[0]) - 1,
	mode = 0,
	s = {
		type: C.KEY,
		dur:0
	}

	// set the accidentals when K: with modified accidentals
	function set_k_acc(s, sf) {
	    var i, j, n, nacc, p_acc,
		accs = [],
		pits = [],
		m_n = [],
		m_d = []

		if (sf > 0) {
			for (nacc = 0; nacc < sf; nacc++) {
				accs[nacc] = 1;			// sharp
				pits[nacc] = [26, 23, 27, 24, 21, 25, 22][nacc]
			}
		} else {
			for (nacc = 0; nacc < -sf; nacc++) {
				accs[nacc] = -1;		// flat
				pits[nacc] = [22, 25, 21, 24, 20, 23, 26][nacc]
			}
		}
		n = s.k_a_acc.length
		for (i = 0; i < n; i++) {
			p_acc = s.k_a_acc[i]
			for (j = 0; j < nacc; j++) {
				if (pits[j] == p_acc.pit) {
					accs[j] = p_acc.acc
					if (p_acc.micro_n) {
						m_n[j] = p_acc.micro_n;
						m_d[j] = p_acc.micro_d
					}
					break
				}
			}
			if (j == nacc) {
				accs[j] = p_acc.acc;
				pits[j] = p_acc.pit
				if (p_acc.micro_n) {
					m_n[j] = p_acc.micro_n;
					m_d[j] = p_acc.micro_d
				}
				nacc++
			}
		}
		for (i = 0; i < nacc; i++) {
			p_acc = s.k_a_acc[i]
			if (!p_acc)
				p_acc = s.k_a_acc[i] = {}
			p_acc.acc = accs[i];
			p_acc.pit = pits[i]
			if (m_n[i]) {
				p_acc.micro_n = m_n[i];
				p_acc.micro_d = m_d[i]
			} else {
				delete p_acc.micro_n
				delete p_acc.micro_d
				}
		}
	} // set_k_acc()

	// code of new_key()
	set_ref(s);

	// tonic
	i = 1
    if (sf < -1) {
	switch (param[0]) {
	case 'H':				// bagpipe
		switch (param[1]) {
		case 'P':
		case 'p':
			s.k_bagpipe = param[1];
			sf = param[1] == 'P' ? 0 : 2;
			i++
			break
		default:
			syntax(1, "Unknown bagpipe-like key")
			key_end = true
			break
		}
		break
	case 'P':
		syntax(1, "K:P is deprecated");
		sf = 0;
		s.k_drum = true;
		key_end = true
		break
	case 'n':				// none
		if (param.indexOf("none") == 0) {
			sf = 0;
			s.k_none = true;
			i = 4
			break
		}
		// fall thru
	default:
		return [s, info_split(param)]
	}
    }

	if (!key_end) {
		switch (param[i]) {
		case '#': sf += 7; i++; break
		case 'b': sf -= 7; i++; break
		}
		param = param.slice(i).trim()
		switch (param.slice(0, 3).toLowerCase()) {
		default:
			if (param[0] != 'm'
			 || (param[1] != ' ' && param[1] != '\t'
			  && param[1] != '\n')) {
				key_end = true
				break
			}
			// fall thru ('m')
		case "aeo":
		case "m":
		case "min": sf -= 3;
			mode = 5
			break
		case "dor": sf -= 2;
			mode = 1
			break
		case "ion":
		case "maj": break
		case "loc": sf -= 5;
			mode = 6
			break
		case "lyd": sf += 1;
			mode = 3
			break
		case "mix": sf -= 1;
			mode = 4
			break
		case "phr": sf -= 4;
			mode = 2
			break
		}
		if (!key_end)
			param = param.replace(/\w+\s*/, '')

		// [exp] accidentals
		if (param.indexOf("exp ") == 0) {
			param = param.replace(/\w+\s*/, '')
			if (!param)
				syntax(1, "No accidental after 'exp'");
			s.k_exp = true
		}
		c = param[0]
		if (c == '^' || c == '_' || c == '=') {
			s.k_a_acc = [];
			tmp = new scanBuf;
			tmp.buffer = param
			do {
				var note = parse_acc_pit(tmp)
				if (!note)
					break
				s.k_a_acc.push(note);
				c = param[tmp.index]
				while (c == ' ')
					c = param[++tmp.index]
			} while (c == '^' || c == '_' || c == '=');
			if (!s.k_exp)
				set_k_acc(s, sf)
			param = param.slice(tmp.index)
		} else if (s.k_exp && param.indexOf("none") == 0) {
			param = param.replace(/\w+\s*/, '')
		}
	}

	s.k_sf = sf;

	// set the map of the notes with accidentals
	if (s.k_a_acc) {
		s.k_map = []
		i = s.k_a_acc.length
		while (--i >= 0) {
			note = s.k_a_acc[i]
			s.k_map[(note.pit + 77) % 7] = note.acc
		}
	} else {
		s.k_map = abc2svg.keys[sf + 7]
	}
	s.k_mode = mode

	// key note as base-40
	s.k_b40 = [1,24,7,30,13,36,19, 2 ,25,8,31,14,37,20,3][sf + 7]

	return [s, info_split(param)]
}

// M: meter
function new_meter(p) {
	var	s = {
			type: C.METER,
			dur: 0,
			a_meter: []
		},
		meter = {},
		val, v,
		m1 = 0, m2,
		i = 0, j,
		wmeasure,
		in_parenth;

	set_ref(s)

	if (p.indexOf("none") == 0) {
		i = 4;				/* no meter */
		wmeasure = 1;	// simplify measure numbering and C.MREST conversion
	} else {
		wmeasure = 0
		while (i < p.length) {
			if (p[i] == '=')
				break
			switch (p[i]) {
			case 'C':
				meter.top = p[i++]
				if (!m1) {
					m1 = 4;
					m2 = 4
				}
				break
			case 'c':
			case 'o':
				meter.top = p[i++]
				if (!m1) {
					if (p[i - 1] == 'c') {
						m1 = 2;
						m2 = 4	// c = 2/4
					} else {
						m1 = 3;
						m2 = 4	// o = 3/4
					}
					switch (p[i]) {
					case '|':
						m2 /= 2	// c| = 2/2, o| = 3/2
						break
					case '.':
						m1 *= 3;
						m2 *= 2	// c. = 6/8, o. = 9/8
						break
					}
				}
				break
			case '.':
			case '|':
				m1 = 0;
				meter.top = p[i++]
				break
			case '(':
				if (p[i + 1] == '(') {	/* "M:5/4 ((2+3)/4)" */
					in_parenth = true;
					meter.top = p[i++];
					s.a_meter.push(meter);
					meter = {}
				}
				j = i + 1
				while (j < p.length) {
					if (p[j] == ')' || p[j] == '/')
						break
					j++
				}
				if (p[j] == ')' && p[j + 1] == '/') {	/* "M:5/4 (2+3)/4" */
					i++		/* remove the parenthesis */
					continue
				}			/* "M:5 (2+3)" */
				/* fall thru */
			case ')':
				in_parenth = p[i] == '(';
				meter.top = p[i++];
				s.a_meter.push(meter);
				meter = {}
				continue
			default:
				if (p[i] <= '0' || p[i] > '9') {
					syntax(1, "Bad char '$1' in M:", p[i])
					return
				}
				m2 = 2;			/* default when no bottom value */
				meter.top = p[i++]
				for (;;) {
					while (p[i] >= '0' && p[i] <= '9')
						meter.top += p[i++]
					if (p[i] == ')') {
						if (p[i + 1] != '/')
							break
						i++
					}
					if (p[i] == '/') {
						i++;
						if (p[i] <= '0' || p[i] > '9') {
							syntax(1, "Bad char '$1' in M:", p[i])
							return
						}
						meter.bot = p[i++]
						while (p[i] >= '0' && p[i] <= '9')
							meter.bot += p[i++]
						break
					}
					if (p[i] != ' ' && p[i] != '+')
						break
					if (i >= p.length
					 || p[i + 1] == '(')	/* "M:5 (2/4+3/4)" */
						break
					meter.top += p[i++]
				}
				m1 = parseInt(meter.top)
				break
			}
			if (!in_parenth) {
				if (meter.bot)
					m2 = parseInt(meter.bot);
				wmeasure += m1 * C.BLEN / m2
			}
			s.a_meter.push(meter);
			meter = {}
			while (p[i] == ' ')
				i++
			if (p[i] == '+') {
				meter.top = p[i++];
				s.a_meter.push(meter);
				meter = {}
			}
		}
	}
	if (p[i] == '=') {
		val = p.substring(++i).match(/^(\d+)\/(\d+)$/)
		if (!val) {
			syntax(1, "Bad duration '$1' in M:", p.substring(i))
			return
		}
		wmeasure = C.BLEN * val[1] / val[2]
	}
	s.wmeasure = wmeasure

	if (cfmt.writefields.indexOf('M') < 0)
		s.a_meter = []

	if (parse.state != 3) {
		info.M = p;
		glovar.meter = s
		if (parse.state >= 1) {

			/* in the tune header, change the unit note length */
			if (!glovar.ulen) {
				if (wmeasure <= 1
				 || wmeasure >= C.BLEN * 3 / 4)
					glovar.ulen = C.BLEN / 8
				else
					glovar.ulen = C.BLEN / 16
			}
			for (v = 0; v < voice_tb.length; v++) {
				voice_tb[v].meter = s;
				voice_tb[v].wmeasure = wmeasure
			}
		}
	} else {
		curvoice.wmeasure = wmeasure
		if (is_voice_sig()) {
			curvoice.meter = s;
			reset_gen()
		} else {
			sym_link(s)
		}
	}
}

/* Q: tempo */
function new_tempo(text) {
	var	i = 0, j, c, nd, tmp,
		s = {
			type: C.TEMPO,
			dur: 0
		}

	set_ref(s)

	if (cfmt.writefields.indexOf('Q') < 0)
		s.del = true			// don't display

	/* string before */
	if (text[0] == '"') {
		i = text.indexOf('"', 1)
		if (i < 0) {
			syntax(1, "Unterminated string in Q:")
			return
		}
		s.tempo_str1 = text.slice(1, i);
		i++
		while (text[i] == ' ')
			i++
	}

	/* beat */
	tmp = new scanBuf;
	tmp.buffer = text;
	tmp.index = i
	while (1) {
//		c = tmp.char()
		c = text[tmp.index]
		if (c == undefined || c <= '0' || c > '9')
			break
		nd = parse_dur(tmp)
		if (!s.tempo_notes)
			s.tempo_notes = []
		s.tempo_notes.push(C.BLEN * nd[0] / nd[1])
		while (1) {
//			c = tmp.char()
			c = text[tmp.index]
			if (c != ' ')
				break
			tmp.index++
		}
	}

	/* tempo value */
	if (c == '=') {
		c = text[++tmp.index]
		while (c == ' ')
			c = text[++tmp.index];
		i = tmp.index
		if (c == 'c' && text[i + 1] == 'a'
		 && text[i + 2] == '.' && text[i + 3] == ' ') {
			s.tempo_ca = 'ca. ';
			tmp.index += 4;
//			c = text[tmp.index]
		}
		if (text[tmp.index + 1] != '/') {
			s.tempo = tmp.get_int()
		} else {
			nd = parse_dur(tmp);
			s.new_beat = C.BLEN * nd[0] / nd[1]
		}
		c = text[tmp.index]
		while (c == ' ')
			c = text[++tmp.index]
	}

	/* string after */
	if (c == '"') {
		tmp.index++;
		i = text.indexOf('"', tmp.index + 1)
		if (i < 0) {
			syntax(1, "Unterminated string in Q:")
			return
		}
		s.tempo_str2 = text.slice(tmp.index, i)
	}

	if (parse.state != 3) {
		if (parse.state == 1) {			// tune header
			info.Q = text;
			glovar.tempo = s
			return
		}
		goto_tune()
	}
	if (curvoice.v == par_sy.top_voice) {	/* tempo only for first voice */
		sym_link(s)
		if (glovar.tempo && curvoice.time == 0)
			glovar.tempo.del = true
	}
}

// treat the information fields which may embedded
function do_info(info_type, text) {
	var s, d1, d2, a, vid

	switch (info_type) {

	// info fields in any state
	case 'I':
		self.do_pscom(text)
		break
	case 'L':
//fixme: ??
		if (parse.state == 2)
			goto_tune();
		a = text.match(/^1\/(\d+)(=(\d+)\/(\d+))?$/)
		if (a) {
			d1 = Number(a[1])
			if (!d1 || (d1 & (d1 - 1)) != 0)
				break
			d1 = C.BLEN / d1
			if (a[2]) {
				d2 = Number(a[4])
				if (!d2 || (d2 & (d2 - 1)) != 0) {
					d2 = 0
					break
				}
				d2 = Number(a[3]) / d2 * C.BLEN
			} else {
				d2 = d1
			}
		} else if (text == "auto") {
			d1 = d2 = -1
		}
		if (!d2) {
			syntax(1, "Bad L: value")
			break
		}
		if (parse.state < 2) {
			glovar.ulen = d1
		} else {
			curvoice.ulen = d1;
			curvoice.dur_fact = d2 / d1
		}
		break
	case 'M':
		new_meter(text)
		break
	case 'U':
		set_user(text)
		break

	// fields in tune header or tune body
	case 'P':
		if (parse.state == 0)
			break
		if (parse.state == 1) {
			info.P = text
			break
		}
		if (parse.state == 2)
			goto_tune()
		if (cfmt.writefields.indexOf(info_type) < 0)
			break
		s = {
			type: C.PART,
			text: text,
			dur: 0
		}

		/*
		 * If not in the main voice, then,
		 * if the voices are synchronized and no P: yet in the main voice,
		 * the misplaced P: goes into the main voice.
		 */
		var p_voice = voice_tb[par_sy.top_voice]
		if (curvoice.v != p_voice.v) {
			if (curvoice.time != p_voice.time)
				break
			if (p_voice.last_sym && p_voice.last_sym.type == C.PART)
				break		// already a P:
			var voice_sav = curvoice;
			curvoice = p_voice;
			sym_link(s);
			curvoice = voice_sav
		} else {
			sym_link(s)
		}
		break
	case 'Q':
		if (parse.state == 0)
			break
		new_tempo(text)
		break
	case 'V':
		get_voice(text)
		break

	// key signature at end of tune header on in tune body
	case 'K':
		if (parse.state == 0)
			break
		get_key(text)
		break

	// info in any state
	case 'N':
	case 'R':
		if (!info[info_type])
			info[info_type] = text
		else
			info[info_type] += '\n' + text
		break
	case 'r':
		if (!user.keep_remark
		 || parse.state != 3)
			break
		s = {
			type: C.REMARK,
			text: text,
			dur: 0
		}
		sym_link(s)
		break
	default:
		syntax(0, "'$1:' line ignored", info_type)
		break
	}
}

// music line parsing functions

/* -- adjust the duration and time of symbols in a measure when L:auto -- */
function adjust_dur(s) {
    var	s2, time, auto_time, i, fac;

	/* search the start of the measure */
	s2 = curvoice.last_sym
	if (!s2)
		return;

	/* the bar time is correct if there are multi-rests */
	if (s2.type == C.MREST
	 || s2.type == C.BAR)			/* in second voice */
		return
	while (s2.type != C.BAR && s2.prev)
		s2 = s2.prev;
	time = s2.time;
	auto_time = curvoice.time - time
	fac = curvoice.wmeasure / auto_time

	/* remove the invisible rest at start of tune */
	if (time == 0) {
		while (s2 && !s2.dur)
			s2 = s2.next
		if (s2 && s2.type == C.REST
		 && s2.invis) {
			time += s2.dur * fac
			if (s2.prev)
				s2.prev.next = s2.next
			else
				curvoice.sym = s2.next
			if (s2.next)
				s2.next.prev = s2.prev;
			s2 = s2.next
		}
	}
	if (curvoice.wmeasure == auto_time)
		return				/* already good duration */

	for ( ; s2; s2 = s2.next) {
		s2.time = time
		if (!s2.dur || s2.grace)
			continue
		s2.dur *= fac;
		s2.dur_orig *= fac;
		time += s2.dur
		if (s2.type != C.NOTE && s2.type != C.REST)
			continue
		for (i = 0; i <= s2.nhd; i++)
			s2.notes[i].dur *= fac
	}
	curvoice.time = s.time = time
}

/* -- parse a bar -- */
function new_bar() {
	var	s2, c, bar_type,
		line = parse.line,
		s = {
			type: C.BAR,
			fname: parse.fname,
			istart: parse.bol + line.index,
			dur: 0,
			multi: 0		// needed for decorations
		}

	if (vover && vover.bar)			// end of voice overlay
		get_vover('|')
	if (glovar.new_nbar) {			// %%setbarnb
		s.bar_num = glovar.new_nbar;
		glovar.new_nbar = 0
	}
	bar_type = line.char()
	while (1) {
		c = line.next_char()
		switch (c) {
		case '|':
		case '[':
		case ']':
		case ':':
			bar_type += c
			continue
		}
		break
	}
	if (bar_type[0] == ':') {
		if (bar_type.length == 1) {	// ":" alone
			bar_type = '|';
			s.bar_dotted = true
		} else {
			s.rbstop = 2		// right repeat with end
		}
	}

	// set the guitar chord and the decorations
	if (a_gch)
		self.gch_build(s)
	if (a_dcn) {
		deco_cnv(a_dcn, s);
		a_dcn = null
	}

	// set the start/stop of ottava
	if (parse.ottava.length) {
		s2 = s
		if (curvoice.cst != curvoice.st) {	// if staff change
			s2 = {
				type: C.SPACE,		// put the decoration on a ...
				fname: parse.fname,
				istart: parse.bol + line.index,
				dur: 0,
				multi: 0,
				invis: true,
				width: 1		// .. small space
			}
			sym_link(s2)
		}
		s2.ottava = parse.ottava
		parse.ottava = []
	}

	/* if the last element is '[', it may start
	 * a chord or an embedded header */
	switch (bar_type.slice(-1)) {
	case '[':
		if (/[0-9" ]/.test(c))		// "
			break
		bar_type = bar_type.slice(0, -1);
		line.index--;
		c = '['
		break
	case ':':				// left repeat
		s.rbstop = 2			// with bracket end
		break
	}

	// check if repeat bar
	if (c > '0' && c <= '9') {
		s.text = c
		while (1) {
			c = line.next_char()
			if ("0123456789,.-".indexOf(c) < 0)
				break
			s.text += c
		}
		s.rbstop = 2;
		s.rbstart = 2
	} else if (c == '"' && bar_type.slice(-1) == '[') {
		s.text = ""
		while (1) {
			c = line.next_char()
			if (!c) {
				syntax(1, "No end of repeat string")
				return
			}
			if (c == '"') {
				line.index++
				break
			}
			if (c == '\\') {
				s.text += c;
				c = line.next_char()
			}
			s.text += c
		}
		s.rbstop = 2;
		s.rbstart = 2
	}

	// ']' as the first character indicates a repeat bar stop
	if (bar_type[0] == ']') {
		s.rbstop = 2			// with end
		if (bar_type.length != 1)
			bar_type = bar_type.slice(1)
		else
			s.invis = true
	}

	s.iend = parse.bol + line.index

	if (s.rbstart
	 && curvoice.norepbra
	 && !curvoice.second)
		s.norepbra = true

	if (curvoice.ulen < 0)			// L:auto
		adjust_dur(s);

	s2 = curvoice.last_sym
	if (s2 && s2.time == curvoice.time) {
		if (bar_type == "["
			|| bar_type == "|:") {

			// search if a previous bar at this time
			do {
				if (s2.type == C.BAR)
					break
				if (w_tb[s2.type]) // symbol with a width
					break
				s2 = s2.prev
			} while (s2)
			if (s2 && s2.type == C.BAR) {
//		&& !s2.a_gch && !s2.a_dd
//		&& !s.a_gch && !s.a_dd) {

				// remove the invisible repeat bars
				// when no shift is needed
				if (bar_type == "["
				 && !s2.text
				 && (curvoice.st == 0
				  || (par_sy.staves[curvoice.st - 1].flags & STOP_BAR)
				  || s.norepbra)) {
					if (s.text)
						s2.text = s.text
					if (s.a_gch)
						s2.a_gch = s.a_gch
					if (s.norepbra)
						s2.norepbra = s.norepbra
					if (s.rbstart)
						s2.rbstart = s.rbstart
					if (s.rbstop)
						s2.rbstop = s.rbstop
//--fixme: pb when on next line and empty staff above
					return
				}

				// merge back-to-back repeat bars
				if (s2.st == curvoice.st
				 && bar_type == "|:") {
					if (s2.bar_type == ":|") {
						s2.bar_type = "::";
						s2.rbstop = 2
						return
					}
					if (s2.bar_type == "||") {
						s2.bar_type = "||:";
						s2.rbstop = 2
						return
					}
				}
			}
		}
	}

	/* set some flags */
	switch (bar_type) {
	case "[":
		s.rbstop = 2
	case "[]":
	case "[|]":
		s.invis = true;
		bar_type = "[]"
		break
	case ":|:":
	case ":||:":
		bar_type = "::"
		break
	case "||":
		if (!cfmt.rbdbstop)
			break
	case "[|":
	case "|]":
		s.rbstop = 2
		break
	}
	s.bar_type = bar_type
	if (!curvoice.lyric_restart)
		curvoice.lyric_restart = s
	if (!curvoice.sym_restart)
		curvoice.sym_restart = s

	sym_link(s);

	s.st = curvoice.st			/* original staff */

	/* if repeat bar and shift, add a repeat bar */
	if (s.rbstart
	 && !curvoice.norepbra
	 && curvoice.st > 0
	 && !(par_sy.staves[curvoice.st - 1].flags & STOP_BAR)) {
		s2 = {
			type: C.BAR,
			fname: s.fname,
			istart: s.istart,
			iend: s.iend,
			bar_type: "[",
			multi: 0,
			invis: true,
			text: s.text,
			rbstart: 2
		}
		sym_link(s2);
		s2.st = curvoice.st
		delete s.text;
		s.rbstart = 0
	}
}

// parse %%staves / %%score
// return an array of [vid, flags] / null
function parse_staves(p) {
	var	v, vid,
		a_vf = [],
		err = false,
		flags = 0,
		brace = 0,
		bracket = 0,
		parenth = 0,
		flags_st = 0,
	e,
	a = p.match(/\w+|[^\s]/g)

	if (!a) {
		syntax(1, errs.bad_val, "%%staves")
		return // null
	}
	while (1) {
		e = a.shift()
		if (!e)
			break
		switch (e) {
		case '[':
			if (parenth || brace + bracket >= 2) {
				syntax(1, errs.misplaced, '[');
				err = true
				break
			}
			flags |= brace + bracket == 0 ? OPEN_BRACKET : OPEN_BRACKET2;
			bracket++;
			flags_st <<= 8;
			flags_st |= OPEN_BRACKET
			break
		case '{':
			if (parenth || brace || bracket >= 2) {
				syntax(1, errs.misplaced, '{');
				err = true
				break
			}
			flags |= !bracket ? OPEN_BRACE : OPEN_BRACE2;
			brace++;
			flags_st <<= 8;
			flags_st |= OPEN_BRACE
			break
		case '(':
			if (parenth) {
				syntax(1, errs.misplaced, '(');
				err = true
				break
			}
			flags |= OPEN_PARENTH;
			parenth++;
			flags_st <<= 8;
			flags_st |= OPEN_PARENTH
			break
		case '*':
			if (brace && !parenth && !(flags & (OPEN_BRACE | OPEN_BRACE2)))
				flags |= FL_VOICE
			break
		case '+':
			flags |= MASTER_VOICE
			break
		default:
			if (!/\w/.test(e)) {
				syntax(1, "Bad voice ID in %%staves");
				err = true
				break
			}

			/* get / create the voice in the voice table */
			vid = e
			while (1) {
				e = a.shift()
				if (!e)
					break
				switch (e) {
				case ']':
					if (!(flags_st & OPEN_BRACKET)) {
						syntax(1, errs.misplaced, ']');
						err = true
						break
					}
					bracket--;
					flags |= brace + bracket == 0 ?
							CLOSE_BRACKET :
							CLOSE_BRACKET2;
					flags_st >>= 8
					continue
				case '}':
					if (!(flags_st & OPEN_BRACE)) {
						syntax(1, errs.misplaced, '}');
						err = true
						break
					}
					brace--;
					flags |= !bracket ?
							CLOSE_BRACE :
							CLOSE_BRACE2;
					flags &= ~FL_VOICE;
					flags_st >>= 8
					continue
				case ')':
					if (!(flags_st & OPEN_PARENTH)) {
						syntax(1, errs.misplaced, ')');
						err = true
						break
					}
					parenth--;
					flags |= CLOSE_PARENTH;
					flags_st >>= 8
					continue
				case '|':
					flags |= STOP_BAR
					continue
				}
				break
			}
			a_vf.push([vid, flags]);
			flags = 0
			if (!e)
				break
			a.unshift(e)
			break
		}
	}
	if (flags_st != 0) {
		syntax(1, "'}', ')' or ']' missing in %%staves");
		err = true
	}
	if (err || a_vf.length == 0)
		return //null
	return a_vf
}

// split an info string
function info_split(text) {
	if (!text)
		return []
    var	a = text.match(/=?[^\s"=]+=?|".+?"/g)	// "
	if (!a) {
//fixme: bad error text
		syntax(1, "Unterminated string")
		return []
	}
	return a
}

// parse a duration and return [numerator, denominator]
// 'line' is not always 'parse.line'
var reg_dur = /(\d*)(\/*)(\d*)/g		/* (stop comment) */

function parse_dur(line) {
	var res, num, den;

	reg_dur.lastIndex = line.index;
	res = reg_dur.exec(line.buffer)
	if (!res[0])
		return [1, 1];
	num = res[1] || 1;
	den = res[3] || 1
	if (!res[3])
		den *= 1 << res[2].length;
	line.index = reg_dur.lastIndex
	return [num, den]
}

// parse the note accidental and pitch
function parse_acc_pit(line) {
	var	note, acc, micro_n, micro_d, pit, nd,
		c = line.char()

	// optional accidental
	switch (c) {
	case '^':
		c = line.next_char()
		if (c == '^') {
			acc = 2;
			c = line.next_char()
		} else {
			acc = 1
		}
		break
	case '=':
		acc = 3;
		c = line.next_char()
		break
	case '_':
		c = line.next_char()
		if (c == '_') {
			acc = -2;
			c = line.next_char()
		} else {
			acc = -1
		}
		break
	}

	/* look for microtone value */
	if (acc && acc != 3 && (c >= '1' && c <= '9')
	 || c == '/') {				// compatibility
		nd = parse_dur(line);
		micro_n = nd[0];
		micro_d = nd[1]
		if (micro_d == 1)
			micro_d = curvoice ? curvoice.uscale : 1
		else
			micro_d *= 2;	// 1/2 tone fraction -> tone fraction
		c = line.char()
	}

	/* get the pitch */
	pit = ntb.indexOf(c) + 16;
	c = line.next_char()
	if (pit < 16) {
		syntax(1, "'$1' is not a note", line.buffer[line.index - 1])
		return //undefined
	}

	// octave
	while (c == "'") {
		pit += 7;
		c = line.next_char()
	}
	while (c == ',') {
		pit -= 7;
		c = line.next_char()
	}
	note = {
		pit: pit,
		shhd: 0,
		shac: 0
	}
	if (acc) {
		note.acc = acc
		if (micro_n) {
			note.micro_n = micro_n;
			note.micro_d = micro_d
		}
	}
	return note
}

// convert a note pitch to ABC text
function note2abc(note) {
    var	i,
	abc = 'abcdefg'[(note.pit + 77) % 7]

//fixme: treat microtone
	if (note.acc)
		abc = ['__', '_', '', '^', '^^', '='][note.acc + 2] + abc
	for (i = note.pit; i >= 30; i -= 7)	// down to 'c'
		abc += "'"
	for (i = note.pit; i < 23; i += 7)	// up to 'C'
		abc += ","
	return abc
}

/* set the mapping of a note */
function set_map(note) {
    var	delta,
	map = maps[curvoice.map],	// never null
	nn = note2abc(note)

	if (!map[nn]) {
		nn = 'octave,' + nn.replace(/[',]/g, '')	// octave '
		if (!map[nn]) {
			delta = abc2svg.p_b40[(note.pit + 77) % 7] -
					curvoice.ckey.k_b40
			nn = 'key,' +			// 'key,'
				'abcdefg'[abc2svg.b40_p[delta + 2]]
			if (!map[nn]) {
				nn = 'all'		// 'all'
				if (!map[nn])
					return
			}
		}
	}
	note.map = map[nn]
	if (note.map[1]) {
		note.pit = note.map[1].pit;		// print/play
		note.acc = note.map[1].acc
	}
}

/* -- parse note or rest with pitch and length -- */
// 'line' is not always 'parse.line'
function parse_basic_note(line, ulen) {
	var	nd,
		note = parse_acc_pit(line)

	if (!note)
		return //null

	// duration
	if (line.char() == '0') {		// compatibility
		parse.stemless = true;
		line.index++
	}
	nd = parse_dur(line);
	note.dur = ulen * nd[0] / nd[1]
	return note
}

function parse_vpos() {
	var	line = parse.line,
		ty = 0

	if (line.buffer[line.index - 1] == '.' && !a_dcn)
		ty = C.SL_DOTTED
	switch (line.next_char()) {
	case "'":
		line.index++
		return ty + C.SL_ABOVE
	case ",":
		line.index++
		return ty + C.SL_BELOW
	}
	return ty + C.SL_AUTO
}

// on end of slur, create the slur
function slur_add(enote, e_is_note) {
    var	i, s, sl, snote, s_is_note

	// go back and find the last start of slur
	for (i = curvoice.sls.length; --i >= 0; ) {
		sl = curvoice.sls[i]
		snote = sl.note
		s_is_note = sl.is_note
		delete sl.is_note

		// the slur must not start and stop on a same symbol
		if (snote.s != enote.s) {
			sl.note = enote
			if (e_is_note)
				sl.is_note = e_is_note
			s = s_is_note ? snote : snote.s
			if (!s.sls)
				s.sls = [];
			s.sls.push(sl)
			curvoice.sls.splice(i, 1)

			// set a flag on the start symbol if slur from a note
			if (s_is_note)
				snote.s.sl1 = true

			// set a flag if the slur starts on a grace note
			if (sl.grace)
				sl.grace.sl1 = true
			return
		}
	}

	if (enote.grace) {
		error(1, enote.s, errs.bad_slur_end)
		return
	}

	// the lack of a starting slur may be due to a repeat
	for (s = enote.s.prev; s; s = s.prev) {
		if (s.type == C.BAR
		 && s.bar_type[0] == ':'
		 && s.text) {
			if (!s.sls)
				s.sls = [];
			s.sls.push({
				note: enote,
//fixme: should go back to the bar "|1" and find the slur type...
				ty: C.SL_AUTO
			})
			if (e_is_note)
				s.sls[s.sls.length - 1].is_note = e_is_note
			return
		}
	}
	syntax(1, "Lack of starting slur")
}

// (possible hook)
Abc.prototype.new_note = function(grace, sls) {
    var	note, s, in_chord, c, dcn, type, tie_s, not2,
		i, n, s2, nd, res, num, dur,
		sl1 = [],
		line = parse.line,
		a_dcn_sav = a_dcn;	// save parsed decoration names

	if (!grace) {
		tie_s = curvoice.tie_s
		if (tie_s)		// tie from previous note / grace note
			curvoice.tie_s = null
	}

	a_dcn = null;
	parse.stemless = false;
	s = {
		type: C.NOTE,
		fname: parse.fname,
		stem: 0,
		multi: 0,
		nhd: 0,
		xmx: 0
	}
	s.istart = parse.bol + line.index

	if (curvoice.color)
		s.color = curvoice.color

	if (grace) {
		s.grace = true
	} else {
		if (a_gch)
			self.gch_build(s)
		if (parse.repeat_n) {
			s.repeat_n = parse.repeat_n;
			s.repeat_k = parse.repeat_k;
			parse.repeat_n = 0
		}
	}
	c = line.char()
	switch (c) {
	case 'X':
		s.invis = true
	case 'Z':
		s.type = C.MREST;
		c = line.next_char()
		s.nmes = (c > '0' && c <= '9') ? line.get_int() : 1;
		s.dur = curvoice.wmeasure * s.nmes

		// ignore if in second voice
		if (curvoice.second) {
			curvoice.time += s.dur
			return //null
		}

		// convert 'Z'/'Z1' to a whole measure rest
		if (s.nmes == 1) {
			s.type = C.REST;
			s.dur_orig = s.dur;
			s.notes = [{
				pit: 18,
				dur: s.dur
			}]
		}
		break
	case 'y':
		s.type = C.SPACE;
		s.invis = true;
		s.dur = 0;
		c = line.next_char()
		if (c >= '0' && c <= '9')
			s.width = line.get_int()
		else
			s.width = 10
		if (tie_s)
			curvoice.tie_s = tie_s
		break
	case 'x':
		s.invis = true
	case 'z':
		s.type = C.REST;
		line.index++;
		nd = parse_dur(line);
		s.dur_orig = ((curvoice.ulen < 0) ?
					C.BLEN :
					curvoice.ulen) * nd[0] / nd[1];
		s.dur = s.dur_orig * curvoice.dur_fact;
		s.notes = [{
			pit: 18,
			dur: s.dur_orig
		}]
		break
	case '[':			// chord
		in_chord = true;
		c = line.next_char()
		// fall thru
	default:			// accidental, chord, note
		if (curvoice.uscale)
			s.uscale = curvoice.uscale;
		s.notes = []

		// loop on the chord
		while (1) {

			// when in chord, get the slurs and decorations
			if (in_chord) {
				while (1) {
					if (!c)
						break
					i = c.charCodeAt(0);
					if (i >= 128) {
						syntax(1, errs.not_ascii)
						return //null
					}
					type = char_tb[i]
					switch (type[0]) {
					case '(':
						sl1.push(parse_vpos());
						c = line.char()
						continue
					case '!':
						if (!a_dcn)
							a_dcn = []
						if (type.length > 1) {
							a_dcn.push(type.slice(1, -1))
						} else {
							dcn = ""
							while (1) {
								c = line.next_char()
								if (!c) {
									syntax(1, "No end of decoration")
									return //null
								}
								if (c == '!')
									break
								dcn += c
							}
							a_dcn.push(dcn)
						}
						c = line.next_char()
						continue
					}
					break
				}
			}
			note = parse_basic_note(line,
					s.grace ? C.BLEN / 4 :
					curvoice.ulen < 0 ?
						C.BLEN :
						curvoice.ulen)
			if (!note)
				return //null

			// transpose
			if (curvoice.octave)
				note.pit += curvoice.octave * 7

			if (curvoice.map
			 && maps[curvoice.map])
				set_map(note)

			// ending ties
			if (tie_s) {		// if some ties are ending here
				if (tie_s.type != C.GRACE) {
				    for (i = 0; i <= tie_s.nhd; i++) {
					if (!tie_s.notes[i].tie_ty
					 || tie_s.notes[i].tie_n)
						continue
					switch (tie_s.notes[i].pit - note.pit) {
					default:
						continue
					case 1:
					case -1:
						if (tie_s.notes[i].acc == note.acc)
							continue
					case 0:
						tie_s.notes[i].tie_n = note
						note.s = s
						tie_s.notes[i].s = tie_s
						break
					}
					break
				    }
				} else {
				    for (s2 = tie_s.extra; s2; s2 = s2.next) {
					if (!s2.notes[0].tie_ty)
						continue
					if (s2.notes[0].pit == note.pit) {
						s2.tie_s = s
						s2.notes[0].tie_n = note
						note.s = s
						s2.notes[0].s = s2
						break
					}
				    }
				}
				tie_s.tie_s = s
			}

			// starting slurs
			if (sl1.length) {
				while (1) {
					i = sl1.shift()
					if (!i)
						break
					curvoice.sls.push({
						is_note: true,
						note: note,
						ty: i
					})
				}
				note.s = s;		// link the note to the chord
			}
			if (a_dcn) {
				note.a_dcn = a_dcn;
				a_dcn = null
			}
			s.notes.push(note)
			if (!in_chord)
				break

			// in chord: get the ending slurs and the ties
			c = line.char()
			while (1) {
				switch (c) {
				case ')':
					note.s = s
					slur_add(note, true)
					c = line.next_char()
					continue
				case '-':
					note.tie_ty = parse_vpos()
					curvoice.tie_s = s
					c = line.char()
					continue
				case '.':
					c = line.next_char()
					switch (c) {
					case '-':
					case '(':
						continue
					}
					syntax(1, "Misplaced dot")
					break
				}
				break
			}
			if (c == ']') {
				line.index++;

				// adjust the chord duration
				nd = parse_dur(line);
				s.nhd = s.notes.length - 1
				for (i = 0; i <= s.nhd ; i++) {
					note = s.notes[i];
					note.dur = note.dur * nd[0] / nd[1]
				}
				break
			}
		}

		// handle the starting slurs
		if (sls.length) {
			while (1) {
				i = sls.shift()
				if (!i)
					break
				s.notes[0].s = s
				curvoice.sls.push({
					note: s.notes[0],
					ty: i
				})
				if (grace)
					curvoice.sls[curvoice.sls.length - 1].grace =
										grace
			}
		}

		// the duration of the chord is the duration of the 1st note
		s.dur_orig = s.notes[0].dur;
		s.dur = s.notes[0].dur * curvoice.dur_fact
	}
	if (s.grace && s.type != C.NOTE) {
		syntax(1, "Not a note in grace note sequence")
		return //null
	}

	if (s.notes) {				// if note or rest
		if (!grace) {
			switch (curvoice.pos.stm) {
			case C.SL_ABOVE: s.stem = 1; break
			case C.SL_BELOW: s.stem = -1; break
			case C.SL_HIDDEN: s.stemless = true; break
			}

			// adjust the symbol duration
			num = curvoice.brk_rhythm
			if (num) {
				curvoice.brk_rhythm = 0;
				s2 = curvoice.last_note
				if (num > 0) {
					n = num * 2 - 1;
					s.dur = s.dur * n / num;
					s.dur_orig = s.dur_orig * n / num
					for (i = 0; i <= s.nhd; i++)
						s.notes[i].dur =
							s.notes[i].dur * n / num;
					s2.dur /= num;
					s2.dur_orig /= num
					for (i = 0; i <= s2.nhd; i++)
						s2.notes[i].dur /= num
				} else {
					num = -num;
					n = num * 2 - 1;
					s.dur /= num;
					s.dur_orig /= num
					for (i = 0; i <= s.nhd; i++)
						s.notes[i].dur /= num;
					s2.dur = s2.dur * n / num;
					s2.dur_orig = s2.dur_orig * n / num
					for (i = 0; i <= s2.nhd; i++)
						s2.notes[i].dur =
							s2.notes[i].dur * n / num
				}
				curvoice.time = s2.time + s2.dur;

				// adjust the time of the grace notes, bars...
				for (s2 = s2.next; s2; s2 = s2.next)
					s2.time = curvoice.time
			}
		} else {		/* grace note - adjust its duration */
			var div = curvoice.ckey.k_bagpipe ? 8 : 4

			for (i = 0; i <= s.nhd; i++)
				s.notes[i].dur /= div;
			s.dur /= div;
			s.dur_orig /= div
			if (grace.stem)
				s.stem = grace.stem
		}

		curvoice.last_note = s
	}

	sym_link(s)

	if (cfmt.shiftunison)
		s.shiftunison = cfmt.shiftunison
	if (!grace) {
		if (!curvoice.lyric_restart)
			curvoice.lyric_restart = s
		if (!curvoice.sym_restart)
			curvoice.sym_restart = s
	}

	if (a_dcn_sav)
		deco_cnv(a_dcn_sav, s, s.prev)
	if (parse.ottava.length) {
		s.ottava = parse.ottava
		parse.ottava = []
	}
	if (parse.stemless)
		s.stemless = true
	s.iend = parse.bol + line.index
	return s
}

// adjust the duration of the elements in a tuplet
function tp_adj(s, fact) {
    var	tim = s.time

	curvoice.time = s.time + (curvoice.time - s.time) * fact
	while (1) {
//fixme: tuplets in grace notes?
		s.in_tuplet = true
		if (!s.grace) {
			s.time = tim
			if (s.dur) {
				s.dur = Math.round(s.dur * fact)
				tim += s.dur
			}
		}
		if (!s.next) {
			s.dur = curvoice.time - s.time
			if (s.tpe)
				s.tpe++
			else
				s.tpe = 1
			break
		}
		s = s.next
	}
} // tp_adj()

// characters in the music line (ASCII only)
var nil = ["0"],
    char_tb = [
	nil, nil, nil, nil,		/* 00 - .. */
	nil, nil, nil, nil,
	nil, " ", "\n", nil,		/* . \t \n . */
	nil, nil, nil, nil,
	nil, nil, nil, nil,
	nil, nil, nil, nil,
	nil, nil, nil, nil,
	nil, nil, nil, nil,		/* .. - 1f */
	" ", "!", '"', "i",		/* (sp) ! " # */
	"\n", nil, "&", nil,		/* $ % & ' */
	"(", ")", "i", nil,		/* ( ) * + */
	nil, "-", "!dot!", nil,		/* , - . / */
	nil, nil, nil, nil, 		/* 0 1 2 3 */
	nil, nil, nil, nil, 		/* 4 5 6 7 */
	nil, nil, "|", "i",		/* 8 9 : ; */
	"<", "n", "<", "i",		/* < = > ? */
	"i", "n", "n", "n",		/* @ A B C */
	"n", "n", "n", "n", 		/* D E F G */
	"!fermata!", "d", "d", "d",	/* H I J K */
	"!emphasis!", "!lowermordent!",
		"d", "!coda!",		/* L M N O */
	"!uppermordent!", "d",
		"d", "!segno!",		/* P Q R S */
	"!trill!", "d", "d", "d",	/* T U V W */
	"n", "d", "n", "[",		/* X Y Z [ */
	"\\","|", "n", "n",		/* \ ] ^ _ */
	"i", "n", "n", "n",	 	/* ` a b c */
	"n", "n", "n", "n",	 	/* d e f g */
	"d", "d", "d", "d",		/* h i j k */
	"d", "d", "d", "d",		/* l m n o */
	"d", "d", "d", "d",		/* p q r s */
	"d", "!upbow!",
		"!downbow!", "d",	/* t u v w */
	"n", "n", "n", "{",		/* x y z { */
	"|", "}", "!gmark!", nil,	/* | } ~ (del) */
],
    ottava = {"8va(":1, "8va)":0, "15ma(":2, "15ma)":0,
	"8vb(":-1, "8vb)":0, "15mb(":-2, "15mb)":0}

function parse_music_line() {
	var	grace, last_note_sav, a_dcn_sav, no_eol, s, tps,
		tp = [],
		tpn = -1,
		sls = [],
		line = parse.line

	// check if a transposing macro matches a source sequence
	// if yes return the base note
	function check_mac(m) {
	    var	i, j, b

		for (i = 1, j = line.index + 1; i < m.length; i++, j++) {
			if (m[i] == line.buffer[j])
				continue
			if (m[i] != 'n')		// search the base note
				return //null
			b = ntb.indexOf(line.buffer[j])
			if (b < 0)
				return //null
			while (line.buffer[j + 1] == "'") {
				b += 7;
				j++
			}
			while (line.buffer[j + 1] == ',') {
				b -= 7;
				j++
			}
		}
		line.index = j
		return b
	}

	// expand a transposing macro
	function expand(m, b) {
	    var	c, d,
		r = "",				// result
		n = m.length

		for (i = 0; i < n; i++) {
			c = m[i]
			if (c >= 'h' && c <= 'z') {
				d = b + c.charCodeAt(0) - 'n'.charCodeAt(0)
				c = ""
				while (d < 0) {
					d += 7;
					c += ','
				}
				while (d > 14) {
					d -= 7;
					c += "'"
				}
				r += ntb[d] + c
			} else {
				r += c
			}
		}
		return r
	} // expand()

	// parse a macro
	function parse_mac(m, b) {
	    var	seq,
		line_sav = line,
		istart_sav = parse.istart;

		parse.line = line = new scanBuf;
		parse.istart += line_sav.index;
		line.buffer = b ? expand(m, b) : m;
		parse_seq(true);
		parse.line = line = line_sav;
		parse.istart = istart_sav
	}

	// parse a music sequence
	function parse_seq(in_mac) {
	    var	c, idx, type, k, s, dcn, i, n, text

		while (1) {
			c = line.char()
			if (!c)
				break

			// special case for '.' (dot)
			if (c == '.') {
				switch (line.buffer[line.index + 1]) {
				case '(':
				case '-':
				case '|':
					c = line.next_char()
					break
				}
			}

			idx = c.charCodeAt(0);
			if (idx >= 128) {
				syntax(1, errs.not_ascii);
				line.index++
				break
			}

			// check if start of a macro
			if (!in_mac && maci[idx]) {
				n = 0
				for (k in mac) {
					if (!mac.hasOwnProperty(k)
					 || k[0] != c)
						continue
					if (k.indexOf('n') < 0) {
						if (line.buffer.indexOf(k, line.index)
								!= line.index)
							continue
						line.index += k.length
					} else {
						n = check_mac(k)
						if (!n)
							continue
					}
					parse_mac(mac[k], n);
					n = 1
					break
				}
				if (n)
					continue
			}

			type = char_tb[idx]
			switch (type[0]) {
			case ' ':			// beam break
				s = curvoice.last_note
				if (s) {
					s.beam_end = true
					if (grace)
						grace.gr_shift = true
				}
				break
			case '\n':			// line break
				if (cfmt.barsperstaff)
					break
				if (par_sy.voices[curvoice.v]
				 && par_sy.voices[curvoice.v].range == 0
				 && curvoice.last_sym)
					curvoice.last_sym.eoln = true
				break
			case '&':			// voice overlay
				if (grace) {
					syntax(1, errs.bad_char, c)
					break
				}
				c = line.next_char()
				if (c == ')') {
					get_vover(')')
					break
				}
				get_vover('&')
				continue
			case '(':			// slur start - tuplet - vover
				c = line.next_char()
				if (c > '0' && c <= '9') {	// tuplet
				    var	pplet = line.get_int(),
					qplet = qplet_tb[pplet],
					rplet = pplet,
					c = line.char()

					if (c == ':') {
						c = line.next_char()
						if (c > '0' && c <= '9') {
							qplet = line.get_int();
							c = line.char()
						}
						if (c == ':') {
							c = line.next_char()
							if (c > '0' && c <= '9') {
								rplet = line.get_int();
								c = line.char()
							} else {
								syntax(1, "Invalid 'r' in tuplet")
								continue
							}
						}
					}
					if (qplet == 0 || qplet == undefined)
						qplet = (curvoice.wmeasure % 9) == 0 ?
									3 : 2;
					if (tpn < 0)
						tpn = tp.length	// new tuplet
					tp.push({
						p: pplet,
						q: qplet,
						r: rplet,
						ro: rplet,
						f: cfmt.tuplets
					})
					continue
				}
				if (c == '&') {		// voice overlay start
					if (grace) {
						syntax(1, errs.bad_char, c)
						break
					}
					get_vover('(')
					break
				}
				line.index--;
				sls.push(parse_vpos())
				continue
			case ')':			// slur end
				if (curvoice.ignore)
					break
				s = curvoice.last_sym
				if (s) {
					switch (s.type) {
					case C.SPACE:
						if (!s.notes) {
							s.notes = []
							s.notes[0] = {}
						}
					case C.NOTE:
					case C.REST:
						break
					case C.GRACE:

						// stop the slur on the last grace note
						for (s = s.extra; s.next; s = s.next)
							;
						break
					default:
						s = null
						break
					}
				}
				if (!s) {
					syntax(1, errs.bad_char, c)
					break
				}
				s.notes[0].s = s
				slur_add(s.notes[0])
				break
			case '!':			// start of decoration
				if (!a_dcn)
					a_dcn = []
				if (type.length > 1) {	// decoration letter
					dcn = type.slice(1, -1)
				} else {
					dcn = "";
					i = line.index		// in case no deco end
					while (1) {
						c = line.next_char()
						if (!c)
							break
						if (c == '!')
							break
						dcn += c
					}
					if (!c) {
						line.index = i;
						syntax(1, "No end of decoration")
						break
					}
				}
				if (ottava[dcn] != undefined) {
					glovar.ottava = true;
					parse.ottava.push(ottava[dcn])
				} else {
					a_dcn.push(dcn)
				}
				break
			case '"':
				parse_gchord(type)
				break
			case '-':
				s = curvoice.last_note
				if (!s || s.type != C.NOTE) {
					syntax(1, "No note before '-'")
					break
				}
			    var	ty = parse_vpos()
				for (i = 0; i <= s.nhd; i++)
					s.notes[i].tie_ty = ty
				if (grace)
					grace.tie_s = curvoice.tie_s = grace
				else
					curvoice.tie_s = s
				continue
			case '[':
			    var c_next = line.buffer[line.index + 1]

				if ('|[]: "'.indexOf(c_next) >= 0
				 || (c_next >= '1' && c_next <= '9')) {
					if (grace) {
						syntax(1, errs.bar_grace)
						break
					}
					new_bar()
					continue
				}
				if (line.buffer[line.index + 2] == ':') {
					i = line.buffer.indexOf(']', line.index + 1)
					if (i < 0) {
						syntax(1, "Lack of ']'")
						break
					}
					text = line.buffer.slice(line.index + 3, i).trim()

					parse.istart = parse.bol + line.index;
					parse.iend = parse.bol + ++i;
					line.index = 0;
					do_info(c_next, text);
					line.index = i
					continue
				}
				// fall thru ('[' is start of chord)
			case 'n':				// note/rest
				s = self.new_note(grace, sls)
				if (!s)
					continue

				// handle the tuplets
				if (grace || !s.notes)
					continue

				if (tpn >= 0) {		// new tuplet
					s.tp = tp.slice(tpn)
					tpn = -1
					if (tps)
						s.tp[0].s = tps	// if nested
					tps = s
				} else if (!tps) {
					continue	// no tuplet active
				}

				k = tp[tp.length - 1]
				if (--k.r > 0)
					continue	// not end of tuplet yet

				while (1) {
					tp_adj(tps, k.q / k.p)
					i = k.ro	// number of notes of this tuplet
					if (k.s)
						tps = k.s  // start of upper tuplet

					tp.pop()		// previous level
					if (!tp.length) {
						tps = null	// done
						break
					}
					k = tp[tp.length - 1]
					k.r -= i
					if (k.r > 0)
						break
				}
				continue
			case '<':				/* '<' and '>' */
				if (!curvoice.last_note) {
					syntax(1, "No note before '<'")
					break
				}
				if (grace) {
					syntax(1, "Cannot have a broken rhythm in grace notes")
					break
				}
				n = c == '<' ? 1 : -1
				while (c == '<' || c == '>') {
					n *= 2;
					c = line.next_char()
				}
				curvoice.brk_rhythm = n
				continue
			case 'i':				// ignore
				break
			case '{':
				if (grace) {
					syntax(1, "'{' in grace note")
					break
				}
				last_note_sav = curvoice.last_note;
				curvoice.last_note = null;
				a_dcn_sav = a_dcn;
				a_dcn = undefined;
				grace = {
					type: C.GRACE,
					fname: parse.fname,
					istart: parse.bol + line.index,
					dur: 0,
					multi: 0
				}
				switch (curvoice.pos.gst) {
				case C.SL_ABOVE: grace.stem = 1; break
				case C.SL_BELOW: grace.stem = -1; break
				case C.SL_HIDDEN: grace.stem = 2; break	/* opposite */
				}
				sym_link(grace);
				c = line.next_char()
				if (c == '/') {
					grace.sappo = true	// acciaccatura
					break
				}
				continue
			case '|':
				if (grace) {
					syntax(1, errs.bar_grace)
					break
				}
				c = line.buffer[line.index - 1];
				new_bar()
				if (c == '.')
					curvoice.last_sym.bar_dotted = true
				continue
			case '}':
				s = curvoice.last_note
				if (!grace || !s) {
					syntax(1, errs.bad_char, c)
					break
				}
				if (a_dcn)
					syntax(1, "Decoration ignored");
				grace.extra = grace.next;
				grace.extra.prev = null;
				grace.next = null;
				curvoice.last_sym = grace;
				grace = null
				if (!s.prev			// if one grace note
				 && !curvoice.ckey.k_bagpipe) {
					for (i = 0; i <= s.nhd; i++)
						s.notes[i].dur *= 2;
					s.dur *= 2;
					s.dur_orig *= 2
				}
				curvoice.last_note = last_note_sav;
				a_dcn = a_dcn_sav
				break
			case "\\":
				if (!line.buffer[line.index + 1]) {
					no_eol = true
					break
				}
				// fall thru
			default:
				syntax(1, errs.bad_char, c)
				break
			}
			line.index++
		}
	} // parse_seq()

	if (parse.state != 3) {		// if not in tune body
		if (parse.state != 2)
			return
		goto_tune()
	}

	if (parse.tp) {
		tp = parse.tp
		tps = parse.tps
		parse.tp = null
	}

	parse_seq()

	if (tp.length) {
		parse.tp = tp
		parse.tps = tps
	}
	if (grace) {
		syntax(1, "No end of grace note sequence");
		curvoice.last_sym = grace.prev;
		curvoice.last_note = last_note_sav
		if (grace.prev)
			grace.prev.next = null
	}
	if (cfmt.breakoneoln && curvoice.last_note)
		curvoice.last_note.beam_end = true
	if (no_eol || cfmt.barsperstaff)
		return
	if (char_tb['\n'.charCodeAt(0)] == '\n'
	 && par_sy.voices[curvoice.v]
	 && par_sy.voices[curvoice.v].range == 0
	 && curvoice.last_sym)
		curvoice.last_sym.eoln = true
}
