// Most of this stuff was graciously sourced from Cuyler36 on github. Go check him out, he's a smart cookie. //
const $ = require('jquery')
require('bootstrap')

var BINGO = null;
var LARGE_CARD = false;

function Random(seed)
{ this.seed = seed || +new Date(); }


//#region Random Number Generation Methods //
Random.prototype.nextFloat = function()
{ var x = Math.sin(this.seed++) * 10000; return x - Math.floor(x); }

// Box-Muller transform, converts uniform distribution to normal distribution
// depends on uniformity of nextFloat(), which I'm not confident of
Random.prototype.nextGaussian = function()
{
	let u = this.nextFloat(), v = this.nextFloat();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

Random.prototype.nextInt = function(z)
{
	return (this.nextFloat() * z) | 0;
}
//#endregion

//#region Array Methods //
// Shuffle's an array's entries randomly.
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

// Clones an array.
Array.prototype.clone = function()
{
	return this.slice(0);
}

// Creates an inversed array.
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

// Rotates an array by n steps.
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

Array.prototype.contains = function(x)
{
	return -1 !== this.indexOf(x);
}
//#endregion

function MagicSquare(size, random)
{
	random = this.random = random || new Random(0);

	var square = this.square = new Array();
	for (var x = 0; x < size; ++x)
	{
		var row = this.square[x] = new Array(size);
        for (var y = 0; y < size; ++y)
            row[y] = 0;
	}

	var x = (size - 1) / 2, y = size - 1, m = size * size;
	for (var k = 0; k < m; ++k)
	{
		square[x++][y++] = k / m;
		x %= size; y %= size;

		if (square[x][y])
		{
			x = (x - 1 + size) % size;
			y = (y - 2 + size) % size;
		}
	}

	for (var rcount = random.nextInt(4); rcount--; )
	{
		square = this.square = square.rotate();
		if (random.nextInt(2)) square.flip();
	}
}

function Bingo(size, seed, difficulty, balance) {
    this.difficulty = 0;
    if (difficulty && difficulty in Bingo.DIFFICULTY_TABLE){
        this.difficulty = Bingo.DIFFICULTY_TABLE[difficulty];
    }

    this.seed = parseInt(seed);
    this.random = new Random(parseInt(seed) + this.difficulty);
    this.balanced = balance;

    this.gamedata = null;

    $.getJSON("./js/game.json", (function(bingo)
	{
		return function(data)
		{
			bingo.processGameData(data);
			bingo.generateBoard();
		}
    })(this)).fail(function(){ console.log(arguments); });

    var board = this.board = [];
	var table = this.table = $("<table id='bingo' class='bingoTable'>");
	this.size = size;
	
	table.toggleClass('large', LARGE_CARD);

	// make a magic square for the board difficulty
	this.magic = new MagicSquare(size, this.random);

	var i, j, n = 1;

	//var header = $("<tr>").appendTo(table);
	// for (j = 0; j <= size; ++j)
	// {
	// 	var type = j == 0 ? "diag1" : ("col" + j);
	// 	var hdr = $("<td>").attr("data-type", type).addClass("header");
	// 	hdr.text(j == 0 ? "TL-BR" : "COL" + j).appendTo(header);
	// }

	var GROUPS = {
		// rows and columns (tags)
		col1: [], col2: [], col3: [], col4: [], col5: [],
		row1: [], row2: [], row3: [], row4: [], row5: [],

		// 2 diagonals
		diag1: [], diag2: [],
	};

	for (i = 1; i <= size; ++i)
	{
		var row = $("<tr>").addClass("row" + i);
		//$("<td>").addClass("header").attr("data-type", "row" + i).text("ROW" + i).appendTo(row);
		var brow = [];

		for (j = 1; j <= size; ++j, ++n)
		{
			var _groups = [ GROUPS["col" + j], GROUPS["row" + i] ];
			var cell = $("<td>").addClass("col" + j).addClass("row" + i), c;
			cell.addClass("goal").attr("data-cell", n);

			// add diagonals
			if (i == j) { cell.addClass("diag1"); _groups.push(GROUPS.diag1); }
			if (i + j == size + 1) { cell.addClass("diag2"); _groups.push(GROUPS.diag2); }

			row.append(cell);

			brow.push(c = { cell: cell, goal: null, mod: null, state: 0, groups: _groups });
			cell.data("cell-data", c);
		}

		// add the row to the table
		table.append(row);
		board.push(brow);
	}

	//$("<tr>").append($("<td>").text("TR-BL").addClass("header").attr("data-type", "diag2")).appendTo(table);

	// add the table to the screen now
	$("#bingo-container").empty().append(table);
	$("#bingo td.goal").click(function(e)
	{
		var c = $(this).data('cell-data');
		c.state = (c.state + 1) % 4;

		var cell = c.cell;
		cell.removeClass("yes maybe no").addClass([null, "yes", "maybe", "no"][c.state]);
	});
	
	$("#bingo td.header").hover(
		function() { $("#bingo td.goal." + $(this).attr("data-type")).addClass("hover"); }, 
		function() { $("#bingo td.goal." + $(this).attr("data-type")).removeClass("hover"); }
	)
	.click(function()
	{
		var tds = [];
		$("#bingo td.goal." + $(this).attr("data-type")).each(function(i, x){ tds.push(x); });
		console.log(tds.length, tds);

		var win = window.open('https://cuyler36.github.io/bingo/popout/', '_blank', 'toolbar=no, location=no, directories=no, status=no, '
			+ 'menubar=no, scrollbars=no, resizable=yes, copyhistory=no, width=250, height=550');
		win.addEventListener('load', (function(title, elems)
		{
			return function()
			{
				setTimeout(function()
				{
					var winbody = $(win.document.body);
					$('#bingo th', winbody).text(title).height(25);

					$(elems).each(function(i, x)
					{
						var td = $('<td>').addClass('goal').html($(x).html());
						$('#bingo', winbody).append($('<tr>').append(td));
					});

					var h = win.innerHeight - 100;
					$('#bingo td.goal', winbody).height(h / size);
				}, 500);
			};
		})($(this).text(), tds), false);
	});

	// resize this mess
	var col1w = $('#bingo td.header[data-type="diag1"]').width();
	var sz = ($('#bingo-container').innerWidth() * .9 - col1w) / 5;
    $("#bingo td.goal").outerWidth(sz).outerHeight(sz);
}

Bingo.DIFFICULTY_TABLE = {
	'easy': -1,
	'e': -1,
	'normal': 0,
	'n': 0,
	'hard': 1,
	'h': 1,
	'difficult': 1,
	'd': 1,
};

function difficulty_sort(a, b)
{
	var c = a.difficulty - b.difficulty;
	return c == 0 ? a.id - b.id : c;
}

Bingo.DIFFICULTY_VARIANCE = 0.2;
Bingo.MAXITERATIONS = 200;

Bingo.prototype.generateBoard = function()
{
	var goal, goalsTable = this.gamedata.goals.clone(), goalIndex;
	var m, ms = this.gamedata.modifiers || {};
	var tagdata = this.gamedata.tags;

	var usedgoals = [];

	var range = this.maxdifficulty - this.mindifficulty;
	for (var cardY = 0; cardY < this.size; ++cardY)
		for (var cardX = 0; cardX < this.size; ++cardX)
		{
			for (var attempt = 0;; attempt++)
			{
				// failsafe: widen search space after 25 iterations
                var variance = this.random.nextGaussian() * Bingo.DIFFICULTY_VARIANCE;

                // magic.square[cardY][cardX] contains the percentage of the square out of the maximum number of squares. e.goal. square 1 = 1/25.
                base = Math.min(Math.max(0.0, this.magic.square[cardY][cardX] + variance), 1.0);
				var ddiff = attempt < 25 ? (base * range) : this.random.nextInt(range);

                // Search for the index of our difficulty.
				goalIndex = goalsTable.bsearch(ddiff + this.mindifficulty, function(goalIndex){ return goalIndex.difficulty; });
                if (goalIndex >= goalsTable.length)
				{
                    goalIndex = goalsTable.length - 1;
					console.log(goalIndex, goalsTable.length);
				}
				
                // Search for the range of goals that fit within our difficulty.
				var minDifficultyIdx, maxDifficultyIdx;
				for (minDifficultyIdx = goalIndex; minDifficultyIdx > 0 && goalsTable[minDifficultyIdx-1].difficulty == goalsTable[minDifficultyIdx].difficulty; --minDifficultyIdx);
                for (maxDifficultyIdx = goalIndex; maxDifficultyIdx < goalsTable.length - 1 && goalsTable[maxDifficultyIdx + 1].difficulty == goalsTable[maxDifficultyIdx].difficulty; ++maxDifficultyIdx);

				console.log("Minimum difficulty index:", minDifficultyIdx, " | Max difficulty index:", maxDifficultyIdx);
				
                // Select the goal for the difficulty.
				goalIndex = minDifficultyIdx + this.random.nextInt(maxDifficultyIdx - minDifficultyIdx);
				console.log("Selected goal index for difficulty:", goalIndex);
				console.log("Selected goal name:", goalsTable[goalIndex].name);

                // Set goal.
                goal = this.board[cardY][cardX].goal = goalsTable[goalIndex];
			    if (!goal) continue;

			    var vmods = ms["*"] || [], tags = goal.tags || [], valid = !usedgoals.contains(goal.id);
				var invalidReason = "Valid goal.";
                var img = null;

				for (var k = 0; k < tags.length; ++k)
				{
					var negated = tags[k].charAt(0) == "-" ? tags[k].substr(1) : ("-" + tags[k]);
					var tdata = tagdata[tags[k]];
					var allowmult = tdata && tdata.allowmultiple !== undefined ? tdata.allowmultiple : false;
						
					// get the image
					if (!img && tags[k].charAt(0) != '-' && tdata && tdata.image) img = tdata.image;
					
					// failsafe: after 50 iterations, don't constrain on allowmultiple tags
					if (attempt > 50) allowmult = true;
					
					// failsafe: after 75 iterations, don't constrain on singleuse tags
					if (!(tags[k] in tagdata)) tdata = tagdata[tags[k]] = {};
					if (tdata && tdata.singleuse && tdata['@used'] && attempt < 75)
					{
						valid = false;
						invalidReason = "Goal tag was already used & only one type of this tag is allowed!";
					}
					
					for (var z = 0; z < this.board[cardY][cardX].groups.length; ++z)
					{
						if ((!allowmult && this.board[cardY][cardX].groups[z].contains(tags[k])) || this.board[cardY][cardX].groups[z].contains(negated))
						{
							valid = false;
							invalidReason = "Goal tag was already used & allowmultiple is disabled!";
						}
					}
				}

				if (valid)
				{
					var cell = this.board[cardY][cardX].cell;
					usedgoals.push(goal.id);
					if (img) $('<img>').attr('src', img).appendTo(cell);
					for (var k = 0; k < tags.length; ++k) tagdata[tags[k]]['@used'] = true;
					
					$("<span>").addClass("goaltext").text(goal.name).appendTo(cell);
					goalsTable.splice(goalIndex, 1);
					
					break;
				}
				else
				{
					console.log("Goal [id]:", goal.id, "was not valid! Goal name:", goal.name, "Goal difficulty:", goal.difficulty, "Reason for invalidation:", invalidReason);
				}
				
				// safety fallout
				if (attempt > Bingo.MAXITERATIONS)
				{
					console.log("Could not find a suitable goal for R" + (cardY+1) + "xC" + (cardX+1) + " after " + attempt + " iterations");
					$("<span>").addClass("goaltext").text("[ERROR]").appendTo(this.board[cardY][cardX].cell); break;
				}
			}

			for (var k = 0; k < tags.length; ++k)
			{
				if (tags[k] in ms) vmods = vmods.concat(ms[tags[k]]);
				for (var z = 0; z < this.board[cardY][cardX].groups.length; ++z)
					this.board[cardY][cardX].groups[z].push(tags[k]);
			}
			vmods.sort(difficulty_sort);

			if (vmods.length && (this.modrequired || this.random.nextFloat() < 0.25))
			{
				this.board[cardY][cardX].mod = m = vmods[this.random.nextInt(vmods.length)];
				$("<span>").addClass("modtext").text(m.name).appendTo(this.board[cardY][cardX].cell);
			}
		}
}

Bingo.DIFFICULTY_KEEPSIZE = 3/5;
Bingo.prototype.processGameData = function(data)
{
    this.gamedata = data;
    let difficultyString = Object.keys(Bingo.DIFFICULTY_TABLE).find(key => Bingo.DIFFICULTY_TABLE[key] === this.difficulty);
    let difficultyStringFormatted = difficultyString.charAt(0).toUpperCase() + difficultyString.slice(1);
	var appname = document.title = difficultyStringFormatted + " Bingo Seed: " + this.seed;

	if (data.goals.length < 25)
	{
		console.error("25 goals required for a standard 5x5 bingo board");
		return;
	}
	
	for (var i = 0; i < data.goals.length; ++i)
	{
		if (!data.goals[i].distance) data.goals[i].distance = 0;
		data.goals[i].id = i;
	}
	data.goals.sort(difficulty_sort);
	
	var maxdiff = Number.POSITIVE_INFINITY, mindiff = Number.NEGATIVE_INFINITY;
	
	var bdiffa = data.goals[0].difficulty;
	var bdiffb = data.goals[data.goals.length - 1].difficulty - bdiffa;
	
	switch (this.difficulty)
	{
		case -1:
			// EASY: keep only the easiest goals
			if (data.difficulty && data.difficulty.easymax)
				maxdiff = +data.difficulty.easymax;
			else maxdiff = bdiffa + bdiffb * Bingo.DIFFICULTY_KEEPSIZE;
			break;
			
		case 0:
			// NORMAL: check to see if a range is provided
			if (data.difficulty && data.difficulty.normmax)
				maxdiff = +data.difficulty.normmax;
			if (data.difficulty && data.difficulty.normmin)
				mindiff = +data.difficulty.normmin;
			break;
			
		case 1:
			// HARD: keep only the hardest goals
			if (data.difficulty && data.difficulty.hardmin)
				mindiff = +data.difficulty.hardmin;
			else mindiff = bdiffa + bdiffb * (1 - Bingo.DIFFICULTY_KEEPSIZE);
			break;
	}
	
	var i1 = null, i2 = null;
	for (var i = 0; i < data.goals.length; ++i)
	{
		if (data.goals[i].difficulty >= mindiff && i1 == null) i1 = i;
		if (data.goals[i].difficulty >  maxdiff && i2 == null) i2 = i;
	}
	
	if (i1 == null) i1 = 0;
	if (i2 == null) i2 = data.goals.length;
	
	// ensure there are always at least 25 goals
	if (i2 - i1 < 25)
	{
		if (i2 == data.goals.length)
			i1 = data.goals.length - 25;
		else { i1 = 0; i2 = 25; }
	}
	
	data.goals = data.goals.slice(i1, i2);

	this.maxdifficulty = data.goals[data.goals.length - 1].difficulty;
	this.mindifficulty = data.goals[0].difficulty;

	this.modrequired = this.gamedata.modifiers && !!this.gamedata.modifiers['@required'];
	delete this.gamedata.modifiers['@required'];
	$("#game-name").text(data.name);
	
	$('#game-rules').toggle(!!data.rules);
	if (data.rules)
	{
		var rulelist = $('#game-rules ul');
		$('li.game-gen', rulelist).remove();
		for (var i = 0; i < data.rules.length; ++i)
			rulelist.append($('<li>').addClass('game-gen').html(data.rules[i]));
	}
	
	$('#bingo-attrib').toggle(!!data.author);
	if (data.author)
		$('#bingo-author').text(data.author);
}

function regenerateBoard()
{
	var hash = location.hash.slice(1);
	var parts = hash.split("/");
	var seed;
	
	//$('#bingo-container').toggleClass('col-md-5', !LARGE_CARD);
	//$('#bingo-container').toggleClass('col-md-6',  LARGE_CARD);
	
	//$('#about-panel').toggleClass('col-md-5', !LARGE_CARD);
	//$('#about-panel').toggleClass('col-md-4',  LARGE_CARD);

	// remove trailing empty hash parts
	while (parts.length && !parts[parts.length - 1]) parts.pop();

	var difficulty = null;
	switch (parts.length)
	{
		case 0:
			break;

		case 1: // #!
			seed = Math.floor(Math.random() * 60466176);
			location.hash = "#!" + "/" + seed.toString(36);
			break;

		case 2: // #!/seed
			seed = parseInt(parts[1].toLowerCase(), 36);
			break;

		case 3: // #!/seed/difficulty
			seed = parseInt(parts[1].toLowerCase(), 36);
			difficulty = parts[2];
			break;
	}

    if ($("#manualSeed").val() == ""){
        BINGO = new Bingo(5, seed, difficulty);
    }
    else{
        BINGO = new Bingo(5, $("#manualSeed").val(), difficulty);
    }
	
}

function setDifficulty(diff)
{
	var size = LARGE_CARD ? "!!" : "!";
	
	// set the location hash properly, everything else should take care of itself
	var lvl = diff && diff.length ? ("/" + diff) : "";
	var seed = Math.floor(Math.random() * 60466176).toString(36);
	location.hash = "#" + size + "/" + seed + lvl;
}

$('button.set-diff').click(function(e) { setDifficulty($(this).attr('data-diff')); });

window.onhashchange = regenerateBoard;
if (location.hash && location.hash.indexOf("#!") === 0)
regenerateBoard();

$(document).ready(function(){
    $("#goButton").click(function(e){
        $("#settingsContainer").hide();
        setDifficulty($("input[name='options']:checked").val());
    })
});

