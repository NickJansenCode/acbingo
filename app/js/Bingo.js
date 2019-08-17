/**
 * Defines a Bingo Board.
 * @property size The size of the board.
 * @property seed The board's seed.
 * @property difficulty The board's difficulty level.
 * @property balance I'm not sure what this is.
 */
class Bingo {

    /**
     * Creates a new instance of the Bingo class.
     * @param {Number} size The size of the board.
     * @param {Number} seed The board's seed.
     * @param {Number} difficulty The board's difficulty level.
     * @param {any} balance I'm not sure what this is.
     */
    constructor(size, seed, difficulty, balance) {
        
        /**
         * The game's difficulty.
         */
        this.difficulty = (difficulty && difficulty in this.DifficultyTable) ?
            this.DifficultyTable[difficulty] :
            0;

        /**
         * The game's seed.
         */
        this.seed = parseInt(seed);

        /**
         * The board's random object.
         */
        this.random = new Random(parseInt(seed) + this.difficulty);
        
        /**
         * I'm not sure what this is.
         */
        this.balanced = balance;

        /**
         * The game data. (JSON)
         */
        this.gamedata = null;
        
        /**
         * Array containing the game board.
         */
        this.board = [];

        /**
         * HTML representation of the bingo board.
         */
        this.table = $("<table id='bingo' class='bingoTable'>");

        /**
         * The board's size.
         */
        this.size = size;

        /**
         * A MagicSquare for the board's difficulty.
         * @see MagicSquare.js
         */
        this.magic = new MagicSquare(size, this.random);
    }

    /**
     * Key-Value pairs to represent board difficulty.
     */
    DifficultyTable = {
        'easy': -1,
        'e': -1,
        'normal': 0,
        'n': 0,
        'hard': 1,
        'h': 1,
        'difficult': 1,
        'd': 1,
    };

    /**
     * The variance in difficulty.
     */
    DifficultyVariance = 0.2;

    /**
     * Not sure yet.
     */
    DifficultyKeepsize = 3/5;

    /**
     * The max number of attempts to try to find a suitable goal to add to the board.
     */
    MaxIterations = 200;

    /**
     * Draws the Bingo Board to the screen.
     */
    draw(){
        let n = 1;
        var GROUPS = {
            
            // Rows & columns. //
            col1: [], col2: [], col3: [], col4: [], col5: [],
            row1: [], row2: [], row3: [], row4: [], row5: [],

            // Diagonals. //
            diag1: [], diag2: [],
        };

        for (let i = 1; i <= this.size; ++i) {
            var row = $("<tr>").addClass("row" + i);
            var brow = [];
            for (let j = 1; j <= this.size; ++j, ++n) {
                var _groups = [GROUPS["col" + j], GROUPS["row" + i]];
                var cell = $("<td>").addClass("col" + j).addClass("row" + i), c;
                cell.addClass("goal").attr("data-cell", n);
                // add diagonals
                if (i == j) {
                    cell.addClass("diag1");
                    _groups.push(GROUPS.diag1);
                }
                if (i + j == this.size + 1) {
                    cell.addClass("diag2");
                    _groups.push(GROUPS.diag2);
                }
                row.append(cell);
                brow.push(c = { cell: cell, goal: null, mod: null, state: 0, groups: _groups });
                cell.data("cell-data", c);
            }
            
            // Add the row to the table. //
            this.table.append(row);
            this.board.push(brow);
        }

        // Add the table to the screen. //
        $("#bingo-container").empty().append(this.table);
    }


    /**
     * 
     */
    getGameData(){
        $.getJSON("./js/game.json")
            .then((data) => {
                this.processGameData(data);
                this.draw();
                this.generateBoard();
            })
            .fail((error) => {
                console.error(error);
            })
    };

    /**
     * Huge monolithic method that does....something? Requires further investigation.
     */
    processGameData(data) {
        this.gamedata = data;
        let difficultyString = Object.keys(this.DifficultyTable).find(key => this.DifficultyTable[key] === this.difficulty);
        let difficultyStringFormatted = difficultyString.charAt(0).toUpperCase() + difficultyString.slice(1);
        var appname = document.title = difficultyStringFormatted + " Bingo Seed: " + this.seed;
        if (data.goals.length < 25) {
            console.error("25 goals required for a standard 5x5 bingo board");
            return;
        }
        for (var i = 0; i < data.goals.length; ++i) {
            if (!data.goals[i].distance)
                data.goals[i].distance = 0;
            data.goals[i].id = i;
        }
        data.goals.sort(difficulty_sort);
        var maxdiff = Number.POSITIVE_INFINITY, mindiff = Number.NEGATIVE_INFINITY;
        var bdiffa = data.goals[0].difficulty;
        var bdiffb = data.goals[data.goals.length - 1].difficulty - bdiffa;
        switch (this.difficulty) {
            case -1:
                // EASY: keep only the easiest goals
                if (data.difficulty && data.difficulty.easymax)
                    maxdiff = +data.difficulty.easymax;
                else
                    maxdiff = bdiffa + bdiffb * this.DifficultyKeepsize;
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
                else
                    mindiff = bdiffa + bdiffb * (1 - this.DifficultyKeepsize);
                break;
        }
        var i1 = null, i2 = null;
        for (var i = 0; i < data.goals.length; ++i) {
            if (data.goals[i].difficulty >= mindiff && i1 == null)
                i1 = i;
            if (data.goals[i].difficulty > maxdiff && i2 == null)
                i2 = i;
        }
        if (i1 == null)
            i1 = 0;
        if (i2 == null)
            i2 = data.goals.length;
        // ensure there are always at least 25 goals
        if (i2 - i1 < 25) {
            if (i2 == data.goals.length)
                i1 = data.goals.length - 25;
            else {
                i1 = 0;
                i2 = 25;
            }
        }
        data.goals = data.goals.slice(i1, i2);
        this.maxdifficulty = data.goals[data.goals.length - 1].difficulty;
        this.mindifficulty = data.goals[0].difficulty;
        this.modrequired = this.gamedata.modifiers && !!this.gamedata.modifiers['@required'];
        delete this.gamedata.modifiers['@required'];
        $("#game-name").text(data.name);
        $('#game-rules').toggle(!!data.rules);
        if (data.rules) {
            var rulelist = $('#game-rules ul');
            $('li.game-gen', rulelist).remove();
            for (var i = 0; i < data.rules.length; ++i)
                rulelist.append($('<li>').addClass('game-gen').html(data.rules[i]));
        }
        $('#bingo-attrib').toggle(!!data.author);
        if (data.author)
            $('#bingo-author').text(data.author);
    }

    /**
     * Another huge monolithic method that does something.
     */
    generateBoard() {
        var goal, goalsTable = this.gamedata.goals.clone(), goalIndex;
        var m, ms = this.gamedata.modifiers || {};
        var tagdata = this.gamedata.tags;
        var usedgoals = [];
        var range = this.maxdifficulty - this.mindifficulty;
        for (var cardY = 0; cardY < this.size; ++cardY)
            for (var cardX = 0; cardX < this.size; ++cardX) {
                for (var attempt = 0; ; attempt++) {
                    // failsafe: widen search space after 25 iterations
                    var variance = this.random.nextGaussian() * this.DifficultyVariance;
                    // magic.square[cardY][cardX] contains the percentage of the square out of the maximum number of squares. e.goal. square 1 = 1/25.
                    let base = Math.min(Math.max(0.0, this.magic.square[cardY][cardX] + variance), 1.0);
                    var ddiff = attempt < 25 ? (base * range) : this.random.nextInt(range);
                    // Search for the index of our difficulty.
                    goalIndex = goalsTable.bsearch(ddiff + this.mindifficulty, function (goalIndex) { return goalIndex.difficulty; });
                    if (goalIndex >= goalsTable.length) {
                        goalIndex = goalsTable.length - 1;
                        console.log(goalIndex, goalsTable.length);
                    }
                    // Search for the range of goals that fit within our difficulty.
                    var minDifficultyIdx, maxDifficultyIdx;
                    for (minDifficultyIdx = goalIndex; minDifficultyIdx > 0 && goalsTable[minDifficultyIdx - 1].difficulty == goalsTable[minDifficultyIdx].difficulty; --minDifficultyIdx)
                        ;
                    for (maxDifficultyIdx = goalIndex; maxDifficultyIdx < goalsTable.length - 1 && goalsTable[maxDifficultyIdx + 1].difficulty == goalsTable[maxDifficultyIdx].difficulty; ++maxDifficultyIdx)
                        ;
                    console.log("Minimum difficulty index:", minDifficultyIdx, " | Max difficulty index:", maxDifficultyIdx);
                    // Select the goal for the difficulty.
                    goalIndex = minDifficultyIdx + this.random.nextInt(maxDifficultyIdx - minDifficultyIdx);
                    console.log("Selected goal index for difficulty:", goalIndex);
                    console.log("Selected goal name:", goalsTable[goalIndex].name);
                    // Set goal.
                    goal = this.board[cardY][cardX].goal = goalsTable[goalIndex];
                    if (!goal)
                        continue;
                    var vmods = ms["*"] || [], tags = goal.tags || [], valid = !usedgoals.contains(goal.id);
                    var invalidReason = "Valid goal.";
                    var img = null;
                    for (var k = 0; k < tags.length; ++k) {
                        var negated = tags[k].charAt(0) == "-" ? tags[k].substr(1) : ("-" + tags[k]);
                        var tdata = tagdata[tags[k]];
                        var allowmult = tdata && tdata.allowmultiple !== undefined ? tdata.allowmultiple : false;
                        // get the image
                        if (!img && tags[k].charAt(0) != '-' && tdata && tdata.image)
                            img = tdata.image;
                        // failsafe: after 50 iterations, don't constrain on allowmultiple tags
                        if (attempt > 50)
                            allowmult = true;
                        // failsafe: after 75 iterations, don't constrain on singleuse tags
                        if (!(tags[k] in tagdata))
                            tdata = tagdata[tags[k]] = {};
                        if (tdata && tdata.singleuse && tdata['@used'] && attempt < 75) {
                            valid = false;
                            invalidReason = "Goal tag was already used & only one type of this tag is allowed!";
                        }
                        for (var z = 0; z < this.board[cardY][cardX].groups.length; ++z) {
                            if ((!allowmult && this.board[cardY][cardX].groups[z].contains(tags[k])) || this.board[cardY][cardX].groups[z].contains(negated)) {
                                valid = false;
                                invalidReason = "Goal tag was already used & allowmultiple is disabled!";
                            }
                        }
                    }
                    if (valid) {
                        var cell = this.board[cardY][cardX].cell;
                        usedgoals.push(goal.id);
                        if (img)
                            $('<img>').attr('src', img).appendTo(cell);
                        for (var k = 0; k < tags.length; ++k)
                            tagdata[tags[k]]['@used'] = true;
                        $("<span>").addClass("goaltext").text(goal.name).appendTo(cell);
                        goalsTable.splice(goalIndex, 1);
                        break;
                    }
                    else {
                        console.log("Goal [id]:", goal.id, "was not valid! Goal name:", goal.name, "Goal difficulty:", goal.difficulty, "Reason for invalidation:", invalidReason);
                    }
                    // safety fallout
                    if (attempt > this.MaxIterations) {
                        console.log("Could not find a suitable goal for R" + (cardY + 1) + "xC" + (cardX + 1) + " after " + attempt + " iterations");
                        $("<span>").addClass("goaltext").text("[ERROR]").appendTo(this.board[cardY][cardX].cell);
                        break;
                    }
                }
                for (var k = 0; k < tags.length; ++k) {
                    if (tags[k] in ms)
                        vmods = vmods.concat(ms[tags[k]]);
                    for (var z = 0; z < this.board[cardY][cardX].groups.length; ++z)
                        this.board[cardY][cardX].groups[z].push(tags[k]);
                }
                vmods.sort(difficulty_sort);
                if (vmods.length && (this.modrequired || this.random.nextFloat() < 0.25)) {
                    this.board[cardY][cardX].mod = m = vmods[this.random.nextInt(vmods.length)];
                    $("<span>").addClass("modtext").text(m.name).appendTo(this.board[cardY][cardX].cell);
                }
            }
    }
}



