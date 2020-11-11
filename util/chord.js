// chord.js - generation of accompaniment
//
// Copyright (C) 2020 Jean-Francois Moine and Seymour Shlien
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

// -- chord table --
// index = chord symbol type
// value: array of strings
//	index = inversion
//	string = list of 2 characters
//		1st character = note (see abc2svg.letmid)
//		2nd character = octave ('+', ' ', '-')
abc2svg.chordnames = {
	maj:	["C-E G C+", "E-C G C+", "G-C E G "],
	min:	["C-e G C+", "e-C G C+", "G-C e G "],
	m:	["C-e G C+", "e-C G C+", "G-C e G "],
	'7':	["C-b-E G ", "E-C G b ", "G-E b C+", "b-E G C+"],
	m7:	["C-b-e G ", "e-C G b ", "G-e b C+", "b-e G C+"],
	m7b5:	["C-b-e g ", "e-C g b ", "g-e b C+", "b-e g C+"],
	maj7:	["C-B-E G ", "E-C G B ", "G-E B C+", "B-E G C+"],
	M7:	["C-B-E G ", "E-C G B ", "G-E B C+", "B-E G C+"],
	'6':	["C-A-E G ", "E-C A B ", "A-E B C+", "B-E A C+"],
	m6:	["C-A-e G ", "e-C A B ", "A-e B C+", "B-e A C+"],
	aug:	["C-E a C+", "E-C a C+", "a-C E a "],
	plus:	["C-E a C+", "E-C a C+", "a-C E a "],
	aug7:	["C-b-E a ", "E-C a b ", "a-E b C+", "b-E a C+"],
	dim:	["C-E g C+", "E-C g C+", "g-C E g "],
	dim7:	["C-e g A ", "e-C g A ", "g-e A C+", "A-C e G "],
	'9':	["C-b-E G D+", "E-C G b D+", "G-E b C+D+", "b-E G C+D+", "D-G-C E b "],
	m9:	["C-b-eE G D+", "e-C G b D+", "G-e b C+D+", "b-e G C+D+", "D-G-C e b "],
	maj9:	["C-B-E G D+", "E-C G B D+", "G-E B C+D+", "B-E G C+D+", "D-G-C E B "],
	M9:	["C-B-E G D+", "E-C G B D+", "G-C E B D+", "B-E G C+D+", "D-G-C E B "],
	'11':	["C-b-E G D+F+", "E-C G b D+F+", "G-E b C+D+F+", "b-E G C+D+F+",
						"D-G-C E b F+", "F-D-G-C E b D+"],
	dim9:	["C-A-e g d+", "e-C g A d+", "g-C e A d+", "A-C e g d+", "D-g-C e A "],
	sus:	["C-F G C+", "F-C G C+", "G-C F G "],
	sus4:	["C-E G C+", "E-C G C+", "G-C F G "],
	sus9:	["C-D G C+", "D-C G C+", "G-C D G "],
	'7sus4': ["C-b-F G ", "F-C G b ", "G-F b C+", "b-C F G "],
	'7sus9': ["C-b-D G ", "D-C G b ", "G-D b C+", "b-C D G "],
	'5':	["C-G C+", "G-G C+"]
} // chordnames

abc2svg.midlet = "CdDeEFgGaAbB"		// MIDI pitch -> letter
abc2svg.letmid = {			// letter -> MIDI pitch
	C: 0,
	d: 1,
	D: 2,
	e: 3,
	E: 4,
	F: 5,
	g: 6,
	G: 7,
	a: 8,
	A: 9,
	b: 10,
	B: 11
} // midsca

abc2svg.chord = function(first,		// first symbol in time
			 voice_tb,	// table of the voices
			 cfmt) {	// tune parameters
    var	chnm, i, k, vch, s, gchon,
	C = abc2svg.C,
	trans = 48 + (cfmt.chord.trans ? cfmt.chord.trans * 12 : 0)

	// create a chord according to the bass note
	function chcr(b, ch) {
	    var	i, v,
		r = []

		if (b < 0)
			b += 12
		b = abc2svg.midlet[b]
		i = ch.length
		while (--i > 0) {
			if (ch[i][0] == b)	// search the bass in the chord
				break
		}
		ch = ch[i]
		for (i = 0; i < ch.length; i += 2) {
			v = abc2svg.letmid[ch[i]]
			switch (ch[i + 1]) {
			case '+': v += 12; break
			case '-': v -= 12; break
			}
			r.push(v)
		}
		return r
	} // chcr()

	// generate a chord
	function gench(sb, gch) {
	    var	r, ch, b, m, n, not,
		a = gch.otext.
			replace(/\$./,'').
			match(/([A-G])([#♯b♭]?)([^/]*)\/?(.*)/),
			// a[1] = note, a[2] = acc, a[3] = type, a[4] = bass
		s = {
			v: vch.v,
			p_v: vch,
			type: C.NOTE,
			time: sb.time,
			notes: []
		}

		if (a)
			r = abc2svg.letmid[a[1]]	// root
		if (r == undefined) {
			s.type = C.REST			// ("0") = no chord
			ch = [0]
			r = 0
		} else {
			switch (a[2]) {
			case "#":
			case "♯": r++; break
			case "b":
			case "♭": r--; break
			}
			if (!a[3])
				a[3] = "maj"
			ch = chnm[a[3]]
			if (!ch)
				ch = a[3][0] == 'm' ? chnm.min : chnm.maj

			if (a[4]) {
				b = abc2svg.letmid[a[4][0]]
				if (b != undefined) {
					switch (a[4][1]) {
					case "#":
					case "♯": b++; break
					case "b":
					case "♭": b--; break
					}
				}
			}
		}
		if (b == undefined)
			b = 0
		ch = chcr(b, ch)

		// generate the notes of the chord
		n = ch.length
		r += trans
		for (m = 0; m < n; m++) {
			not = {
				midi: r + ch[m]
			}
			s.notes.push(not)
		}
		s.nhd = n - 1

		// insert the chord in the chord voice and in the tune
		s.prev = vch.last_sym
		vch.last_sym.next = s
		s.ts_next = sb.ts_next
		sb.ts_next = s
		s.ts_prev = sb
		if (s.ts_next)
			s.ts_next.ts_prev = s
		vch.last_sym = s
	} // gench()

	// -- chord() --

	// set the chordnames defined by %%MIDI chordname
	if (cfmt.chord.names) {
		chnm = Object.create(abc2svg.chordnames)
		for (k in cfmt.chord.names) {
			vch = ""
			for (i = 0; i < cfmt.chord.names[k].length; i++) {
				s = cfmt.chord.names[k][i]
				vch += abc2svg.midlet[s % 12]
				vch += i == 0 ? "-" :
					(s >= 12 ? "+" : " ")
			}
//fixme: no inversion
			chnm[k] = [ vch ]
		}
	} else {
		chnm = abc2svg.chordnames
	}

	// create the chord voice
	vch = {
		v: voice_tb.length,
		id: "_chord",
		time: 0,
		sym: {			// dummy symbol to simplify chord insersion
			type: C.REST,
			time: 0
		},
		instr: cfmt.chord.prog || 0,
		vol: cfmt.chord.vol || .8
	}
	vch.last_sym = vch.sym
	voice_tb.push(vch)

	// define the MIDI channel
	k = 0
	for (i = 0; i < vch.v; i++) {
		if (k < voice_tb[i].chn)
			k = voice_tb[i].chn
	}
	if (k == 8)
		k++			// skip the channel 10
	vch.chn = k + 1

	// loop on the symbols and add the accompaniment chords
	gchon = cfmt.chord.gchon
	s = first
	while (1) {
		if (!s.ts_next) {
			if (gchon)
				vch.last_sym.dur = s.time - vch.last_sym.time
			break
		}
		s = s.ts_next
		if (!s.a_gch) {
			if (s.subtype == "midigch") {
				if (gchon && !s.on)
					vch.last_sym.dur = s.time - vch.last_sym.time
				gchon = s.on
			}
			continue
		}
		if (!gchon)
			continue
		for (i = 0; i < s.a_gch.length; i++) {
			gch = s.a_gch[i]
			if (gch.type != 'g')
				continue
			vch.last_sym.dur = s.time - vch.last_sym.time
			gench(s, gch)
			break
		}
	}
} // chord()