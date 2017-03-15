// Blank space constant
var BLANK = "x";
var Player_1 = {
  chip: "R",
  captures: 0,
  reserve: [],
  recentMoves: [],
};
var Player_2 = {
  chip: "G",
  captures: 0,
  reserve: [],
  recentMoves: [],
};

// Tree class
var Tree = function(r) {
	return {
		root: r,
		addNode: function(r, n) {
			n.parent = r;
			r.children.push(n);
		},
	};
};

// Node class
var Node = function(d) {
	return {
		data: d,
		parent: undefined,
		children: [],
		addChildren: function(nodes) {
			for (var i = 0; i < nodes.length; i++) {
				this.children.push(nodes[i]);
				nodes[i].parent = this;
			}
		}
	};
};

var movesEquals = function(move1, move2) {
  if (move1 === undefined || move2 === undefined) {
    return false;
  }

  if (move1.fromCell.r != move2.fromCell.r) {
    return false;
  }

  if (move1.fromCell.c != move2.fromCell.c) {
    return false;
  }

  if (move1.toCell.r != move2.toCell.r) {
    return false;
  }

  if (move1.toCell.c != move2.toCell.c) {
    return false;
  }


  if (move1.fromCell.value.length != move2.fromCell.value.length) {
    return false;
  }

  if (move1.toCell.value.length != move2.toCell.value.length) {
    return false;
  }


  for (var i = 0; i < move1.fromCell.value.length; i++) {
    if (move1.fromCell.value[i] != move2.fromCell.value[i]) {
      return false;
    }
  }

  for (var i = 0; i < move1.toCell.value.length; i++) {
    if (move1.toCell.value[i] != move2.toCell.value[i]) {
      return false;
    }
  }

  return true;
};

var getMove = function(initial, n) {
  for (var r = 0; r < n.data.board.length; r++) {
    for (var c = 0; c < n.data.board[r].length; c++) {
      if (n.data.board[r][c] != BLANK) {
        if (n.data.board[r][c].length != initial.data.board[r][c].length) {
          if (n.data.board[r][c].length < initial.data.board[r][c].length) {
            fromCell = {
              r: r,
              c: c,
              value: initial.data.board[r][c],
            };
          } else {
            toCell = {
              r: r,
              c: c,
              value: n.data.board[r][c],
            };
          }
        }
      }
    }
  }

  return {
    toCell: toCell,
    fromCell: fromCell,
  };
};

// Production System
/**
 * @param {Node} n - node to expand with the rules of the transporation probl
 * @param {String} player - the player making the move
 * @param {Function} heuristic - used to determine cost of node - OPTIONAL
 * @param {Object} playerHeuristic - the player to use for the heuristic - OPTIONAL - may be the player making the move
 * @param {Integer} min - used to determine if child should be pruned - OPTIONAL
 * @return {Array} children - children of n
 */
var expand = function(n, player, heuristic, playerHeuristic, min) {
  // 5 pieces max on each board cell
  // Only can move stacks a player owns (top chip is theirs)
  // Can move up, down, left or right
  // Can move any # of squares EQUAL TO OR LESS THAN the height of the stack moving
  // Can elect to move less than an entire stack - max distance of # of moving chips
  // Moved stack goes ON TOP of the stack it is moved on to
  // If the resulting stack is greater than 5, it is "captured"
  // The first 5 chips are then "removed" and given to the capturing player (not to be replayed)

  var children = [];
  var child;

  var copyNode = function(nToCopy) {
    var newBoard = [];
    for (var r = 0; r < nToCopy.data.board.length; r++) {
      newBoard.push([]);
      for (var c = 0; c < nToCopy.data.board[r].length; c++) {
        if (nToCopy.data.board[r][c] === BLANK) {
          newBoard[r].push(BLANK);
        } else {
          newBoard[r].push(nToCopy.data.board[r][c].slice());
        }
      }
    }

    return Node({
      board: newBoard,
      cost: nToCopy.data.cost,
    });
  };

  // fromIndex and toIndex are objects defined as
  // {r: rVal, c: cVal}
  var moveChips = function(nBoard, fromIndex, toIndex, numChips) {
    var fromCell = nBoard[fromIndex.r][fromIndex.c];
    var toCell   = nBoard[toIndex.r][toIndex.c];
    toCell = toCell.concat(fromCell.splice(-numChips, numChips));
    nBoard[fromIndex.r][fromIndex.c] = fromCell;
    nBoard[toIndex.r][toIndex.c] = toCell;
  };

  var shouldExpand = true;
  var dumpedChips  = false;
  for (var r = 0; r < n.data.board.length && shouldExpand; r++) {
    for (var c = 0; c < n.data.board[r].length && shouldExpand; c++) {
      var cell = n.data.board[r][c];
      // Cell is not a blank, has chips on it AND the top chip is the player chip
      // .. (eg. they own this stack)
      if (cell != BLANK && cell.length > 0 && cell[cell.length-1] === player.chip) {
        var board = n.data.board;
        // Increment AWAY from current cell
        // Incremening up to the length is not an issue
        for (var i = 1; i <= cell.length && shouldExpand; i++) {
          // Down - inside board constraints AND not blank
          if (board[r+i] != undefined && board[r+i][c] != undefined && board[r+i][c] != BLANK) {
            child = copyNode(n);
            moveChips(child.data.board, {r: r, c: c}, {r: r+i, c: c}, i);
            if (heuristic != undefined && min != undefined) {
              child.data.cost = heuristic(child, playerHeuristic.chip);
              if (child.data.cost > min) {
                children.push(child);
              } else {
                shouldExpand = false;
                break;
              }
            } else {
              children.push(child);
            }
          }

          // Up
          if (board[r-i] != undefined && board[r-i][c] != undefined && board[r-i][c] != BLANK) {
            child = copyNode(n);
            moveChips(child.data.board, {r: r, c: c}, {r: r-i, c: c}, i);
            if (heuristic != undefined && min != undefined) {
              child.data.cost = heuristic(child, playerHeuristic.chip);
              if (child.data.cost > min) {
                children.push(child);
              } else {
                shouldExpand = false;
                break;
              }
            } else {
              children.push(child);
            }
          }

          // Left
          if (board[r][c-i] != undefined && board[r][c-i] != BLANK) {
            child = copyNode(n);
            moveChips(child.data.board, {r: r, c: c}, {r: r, c: c-i}, i);
            if (heuristic != undefined && min != undefined) {
              child.data.cost = heuristic(child, playerHeuristic.chip);
              if (child.data.cost > min) {
                children.push(child);
              } else {
                shouldExpand = false;
                break;
              }
            } else {
              children.push(child);
            }
          }

          // Right
          if (board[r][c+i] != undefined && board[r][c+i] != BLANK) {
            child = copyNode(n);
            moveChips(child.data.board, {r: r, c: c}, {r: r, c: c+i}, i);
            if (heuristic != undefined && min != undefined) {
              child.data.cost = heuristic(child, playerHeuristic.chip);
              if (child.data.cost > min) {
                children.push(child);
              } else {
                shouldExpand = false;
                break;
              }
            } else {
              children.push(child);
            }
          }

          // Reserve moves
          // Just dump entire reserve on to each cell and see what happens
          if (player.reserve.length > 0) {
            child = copyNode(n);
            child.data.board[r][c].push(player.reserve);
            if (heuristic != undefined && min != undefined) {
              child.data.cost = heuristic(child, playerHeuristic.chip);
              if (child.data.cost > min) {
                children.push(child);
                dumpedChips = true;
              } else {
                shouldExpand = false;
                break;
              }
            } else {
              children.push(child);
            }
          }
        }
      }
    }
  }

  if (dumpedChips) {
    player.reserve = [];
  }

  // There are no nodes because player cannot make any more!
  // This is a very good move in context, make it have high cost
  if (shouldExpand && children.length === 0) {
    if (heuristic != undefined) n.data.cost = heuristic(n, playerHeuristic.chip);
    // Given that we are changing the root from this and unsuccessfully adding it
    // .. to the child array, this should not work / be necessary
    // However, it is, for some reason
    return n;
  }

	return children;
};

var getNodeString = function(n) {
  if (!n) return undefined;
  var str = "";
  for (var r = 0; r < n.data.board.length; r++) {
    str += "[";
    for (var c = 0; c < n.data.board[r].length; c++) {
      if (n.data.board[r][c] != BLANK) {
        str += "[";
      }
      str += n.data.board[r][c];
      if (n.data.board[r][c] != BLANK) {
        str += "]";
      }
      str += (c < n.data.board[r].length-1) ? ", " : "";
    }
    str += "]\n";
  }
  return str;
};

// Mini - Max Algorithm
/**
 * @param {Node} root - starting state
 * @param {String} player - player moving
 * @param {Function} heuristic
 * @return {Node} the new state the game is in after move
 */
var miniMax = function(root, player, heuristic) {
  // Must reset cost
  root.data.cost = 0;
  root.children = [];
  root.addChildren(expand(root, player));

  var opponent = (player === Player_1) ? Player_2 : Player_1;

  if (root.children.length > 0) {
    // Adding grandchildren
    var min = -1;
    for (var i = 0; i < root.children.length; i++) {
      // This expands the children (if above min) and sets costs
      root.children[i].addChildren(expand(root.children[i], opponent, heuristic, player, min));

      // Find min cost from this group of grandchildren
      root.children[i].children.sort(function(a, b) { return a.data.cost - b.data.cost; });
      // After sorting, [0] is the min valued node
      // Attach this cost to its parent
      // There may be no children due to pruning, so check that first
      if (root.children[i].children.length > 0) {
        root.children[i].data.cost = root.children[i].children[0].data.cost;
        min = root.children[i].children[0].data.cost;
      }
    }

    // Find max cost from the root's children
    root.children.sort(function(a, b) { return b.data.cost - a.data.cost; });

    var decision;
    if (root.children[0].data.cost === root.children[root.children.length-1].data.cost) {
      // Choose a random decision since the best and worst cost are the same
      decision = root.children[Math.floor(Math.random() * root.children.length)];
    } else {
      // After sorting, [0] is the max valued node - our goal
      // However, if multiple children have same best cost, pick a random one
      var listOfMoves = [];
      var bestMoveCost = root.children[0].data.cost;
      for (var i = 0; i < root.children.length && bestMoveCost === root.children[i].data.cost; i++) {
        listOfMoves.push(root.children[i]);
      }

      // Contains more than just the best move
      if (listOfMoves.length > 1) {
        // Pick a random best move
        decision = listOfMoves[Math.floor(Math.random() * listOfMoves.length)];
      } else {
        // Pick the only best move
        decision = root.children[0];
      }
    }

    // Store last 2 moves in each player
    // If current move is the same as the move from x moves ago, do something random
    player.recentMoves.push(decision);
    if (player.recentMoves.length > 2) {
      var twoMovesAgo  = getMove(root, player.recentMoves.splice(0, 1)[0]);
      var decisionMove = getMove(root, decision);
      if (twoMovesAgo != undefined && decisionMove != undefined && movesEquals(twoMovesAgo, decisionMove)) {
        // If this move has been done 2 moves ago, do something random
        decision = root.children[Math.floor(Math.random() * root.children.length)];
        player.recentMoves.pop();
        player.recentMoves.push(decision);
        console.log("Moving randomly");
      }
    }

    // Return decision
    return decision;
  } else {
    return false;
  }
};

var generateBoard = function(n) {
  var player1Locations = function() {
    var list = [];
    var chips = 18; // In the rules
    var range = 36; // 0 to 36 non-inclusive - the playing area

    for (var i = 0; i < chips; i++) {
      do {
        var loc = Math.floor(Math.random() * range);
      } while (list.indexOf(loc) > -1);

      list.push(loc);
    }

    return list;
  }();

  // Make a blank board
  state.data.board.push([BLANK, BLANK, [], [], [], [], BLANK, BLANK]);
  state.data.board.push([BLANK, [], [], [], [], [], [], BLANK]);
  for (var i = 0; i < 4; i++) {
    state.data.board.push([[], [], [], [], [], [], [], []]);
  }
  state.data.board.push([BLANK, [], [], [], [], [], [], BLANK]);
  state.data.board.push([BLANK, BLANK, [], [], [], [], BLANK, BLANK]);

  var counter = 0;
  var htmlRows = document.getElementsByClassName("row");
  // Add player 1 and player 2 chips
  // Start at row 1 and end one row early (miss the border cells)
  for (var r = 1; r < state.data.board.length-1; r++) {
    // Start at column 1 and end one column early (miss the border cells)
    for (var c = 1; c < state.data.board[r].length-1; c++) {
      // This index has been generated to be for player 1
      if (player1Locations.indexOf(counter) > -1) {
        state.data.board[r][c].push(Player_1.chip);
        htmlRows[r].children[c].className = "cell red";
      } else {
        state.data.board[r][c].push(Player_2.chip);
        htmlRows[r].children[c].className = "cell green";
      }

      counter += 1;
    }
  }
};

// Counts the number of top level chips the player owns
var ownChipHeuristic = function(n, pChip) {
  var ownCounter = 0;
  for (var r = 0; r < n.data.board.length; r++) {
    for (var c = 0; c < n.data.board[r].length; c++) {
      if (n.data.board[r][c] != BLANK) {
        var cell = n.data.board[r][c];
        if (cell[cell.length-1] === pChip) {
          ownCounter += 1;
        }
      }
    }
  }

  return ownCounter;
};

var chipDifferential = function(n, pChip) {
  var ownCounter = 0;
  var oppCounter = 0;

  for (var r = 0; r < n.data.board.length; r++) {
    for (var c = 0; c < n.data.board[r].length; c++) {
      if (n.data.board[r][c].length > 0 && n.data.board[r][c][0] != BLANK) {
        var cell = n.data.board[r][c];
        if (cell[cell.length-1] === pChip) {
          ownCounter += 1;
        } else {
          oppCounter += 1;
        }
      }
    }
  }

  return ownCounter - oppCounter;
};

// Counts the number of captures to be made
var ownCaptures = function(n, pChip) {
  var captures = 0;
  for (var r = 0; r < n.data.board.length; r++) {
    for (var c = 0; c < n.data.board[r].length; c++) {
      if (n.data.board[r][c] != BLANK) {
        var cell = n.data.board[r][c];
        if (cell[cell.length-1] === pChip && cell.length > 5) {
          captures += 1;
        }
      }
    }
  }

  return captures;
};

var smartHeuristic = function(n, pChip) {
  var captures = ownCaptures(n, pChip);
  if (captures > 0) {
    return captures*100;
  } else {
    return chipDifferential(n, pChip);
  }
};

var randomHeuristic = function() {
  return 0;
};

// Checks for captures and finds out what
// chips were moved for the UI
/**
 * @param {Node} initial - before move
 * @param {Node} n - after move
 * @param {Player} player - who moved
 * @return {Node} new state
 */
var confirmMove = function(initial, n, player) {
  if (n) {
    var fromCell;
    var toCell;

    for (var r = 0; r < n.data.board.length; r++) {
      for (var c = 0; c < n.data.board[r].length; c++) {
        // Something changed here
        if (n.data.board[r][c].length < initial.data.board[r][c].length) {
          fromCell = {
            r: r,
            c: c,
            value: initial.data.board[r][c],
          };
        } else if (n.data.board[r][c].length > initial.data.board[r][c].length) {
          toCell = {
            r: r,
            c: c,
            value: n.data.board[r][c],
          };
        }

        // Counts captures and maintains reserves
        if (n.data.board[r][c].length > 5) {
          player.captures += 1;
          var pieces = n.data.board[r][c].splice(0, 5);
          console.log(player.chip + " got a capture!");
          for (var i = 0; i < pieces.length; i++) {
            if (pieces[i] === player.chip) {
              player.reserve.push(pieces[i]);
            }
          }

          var className = (player.chip === Player_1.chip) ? "red" : "green";
          var htmlCapture = document.getElementsByClassName("captures " + className)[0];
          var newDiv = document.createElement("div");
          newDiv.className = "cell " + className;
          htmlCapture.appendChild(newDiv);
        }
      }
    }

    if (fromCell != undefined) {
      // console.log("Cell [" + fromCell.r + "][" + fromCell.c + "]: [" + fromCell.value + "]");
      // console.log("moved to");
      // console.log("Cell [" + toCell.r + "][" + toCell.c + "]: [" + toCell.value + "]");

      var htmlRows = document.getElementsByClassName("row");
      for (var i = 0; i < 2; i++) {
        var cell = (i === 0) ? fromCell : toCell;
        cell.value = ((i === 0) ? n.data.board[fromCell.r][fromCell.c] : cell.value);
        var className = "cell";
        if (cell.value[cell.value.length-1] === Player_1.chip) {
          className += " red";
        } else if (cell.value[cell.value.length-1] === Player_2.chip) {
          className += " green";
        }

        htmlRows[cell.r].children[cell.c].className = className;
        var text = (cell.value.length > 0) ? cell.value.length : "";
        htmlRows[cell.r].children[cell.c].innerText = text;
      }
    } else {
      console.log("Nothing changed here???");
    }

    return n;
  } else {
    return false;
  }
};

var state = Node({
  board: [], // will be a list of lists
  cost: 0,
});

generateBoard(state);
var run = function(i) {
  var player = (i%2 === 0) ? Player_1 : Player_2;
  var heuristic = (i%2 === 0) ? chipDifferential: chipDifferential;
  state = confirmMove(state, miniMax(state, player, heuristic), player);
  state.parent = undefined;
  // console.log(getNodeString(state));
  console.log("Move: " + (i+1));
};

var callCount = 0;
var repeater = setInterval(function() {
  if (state) {
    run(callCount);
    callCount += 1;
  } else {
    clearInterval(repeater);
  }
}, 0);
