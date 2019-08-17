// Most of this stuff was graciously sourced from Cuyler36 on github. Go check him out, he's a smart cookie. //
const $ = require('jquery')
require('bootstrap')

var BINGO = null;
var LARGE_CARD = false;

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

function difficulty_sort(a, b)
{
	var c = a.difficulty - b.difficulty;
	return c == 0 ? a.id - b.id : c;
}

function regenerateBoard()
{
	var hash = location.hash.slice(1);
	var parts = hash.split("/");
	var seed;
	
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
		BINGO.getGameData();
    }
    else{
		BINGO = new Bingo(5, $("#manualSeed").val(), difficulty);
		BINGO.getGameData();
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
	});
	
	$("#bingo td.goal").click(function (e) {
		var c = $(this).data('cell-data');
		c.state = (c.state + 1) % 4;
		var cell = c.cell;
		cell.removeClass("yes maybe no").addClass([null, "yes", "maybe", "no"][c.state]);
	});
});

