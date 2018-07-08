// equalbars.js - module to set equal spaced measure bars
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%equalbars" appears in a ABC source.
//
// Parameters
//	%%equalbars bool

abc2svg.equalbars = {

    // new tune - clear the width of the start of the staff
    output_music: function(of) {
	this.equalbars_d = 0;
	of()
    },

    // get the equalbars parameter
    set_fmt: function(of, cmd, param, lock) {
	if (cmd == "equalbars")
		this.cfmt().equalbars = this.get_bool(param)
	else
		of(cmd, param, lock)
    },

    // adjust the symbol offsets of a music line
    set_sym_glue: function(of, width) {
    var	C = abc2svg.C,
	s, s2, w, i, n, x, g, t, t0,
	bars = [],
	tsfirst = this.get_tsfirst();

	of(width)			// compute the x offset of the symbols
	if (!this.cfmt().equalbars)
		return

	// search the first note/rest/bar
	for (s2 = tsfirst; s2; s2 = s2.ts_next) {
		if (!s2.seqst)
			continue
		switch (s2.type) {
		default:
			continue
		case C.BAR:
		case C.GRACE:
		case C.MREST:
		case C.NOTE:
		case C.REST:
		case C.SPACE:
			break
		}
		break
	}
	if (!s2)
		return

	// build an array of the bars
	s = s2.ts_next;
	t0 = t = s.time
	while (1) {
		if (!s.ts_next) {
			bars.push([s, s.time - t]);
			t = s.time
			if (s.dur)
				t += s.dur
			break
		}
		if (s.type == C.BAR && s.seqst) {
			bars.push([s, s.time - t]);
			t = s.time
		}
		s = s.ts_next
	}
	n = bars.length
	if (n == 0)
		return				// no bar!

	// set the measure parameters
	x = s2.type == C.GRACE ? s2.extra.x : s2.x;
	d = this.equalbars_d
	if (!d)
		d = this.equalbars_d = x;	// offset first note/rest

	w = (width - d) / (t - t0)		// width per time unit

	// loop on the bars
	for (i = 0; i < n; i++) {
		s = bars[i][0];			// next bar
		f = w * bars[i][1] / (s.x - x)

		// and update the x offsets
		for ( ; s2 != s; s2 = s2.ts_next) {
			if (s2.type == C.GRACE) {
				for (g = s2.extra; g; g = g.next)
					g.x = d + (g.x - x) * f
			} else if (s2.x) {
				s2.x = d + (s2.x - x) * f
			}
		}
		d += w * bars[i][1];
		x = s2.x
		while (1) {
			s2.x = d;
			s2 = s2.ts_next
			if (!s2 || s2.seqst)
				break
		}
		if (!s2)
			break
	}
    } // set_sym_glue()
} // equalbars


abc2svg.modules.hooks.push(
// export
	"get_bool",
// hooks
	[ "output_music", "abc2svg.equalbars.output_music" ],
	[ "set_format", "abc2svg.equalbars.set_fmt" ],
	[ "set_sym_glue", "abc2svg.equalbars.set_sym_glue" ]
)

// the module is loaded
abc2svg.modules.equalbars.loaded = true
