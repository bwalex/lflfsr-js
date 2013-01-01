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

	// preallocate array
	var c = [];
	for (var i = 0; i < this.nrows; i++) {
		var row = new Array(this.ncols);
		for (var j = 0; j < this.ncols; j++) {
			var s = 0;
			for (var k = 0; k < b.nrows; k++) {
				s = sumFn(s, mulFn(this.matrix[i][k], b.matrix[k][j]));
			}
			row[j] = s;
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
