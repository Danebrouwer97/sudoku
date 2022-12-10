function getRandomFromArray<T extends Array<any>>(array: T): T[number] {
  return array[Math.floor(Math.random() * array.length)];
}
const MAX_CELL_VALUE = 9;
const MIN_CELL_VALUE = 1;
const ROW_LENGTH = 9;
const COL_LENGTH = ROW_LENGTH;

class Position {
  readonly row: number;
  readonly col: number;

  constructor(row: number, col: number) {
    this.row = row;
    this.col = col;
  }
}

const DEFAULT_CELL_VALUE = 0;
class Cell extends Position {
  value: number = DEFAULT_CELL_VALUE;

  constructor(row: number, col: number) {
    super(row, col);
  }

  setValue(value: number) {
    this.value = value;
  }

  reset() {
    this.value = DEFAULT_CELL_VALUE;
  }

  clear() {
    this.value = undefined as unknown as number;
  }
}

const QUADRANT_OFFSET = 3;
const QUADRANT_ROW_LENGTH = 3;
const QUADRANT_COL_LENGTH = QUADRANT_ROW_LENGTH;
class Quadrant {
  cellPositions: Position[];
  row: number;
  col: number;
  rowOffset: number;
  colOffset: number;

  constructor(row: number, col: number) {
    this.rowOffset = (this.row = row) * QUADRANT_OFFSET;
    this.colOffset = (this.col = col) * QUADRANT_OFFSET;
    this.cellPositions = this.generateCellPositions();
  }

  generateCellPositions() {
    return new Array(QUADRANT_ROW_LENGTH)
      .fill(null)
      .reduce((acc: Position[], _, rowIndex) => {
        new Array(QUADRANT_COL_LENGTH)
          .fill(null)
          .forEach((_, colIndex) =>
            acc.push(
              new Position(rowIndex + this.rowOffset, colIndex + this.colOffset)
            )
          );
        return acc;
      }, []);
  }
}

class Board {
  rows: Cell[][];
  quadrants: Quadrant[][];

  constructor() {
    this.rows = Board.generateCells();
    this.quadrants = Board.generateQuadrants();
  }

  private static generateCells() {
    const rows: Cell[][] = [];
    for (let rowIndex = 0; rowIndex < ROW_LENGTH; rowIndex++) {
      const row: Cell[] = [];
      for (let colIndex = 0; colIndex < COL_LENGTH; colIndex++) {
        const cell = new Cell(rowIndex, colIndex);
        row.push(cell);
      }
      rows.push(row);
    }
    return rows;
  }

  private static generateQuadrants() {
    return new Array(QUADRANT_ROW_LENGTH)
      .fill(null)
      .map((_, row) =>
        new Array(QUADRANT_COL_LENGTH)
          .fill(null)
          .map((_, col) => new Quadrant(row, col))
      );
  }

  getRow(row: number) {
    return this.rows[row];
  }

  getCol(col: number): Cell[] {
    const cache: { [col: number]: Cell[] } = {};
    this.getCol = (col: number) => {
      if (!cache[col]) {
        return (cache[col] = this.rows.map((row) => row[col]));
      }
      return cache[col];
    };
    return this.getCol(col);
  }

  getCell(position: Position) {
    return this.rows[position.row][position.col];
  }

  getQuadrantCells(quadrantRow: number, quadrantCol: number) {
    const quadrant = this.quadrants[quadrantRow][quadrantCol];
    return quadrant.cellPositions.map((position) => this.getCell(position));
  }

  reset() {
    for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
      const row = this.rows[rowIndex];
      for (let col = 0; col < row.length; col++) {
        const cell = row[col];
        cell.reset();
      }
    }
  }

  print() {
    const textRowEnd = new Array(13).fill('-').join(' ');
    const textRowSeparator = [
      '|',
      new Array(QUADRANT_COL_LENGTH)
        .fill(new Array(QUADRANT_COL_LENGTH).fill('-').join(' '))
        .join(' + '),
      '|',
    ].join(' ');
    this.print = () => {
      console.log(
        this.rows
          .reduce(
            (acc, row, i, arr) => {
              // 000000000
              const rowValuesAsText = row.map((cell) => cell.value).join('');
              // [000,000,000]
              const groupedValues = rowValuesAsText.match(/(?:\d\d\d)/g);
              // ["0 0 0","0 0 0","0 0 0",]
              // 0 0 0 | 0 0 0 | 0 0 0
              const joinedValues = groupedValues
                ?.map((groupedValues) => groupedValues.split('').join(' '))
                .join(' | ');
              // | 0 0 0 | 0 0 0 | 0 0 0 |
              const formattedRow = `| ${joinedValues} |`;
              acc.push(formattedRow);

              if (i === arr.length - 1) {
                acc.push(textRowEnd);
              } else if ((i + 1) % 3 === 0 && arr[i]) {
                acc.push(textRowSeparator);
              }

              return acc;
            },
            [textRowEnd]
          )
          .join('\n')
      );
    };
    this.print();
  }
}

class TreeNode {
  cell: Cell;
  parent?: TreeNode;
  children = new Map<Cell, TreeNode>();

  constructor(cell: Cell) {
    this.cell = cell;
  }

  getChild(cell: Cell) {
    return this.children.get(cell);
  }

  setChild(treeNode: TreeNode) {
    this.children.set(treeNode.cell, treeNode);
    treeNode.parent = this;
    return treeNode;
  }
}
enum Difficulty {
  EASY,
  MEDIUM,
  HARD,
}
export class Sudoku {
  board: Board;

  constructor() {
    this.board = new Board();
    this.populateBoard();
  }

  static printBoard(board: Board, group?: string) {
    if (group) {
      console.group(group);
    }
    board.print();
    if (group) {
      console.groupEnd();
    }
  }

  // #region Populate Board
  private static getValidCellsForValue(
    board: Board,
    cells: Cell[],
    valueToAssign: number
  ) {
    return cells.filter((cell) => {
      // No value in cell
      if (cell.value !== DEFAULT_CELL_VALUE) {
        return false;
      }

      // No conflicting value in row
      const row = board.getRow(cell.row);
      if (row.some((cell) => cell.value === valueToAssign)) {
        return false;
      }

      // No conflicting value in col
      const col = board.getCol(cell.col);
      if (col.some((cell) => cell.value === valueToAssign)) {
        return false;
      }

      return true;
    });
  }

  private static getValidQuadrantCellsForValue(
    board: Board,
    quadrantRow: number,
    quadrantCol: number,
    valueToAssign: number
  ) {
    const quadrantCells = board.getQuadrantCells(quadrantRow, quadrantCol);

    return this.getValidCellsForValue(board, quadrantCells, valueToAssign);
  }

  private static filterCellsByDecisionNode(
    cells: Cell[],
    decisionNode: TreeNode
  ) {
    // Doesn't exist in decision tree
    return cells.filter((cell) => {
      if (!decisionNode) {
        return true;
      }
      const child = decisionNode?.getChild(cell);
      return !child;
    });
  }

  private static cellRowToQuadrantRow(row: number) {
    return Math.floor(row / QUADRANT_ROW_LENGTH);
  }

  private static cellColToQuadrantCol(col: number) {
    return Math.floor(col / QUADRANT_COL_LENGTH);
  }

  populateBoard() {
    this.board.reset();

    let decisionNode!: TreeNode;

    for (
      let valueToAssign = MIN_CELL_VALUE;
      valueToAssign <= MAX_CELL_VALUE;
      valueToAssign++
    ) {
      for (
        let quadrantRow = 0;
        quadrantRow < QUADRANT_ROW_LENGTH;
        quadrantRow++
      ) {
        for (
          let quadrantCol = 0;
          quadrantCol < QUADRANT_COL_LENGTH;
          quadrantCol++
        ) {
          const validQuadrantCells = Sudoku.getValidQuadrantCellsForValue(
            this.board,
            quadrantRow,
            quadrantCol,
            valueToAssign
          );

          const filteredQuadrantCells = Sudoku.filterCellsByDecisionNode(
            validQuadrantCells,
            decisionNode
          );

          const randomizedCell = getRandomFromArray(filteredQuadrantCells);

          if (!randomizedCell) {
            quadrantRow = Sudoku.cellRowToQuadrantRow(decisionNode.cell.row);
            quadrantCol =
              Sudoku.cellColToQuadrantCol(decisionNode.cell.col) - 1;
            valueToAssign = decisionNode.cell.value;

            decisionNode.cell.reset();

            if (!decisionNode.parent) {
              throw new Error(
                'Had no more decisions to undo, something is wrong.'
              );
            }
            decisionNode = decisionNode.parent;
            continue;
          }

          randomizedCell.setValue(valueToAssign);
          if (!decisionNode) {
            decisionNode = new TreeNode(randomizedCell);
          } else {
            decisionNode = decisionNode?.setChild(new TreeNode(randomizedCell));
          }
        }
      }
    }
  }
  // #endregion

  removeNumbersFromBoard(difficulty: Difficulty = Difficulty.EASY) {
    for (
      let quadrantRow = 0;
      quadrantRow < QUADRANT_ROW_LENGTH;
      quadrantRow++
    ) {
      for (
        let quadrantCol = 0;
        quadrantCol < QUADRANT_COL_LENGTH;
        quadrantCol++
      ) {
        const quadrantCells = this.board.getQuadrantCells(
          quadrantRow,
          quadrantCol
        );

        const randomCell = getRandomFromArray(quadrantCells);

        randomCell.clear();
      }
    }
  }
}
