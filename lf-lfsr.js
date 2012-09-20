function Matrix(rows) {
	this.matrix = rows;
	this.nrows = rows.length;
	this.ncols = rows[0].length;
}

Matrix.prototype.toString = function() {
	var a = [];
	for (var i = 0; i < this.nrows; i++)
		a.push(this.matrix[i].join(', '));
	return a.join("\n");
}

Matrix.prototype.toRowArray = function() {
	return this.matrix;
}

Matrix.prototype.x = function(b, mulFn, sumFn) {
	if (!(b instanceof Matrix))
		throw "Matrix B needs to be of type 'Matrix'";
	if (this.ncols != b.nrows)
		throw "Matrix B needs to have same number of columns as matrix A has rows";

	if (typeof(mulFn) === "undefined")
		mulFn = function(x,y) { return x*y; }
	if (typeof(sumFn) === "undefined")
		sumFn = function(x,y) { return x+y; }

	var c = [];
	for (var i = 0; i < this.nrows; i++) {
		var row = [];
		for (var j = 0; j < this.ncols; j++) {
			var s = 0;
			for (var k = 0; k < b.nrows; k++) {
				s = sumFn(s, mulFn(this.matrix[i][k], b.matrix[k][j]));
			}
			row.push(s);
		}
		c.push(row);
	}

	return new Matrix(c);
}

Matrix.prototype.pow = function(n, mulFn, sumFn) {
	if (typeof(mulFn) === "undefined")
		mulFn = function(x,y) { return x*y; }
	if (typeof(sumFn) === "undefined")
		sumFn = function(x,y) { return x+y; }

	var c = this;
	for (var i = 1; i < n; i++)
		c = this.x(c, mulFn, sumFn);

	return c;
}

function lfsrMatrix(bits, taps) {
	var rows = [];

	for (var i = 0; i < bits; i++) {
		var row = [];
		for (var j = 0; j < bits; j++)
			row.push(0);

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
	var r = [];
	var taps = this.toTapsArray("q<sub>%%</sub>");
	for (var i = 0; i < taps.length; i++)
		r.push("q<sub>"+i+"(next)</sub> = " + taps[i].join("&oplus;"));

	return r;
}


$(function() {
	$("form#lfsr-gen").submit(function() {
		var bits = $('input#bits').val();
		var taps = $.map($('input#taps').val().split(','),
				 function(v) { return $.trim(v); });
		var entropy_bits = $('input#entropy_bits').val();

		var l = new LfLFSR(bits, taps, entropy_bits);
		var h = l.toEqnHTMLArray();

		$("ul#feedback-eqns").empty();
		for (i in h) {
			$("<li>"+h[i]+"</li>").appendTo("ul#feedback-eqns");
		}

		$("pre#verilog-code").text(l.toVerilog());
		return false;
	});
});
