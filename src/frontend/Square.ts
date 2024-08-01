type SquareParameters = {
  piece: ChessPiece | null;
  row: number;
  col: number;
};

export class Square {
  public htmlElement: HTMLDivElement;
  private _piece: ChessPiece | null;
  public row: number;
  public col: number;

  constructor({ col, row, piece }: SquareParameters) {
    const div = document.createElement("div");
    const isRowEven = row % 2 === 0;
    const isColEven = col % 2 === 0;
    const color = !isRowEven ? (isColEven ? "black" : "white") : isColEven ? "white" : "black";
    div.classList.add("square");
    div.classList.add(color === "black" ? "square-dark" : "square-light");

    this.htmlElement = div;
    this._piece = piece;
    this.piece = piece;
    this.row = row;
    this.col = col;
  }

  public set piece(piece: ChessPiece | null) {
    this._piece = piece;
    if (piece) {
      const img = this.htmlElement.querySelector("img")!;
      if (!img) {
        const img = document.createElement("img");
        img.classList.add("chess-piece");
        const src = `svg/${piece.color}-${piece.type}.svg`;
        img.setAttribute("src", src);
        img.setAttribute("draggable", "false");
        this.htmlElement.appendChild(img);
      } else {
        img.src = `svg/${piece.color}-${piece.type}.svg`;
      }
    } else {
      const img = this.htmlElement.querySelector("img");
      if (img) {
        img.remove();
      }
    }
  }
  public get piece(): ChessPiece | null {
    return this._piece;
  }
}
