const AI = require('./ai');
const Grid = require('./grid');

function GameManager(size) {
  this.size = size; // Size of the grid
  this.setup();
}

// Set up the game
GameManager.prototype.setup = function () {
  this.grid = new Grid(this.size);
  this.ai = new AI(this.grid);

  this.score = 0;
  this.over = false;
  this.won = false;
};

GameManager.prototype.pointCells = function (cells) {
  this.grid.pointCells(cells);
};

GameManager.prototype.pointScore = function (score) {
  this.score = score;
};

GameManager.prototype.getBest = function () {
  return this.ai.getBest();
};

// makes a given move and updates state
GameManager.prototype.move = function (direction) {
  var result = this.grid.move(direction);
  this.score += result.score;

  if (!result.won) {
    if (result.moved) {
      this.grid.computerMove();
    }
  } else {
    this.won = true;
  }

  if (!this.grid.movesAvailable()) {
    this.over = true; // Game over!
  }

  this.actuate();
};

module.exports = GameManager;
