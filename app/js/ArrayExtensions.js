/**
 * Randomly shuffles 
 */
Array.prototype.shuffle = function(random)
{
	for (var t, i = 1, j; i < this.length; ++i)
	{
		j = random.nextInt(i);
		
		t = this[j];
		this[j] = this[i];
		this[i] = t;
	}

	return this;
}

/**
 * 
 */
Array.prototype.clone = function()
{
	return this.slice(0);
}

/**
 * 
 */
Array.prototype.flip = function()
{
	for (var i = 0; i < this.length; ++i)
	{
		var r = this[i], t;
		for (var j = 0, k = r.length - 1; j < k; ++j, --k)
		{ 
			t = r[j];
			r[j] = r[k];
			r[k] = t;
		}
	}
}


/**
 * 
 */
Array.prototype.rotate = function(n)
{
	var length = this.length, categoryLength = this[0].length;
	var rotated = new Array(categoryLength);

	for (var i = 0; i < categoryLength; ++i)
	{
		var row = rotated[i] = new Array(length);
		for (var j = 0; j < length; ++j)
			rotated[i][j] = this[length-j-1][i];
	}

	return rotated;
}

/**
 * 
 */
Array.prototype.bsearch = function(k, f)
{
	f = f || function(z) { return z; };
	var a = 0, b = this.length, x, v;

	while (a + 1 < b)
	{
		x = (a + (b - a) / 2) | 0;
		v = f(this[x]);
		if (k == v) return x;
		else k < v ? (b = x) : (a = x + 1);
	}

	// failsafe?
	return a;
}

/**
 * 
 */
Array.prototype.contains = function(x)
{
	return -1 !== this.indexOf(x);
}