import { Square } from "./Square.js";
import { columnNumberToLetter } from "./utils.js";

type BoardParameters = {
  pieces: Array<ChessPiece | null>;
  activeColor: ChessPieceColor;
  halfmoveClock: number;
  fullmoveNumber: number;
};

export class Board {
  public htmlElement: HTMLDivElement;
  public squares: Square[];
  public activeColor: ChessPieceColor;
  private startPieces: Array<ChessPiece | null>;
  private startColor: ChessPieceColor;
  private isReversed: boolean = false;
  private halfmoveClock: number;
  private fullmoveNumber: number;

  constructor({ pieces, activeColor, fullmoveNumber, halfmoveClock }: BoardParameters) {
    const div = document.createElement("div");
    div.classList.add("board");
    document.querySelector(".board-container")?.appendChild(div);

    const squares = [];
    let pointer = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = new Square({
          piece: pieces[pointer],
          col,
          row,
        });
        squares.push(square);
        div.appendChild(square.htmlElement);

        pointer++;
      }
    }
    this.htmlElement = div;
    this.squares = squares;
    this.activeColor = activeColor;
    this.startPieces = pieces;
    this.startColor = activeColor;
    this.halfmoveClock = halfmoveClock;
    this.fullmoveNumber = fullmoveNumber;
    this.updateSquaresCoordinates();
  }
  public getSquare(position: { x: number; y: number } | { row: number; col: number }): Square | null {
    if ("x" in position && "y" in position) {
      const squareSize = Number(getComputedStyle(document.body).getPropertyValue("--board-size").replace("px", "")) / 8;
      let row = Math.floor(position.y / squareSize);
      let col = Math.floor(position.x / squareSize);

      if (this.isReversed) {
        row = Math.abs(row - 7);
        col = Math.abs(col - 7);
      }
      const index = row * 8 + col;

      if (index < 0 || index > this.squares.length) return null;

      const square = this.squares[index];
      return square;
    }
    return this.squares.find((s) => s.row === position.row && s.col === position.col) || null;
  }
  public getKingSquare(kingColor: ChessPieceColor): Square {
    const kingSquare = this.squares.find((square) => square.piece?.type === "king" && square.piece.color === kingColor);
    if (kingSquare) return kingSquare;

    throw new Error("There is no king on the board");
  }
  public getSquares(positions: { row: number; col: number }[]): Square[] {
    return this.squares.filter((square) => positions.some(({ row, col }) => square.row === row && square.col === col));
  }
  public isEmptySquare(positions: { row: number; col: number }): boolean {
    const square = this.getSquare(positions);
    return square?.piece === null;
  }
  public rotate(color?: ChessPieceColor) {
    if (color === "black") {
      this.isReversed = true;
      this.htmlElement.classList.add("reverse");
    } else if (color === "white") {
      this.isReversed = false;
      this.htmlElement.classList.remove("reverse");
    } else {
      this.isReversed = !this.isReversed;
      this.htmlElement.classList.toggle("reverse");
    }

    this.updateSquaresCoordinates();
  }
  public restartBoard() {
    this.squares.forEach((square, i) => {
      this.activeColor = this.startColor;
      square.piece = this.startPieces[i];
    });
  }
  private updateSquaresCoordinates() {
    const firstRow = this.squares.filter((square) => square.row === (this.isReversed ? 7 : 0));
    const lastRow = this.squares.filter((square) => square.row === (this.isReversed ? 0 : 7));
    const numberColumns = this.squares.filter((square) => square.col === (this.isReversed ? 7 : 0));
    const lastColumn = this.squares.filter((square) => square.col === (this.isReversed ? 0 : 7));

    firstRow.forEach(({ htmlElement }) => {
      htmlElement.querySelectorAll("span").forEach((span) => span.remove());
    });
    lastRow.forEach(({ htmlElement }) => {
      htmlElement.querySelectorAll("span").forEach((span) => span.remove());
    });
    numberColumns.forEach(({ htmlElement }) => {
      htmlElement.querySelectorAll("span").forEach((span) => span.remove());
    });
    lastColumn.forEach(({ htmlElement }) => {
      htmlElement.querySelectorAll("span").forEach((span) => span.remove());
    });

    numberColumns.forEach(({ htmlElement, row }) => {
      htmlElement.classList.remove("text-light");
      htmlElement.classList.remove("text-dark");
      const className = this.isReversed
        ? row % 2 === 0
          ? "text-light"
          : "text-dark"
        : row % 2 === 0
        ? "text-dark"
        : "text-light";
      htmlElement.classList.add(className);
      const span = document.createElement("span");
      span.innerText = `${Math.abs(row - 8)}`;
      span.classList.add("row-number");

      htmlElement.appendChild(span);
    });

    lastRow.forEach(({ htmlElement, col }) => {
      htmlElement.classList.remove("text-light");
      htmlElement.classList.remove("text-dark");
      const className = this.isReversed
        ? col % 2 === 0
          ? "text-dark"
          : "text-light"
        : col % 2 === 0
        ? "text-light"
        : "text-dark";
      htmlElement.classList.add(className);

      const span = document.createElement("span");
      span.innerText = columnNumberToLetter(col + 1);
      span.classList.add("column-letter");

      htmlElement.appendChild(span);
    });
  }
}
