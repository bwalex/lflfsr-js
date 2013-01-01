function lfsrMatrix(bits, taps) {
	var rows = [];

	for (var i = 0; i < bits; i++) {
		var row = new Array(bits);
		for (var j = 0; j < bits; j++)
			row[j] = 0;

		if (i == bits-1) {
			/* Last row */
			for (k in taps)
				row[taps[k]] = 1;
		} else {
			/* All other rows */
			row[i+1] = 1;
		}

		rows.push(row);
	}
	return new Matrix(rows);
}

function LfLFSR(bits, taps, entropy_bits) {
	var m = lfsrMatrix(bits, taps);
	this.baseM = m;
	this.M = m.pow(entropy_bits, function(x,y) { return x&y; }, function(x,y) { return x^y; });
}

LfLFSR.prototype.toMatrix = function() {
	return new Matrix(this.M.matrix);
}

LfLFSR.prototype.toTapsArray = function(format) {
	var rows = [];

	if (typeof(format) === "undefined")
		format = "%%";

	for (var i = 0; i < this.M.nrows; i++) {
		var row = [];
		for (var j = 0; j < this.M.ncols; j++)
			if (this.M.matrix[i][j] === 1)
				row.push(format.replace("%%", j));

		rows.push(row);
	}

	return rows;
}

LfLFSR.prototype.toVerilog = function() {
	var s = "";
	var taps = this.toTapsArray("lfsr_r[%%]");
	s += "reg ["+ (taps.length-1) +":0] lfsr_r;\n\n";
	s += "always @(posedge clock, negedge reset_n)\n";
	s += "  if (~reset_n)\n";
	s += "    lfsr_r <= LFSR_SEED;\n";
	s += "  else begin\n";
	for (var i = 0; i < taps.length; i++) {
		s += "    lfsr_r["+i+"] <= "+taps[i].join(" ^ ")+";\n";
	}
	s += "  end\n";

	return s;
}

LfLFSR.prototype.toEqnHTMLArray = function() {
	var taps = this.toTapsArray("q<sub>%%</sub>");
	var r = new Array(taps.length);
	for (var i = 0; i < taps.length; i++)
		r[i] = "q<sub>"+i+"(next)</sub> = " + taps[i].join("&oplus;");

	return r;
}
