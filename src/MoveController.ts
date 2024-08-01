import { Board } from "./Board.js";
import { OpeningsController } from "./OpeningsController.js";
import { Square } from "./Square.js";
import { columnNumberToLetter, getPieceLetter, getPieceType, parseChessCoordinate } from "./utils.js";

type Move = {
  targetSquare: Square;
  castling?: boolean;
  promotion?: boolean;
  enPassant?: boolean;
};

type MoveControllerParameters = {
  board: Board;
  openingsController: OpeningsController;
  castlingRights?: CastlingRights;
  enPassantTarget: string | null;
};

const defaultCastlingRights = {
  white: { kingside: true, queenside: true },
  black: { kingside: true, queenside: true },
};

export class MoveController {
  public isMovesDisabled: boolean = false;
  private board: Board;
  private castlingRights: CastlingRights;
  private enPassantTarget: string | null;
  private isChecking: boolean = false;
  private openingsController: OpeningsController;

  constructor({
    board,
    openingsController,
    castlingRights = defaultCastlingRights,
    enPassantTarget,
  }: MoveControllerParameters) {
    this.board = board;
    this.castlingRights = castlingRights;
    this.enPassantTarget = enPassantTarget;
    this.openingsController = openingsController;
  }
  public makeMove(fromSquare: Square, toSquare: Square): void {
    const { activeColor } = this.board;
    if (fromSquare.piece == null) return;
    if (fromSquare.piece.color !== activeColor) return;
    if (fromSquare === toSquare) return;

    const move = this.getLegalMoves(fromSquare).find((move) => move.targetSquare === toSquare);
    if (!move) return;
    if (!this.simulateMoveAndCheckKingSafety(fromSquare, toSquare)) return;

    const isCapture = Boolean(toSquare.piece);
    const isMoveRight = this.openingsController.isMoveRight(
      this.getPGNMove(fromSquare, toSquare, isCapture),
      activeColor
    );

    if (!isMoveRight) return;

    this.updateCastlingRights(fromSquare, activeColor);
    this.updateEnPassantTarget(fromSquare, toSquare, activeColor);
    if (move.enPassant) this.makeEnPassantMove(toSquare, activeColor);
    if (move.castling) this.makeCastlingMove(toSquare);
    if (move.promotion) this.onPromotion(toSquare);

    const piece = fromSquare.piece;
    fromSquare.piece = null;
    toSquare.piece = piece;

    this.isChecking = this.isCheck(toSquare);

    this.board.activeColor = activeColor === "white" ? "black" : "white";
    const nextMove = this.openingsController.getNextMove(this.board.activeColor);

    if (nextMove) this.makePGNMove(nextMove);
  }
  public makePGNMove(pgnMove: string) {
    const match = pgnMove.match(/[KQRBN]/);
    const move = pgnMove.replace("x", "").replace(/[KQRBN]/, "");
    const piece = getPieceType(match ? match[0] : "");

    const position = parseChessCoordinate(move);
    const targetSquare = this.board.getSquare(position);
    const fromSquare = this.board.squares.find(
      (square) =>
        square.piece &&
        square.piece.type === piece &&
        this.getLegalMoves(square).some((move) => move.targetSquare === targetSquare)
    );
    if (!targetSquare || !fromSquare) return;

    this.makeMove(fromSquare, targetSquare);
  }
  public getLegalMoves(square: Square): Move[] {
    if (square.piece === null) return [];

    switch (square.piece.type) {
      case "king":
        return this.getKingMoves(square);
      case "pawn":
        return this.getPawnMoves(square);
      case "queen":
        return this.getQueenMoves(square);
      case "rook":
        return this.getRookMoves(square);
      case "bishop":
        return this.getBishopMoves(square);
      case "knight":
        return this.getKnightMoves(square);
      default:
        return [];
    }
  }
  private getPGNMove(fromSquare: Square, toSquare: Square, isCapture: boolean) {
    if (!fromSquare.piece) return "";
    const pieceLetter = getPieceLetter(fromSquare.piece?.type);
    let letter = pieceLetter === "P" ? "" : pieceLetter;
    if (pieceLetter === "P" && isCapture) letter = columnNumberToLetter(fromSquare.col + 1);

    const columnLetter = columnNumberToLetter(toSquare.col + 1);
    const row = Math.abs(toSquare.row - 7) + 1;

    return `${letter}${isCapture ? "x" : ""}${columnLetter}${row}`;
  }
  private simulateMoveAndCheckKingSafety(fromSquare: Square, toSquare: Square): boolean {
    const { activeColor } = this.board;
    const fromSquarePiece = fromSquare.piece;
    const toSquarePiece = toSquare.piece;

    fromSquare.piece = null;
    toSquare.piece = fromSquarePiece;

    const kingSqaure = this.board.getKingSquare(activeColor);
    const isStillCheck = this.isSquareAttacked(kingSqaure);

    fromSquare.piece = fromSquarePiece;
    toSquare.piece = toSquarePiece;

    if (isStillCheck) {
      kingSqaure.htmlElement.style.backgroundColor = "red";
      setTimeout(() => (kingSqaure.htmlElement.style.backgroundColor = ""), 200);
      return false;
    }
    return true;
  }

  private isCheck(square: Square): boolean {
    const opponentKing = this.board.squares.find(
      (s) => s.piece && s.piece.color !== square.piece?.color && s.piece.type === "king"
    );
    if (!opponentKing) return false;

    const moves = this.getLegalMoves(square);
    return moves.some((move) => move.targetSquare === opponentKing);
  }
  private isSquareAttacked(square: Square): boolean {
    const { row, col } = square;
    const { activeColor } = this.board;
    const pawnDirection = activeColor === "black" ? 1 : -1;

    const knigthPositions = [
      { row: row + 2, col: col + 1 },
      { row: row + 2, col: col - 1 },
      { row: row - 2, col: col + 1 },
      { row: row - 2, col: col - 1 },
      { row: row + 1, col: col + 2 },
      { row: row + 1, col: col - 2 },
      { row: row - 1, col: col + 2 },
      { row: row - 1, col: col - 2 },
    ];
    const knightSqaures = this.board.getSquares(knigthPositions);
    const isKnightsAttack = knightSqaures.some(
      (square) => square.piece && square.piece.color !== activeColor && square.piece.type === "knight"
    );

    const kingPositions = [
      { row: row - 1, col: col - 1 },
      { row, col: col - 1 },
      { row: row + 1, col: col - 1 },
      { row: row - 1, col: col + 1 },
      { row, col: col + 1 },
      { row: row + 1, col: col + 1 },
      { row: row + 1, col },
      { row: row - 1, col },
    ];
    const kingSqaures = this.board.getSquares(kingPositions);
    const isKingAttack = kingSqaures.some(
      (square) => square.piece && square.piece.color !== activeColor && square.piece.type === "king"
    );

    const pawnPositions = [
      { row: row + pawnDirection, col: col - 1 },
      { row: row + pawnDirection, col: col + 1 },
    ];
    const pawnSqaures = this.board.getSquares(pawnPositions);
    const isPawnAttack = pawnSqaures.some(
      (square) => square.piece && square.piece.color !== activeColor && square.piece.type === "pawn"
    );

    const diagonalMoves = this.getDiagonalMoves(square.row, square.col);
    const diagonalSquares = this.board.getSquares(diagonalMoves);

    const isDiagonalPieceAttack = diagonalSquares.some(
      (square) =>
        square.piece &&
        square.piece.color !== activeColor &&
        (square.piece.type === "queen" || square.piece.type === "bishop")
    );
    const horizontalMoves = this.getHorizontalMoves(square.row, square.col);
    const horizontalSquares = this.board.getSquares(horizontalMoves);

    const isHorizontalPieceAttack = horizontalSquares.some(
      (square) =>
        square.piece &&
        square.piece.color !== activeColor &&
        (square.piece.type === "queen" || square.piece.type === "rook")
    );

    const verticalMoves = this.getVerticalMoves(square.row, square.col);
    const verticalSquares = this.board.getSquares(verticalMoves);

    const isVerticalPieceAttack = verticalSquares.some(
      (square) =>
        square.piece &&
        square.piece.color !== activeColor &&
        (square.piece.type === "queen" || square.piece.type === "rook")
    );

    return (
      isKnightsAttack ||
      isKingAttack ||
      isPawnAttack ||
      isDiagonalPieceAttack ||
      isHorizontalPieceAttack ||
      isVerticalPieceAttack
    );
  }

  private getKingMoves(square: Square): Move[] {
    if (square.piece?.type !== "king") return [];

    const { row, col } = square;
    const kingColor = square.piece.color;

    const kingsMoves = [
      { row: row - 1, col: col - 1 },
      { row: row - 1, col: col },
      { row: row - 1, col: col + 1 },
      { row: row, col: col - 1 },
      { row: row, col: col + 1 },
      { row: row + 1, col: col - 1 },
      { row: row + 1, col: col },
      { row: row + 1, col: col + 1 },
    ];

    const moves: Move[] = this.board
      .getSquares(kingsMoves)
      .filter((square) => (square.piece === null || square.piece.color !== kingColor) && !this.isSquareAttacked(square))
      .map((square) => {
        return { targetSquare: square };
      });

    if (this.castlingRights[square.piece.color].kingside) {
      const squareH = this.board.getSquare({ row, col: 7 });
      const squareG = this.board.getSquare({ row, col: 6 });
      const squareF = this.board.getSquare({ row, col: 5 });
      const arePiecesBetween = squareG && squareF && (squareG.piece || squareF.piece);
      const areSquaresAttacked =
        squareG && squareF && (this.isSquareAttacked(squareG) || this.isSquareAttacked(squareF));

      if (
        squareH?.piece?.type === "rook" &&
        squareH.piece.color === kingColor &&
        !this.isChecking &&
        !arePiecesBetween &&
        !areSquaresAttacked
      ) {
        if (squareG) {
          moves.push({ targetSquare: squareG, castling: true });
        }
      }
    }
    if (this.castlingRights[square.piece.color].queenside) {
      const squareA = this.board.getSquare({ row, col: 0 });
      const squareB = this.board.getSquare({ row, col: 1 });
      const squareC = this.board.getSquare({ row, col: 2 });
      const squareD = this.board.getSquare({ row, col: 3 });
      const arePiecesBetween = squareB && squareC && squareD && (squareB.piece || squareC.piece || squareD.piece);
      const areSquaresAttacked =
        squareC && squareD && (this.isSquareAttacked(squareC) || this.isSquareAttacked(squareD));
      if (
        squareA?.piece?.type === "rook" &&
        squareA.piece.color === kingColor &&
        !this.isChecking &&
        !arePiecesBetween &&
        !areSquaresAttacked
      ) {
        if (squareC) {
          moves.push({ targetSquare: squareC, castling: true });
        }
      }
    }

    return moves;
  }
  private getQueenMoves(square: Square): Move[] {
    if (square.piece?.type !== "queen") return [];

    const { row, col } = square;
    const queenMoves: Array<{ row: number; col: number }> = [
      ...this.getVerticalMoves(row, col),
      ...this.getHorizontalMoves(row, col),
      ...this.getDiagonalMoves(row, col),
    ];

    return this.board.getSquares(queenMoves).map((square) => {
      return {
        targetSquare: square,
      };
    });
  }
  private getRookMoves(square: Square): Move[] {
    if (square.piece?.type !== "rook") return [];

    const { row, col } = square;
    const rookMoves: Array<{ row: number; col: number }> = [
      ...this.getVerticalMoves(row, col),
      ...this.getHorizontalMoves(row, col),
    ];

    return this.board.getSquares(rookMoves).map((square) => {
      return {
        targetSquare: square,
      };
    });
  }
  private getBishopMoves(square: Square): Move[] {
    if (square.piece?.type !== "bishop") return [];

    const { row, col } = square;
    const bishopMoves: Array<{ row: number; col: number }> = this.getDiagonalMoves(row, col);

    return this.board.getSquares(bishopMoves).map((square) => {
      return {
        targetSquare: square,
      };
    });
  }
  private getKnightMoves(square: Square): Move[] {
    if (square.piece?.type !== "knight") return [];

    const { activeColor } = this.board;
    const { row, col } = square;

    const knightMoves: Array<{ row: number; col: number }> = [
      { row: row + 2, col: col + 1 },
      { row: row + 2, col: col - 1 },
      { row: row - 2, col: col + 1 },
      { row: row - 2, col: col - 1 },
      { row: row + 1, col: col + 2 },
      { row: row + 1, col: col - 2 },
      { row: row - 1, col: col + 2 },
      { row: row - 1, col: col - 2 },
    ];
    return this.board
      .getSquares(knightMoves)
      .filter((square) => square.piece === null || square.piece.color !== activeColor)
      .map((square) => {
        return {
          targetSquare: square,
        };
      });
  }
  private getPawnMoves(square: Square): Move[] {
    if (square.piece?.type !== "pawn") return [];

    const { row, col } = square;
    const pawnColor = square.piece.color;
    const oneForward = pawnColor === "white" ? -1 : 1;
    const startingRow = pawnColor === "white" ? 6 : 1;
    const pawnMoves: Array<{ row: number; col: number }> = [];

    if (this.board.isEmptySquare({ row: row + oneForward, col })) {
      pawnMoves.push({ row: row + oneForward, col: col });

      if (row === startingRow && this.board.isEmptySquare({ row: row + 2 * oneForward, col })) {
        pawnMoves.push({ row: row + 2 * oneForward, col: col });
      }
    }
    const captureLeft = { row: row + oneForward, col: col - 1 };
    if (!this.board.isEmptySquare(captureLeft)) {
      pawnMoves.push(captureLeft);
    }
    const captureRight = { row: row + oneForward, col: col + 1 };
    if (!this.board.isEmptySquare(captureRight)) {
      pawnMoves.push(captureRight);
    }

    const moves: Move[] = this.board
      .getSquares(pawnMoves)
      .filter((square) => square.piece?.color !== pawnColor)
      .map((targetSquare) => {
        if (targetSquare.row === startingRow + oneForward * 6) {
          return { targetSquare, promotion: true };
        }
        return { targetSquare };
      });

    if (this.enPassantTarget) {
      const coordinates = parseChessCoordinate(this.enPassantTarget);
      if (row === coordinates.row - oneForward && (col === coordinates.col - 1 || col === coordinates.col + 1)) {
        const targetSquare = this.board.getSquare(coordinates);
        if (targetSquare) {
          moves.push({ targetSquare, enPassant: true });
        }
        pawnMoves.push(coordinates);
      }
    }

    return moves;
  }
  private findDirectionalMoves(
    newCoordinates: (i: number) => { row: number; col: number }
  ): { row: number; col: number }[] {
    const activeColor = this.board.activeColor;
    const moves = [];
    let i = 1;

    while (true) {
      const coordinates = newCoordinates(i);
      const targetSquare = this.board.getSquare(coordinates);
      if (!targetSquare || targetSquare.piece?.color === activeColor) break;
      if (targetSquare.piece) {
        moves.push(coordinates);
        break;
      }
      moves.push(coordinates);
      i++;
    }
    return moves;
  }
  private getVerticalMoves(row: number, col: number): { row: number; col: number }[] {
    const moves = [
      ...this.findDirectionalMoves((i) => {
        return { row: row + i, col };
      }),
      ...this.findDirectionalMoves((i) => {
        return { row: row - i, col };
      }),
    ];
    return moves;
  }
  private getHorizontalMoves(row: number, col: number): { row: number; col: number }[] {
    const moves = [
      ...this.findDirectionalMoves((i) => {
        return { row, col: col + i };
      }),
      ...this.findDirectionalMoves((i) => {
        return { row, col: col - i };
      }),
    ];
    return moves;
  }
  private getDiagonalMoves(row: number, col: number): { row: number; col: number }[] {
    const moves = [
      ...this.findDirectionalMoves((i) => {
        return { row: row + i, col: col + i };
      }),
      ...this.findDirectionalMoves((i) => {
        return { row: row - i, col: col + i };
      }),
      ...this.findDirectionalMoves((i) => {
        return { row: row - i, col: col - i };
      }),
      ...this.findDirectionalMoves((i) => {
        return { row: row + i, col: col - i };
      }),
    ];
    return moves;
  }

  private updateCastlingRights(fromSquare: Square, activeColor: ChessPieceColor) {
    if (fromSquare.piece === null) return;

    if (fromSquare.piece.type === "king") {
      this.castlingRights[activeColor].kingside = false;
      this.castlingRights[activeColor].queenside = false;
    }
    if (fromSquare.piece.type === "rook") {
      const row = activeColor === "black" ? 0 : 7;
      if (fromSquare.row === row && fromSquare.col === 0) {
        this.castlingRights[activeColor].queenside = false;
      } else if (fromSquare.row === row && fromSquare.col === 7) {
        this.castlingRights[activeColor].kingside = false;
      }
    }
  }
  private updateEnPassantTarget(fromSquare: Square, toSquare: Square, activeColor: ChessPieceColor) {
    if (fromSquare.piece === null) return;

    this.enPassantTarget = null;
    if (fromSquare.piece.type === "pawn" && activeColor === "white" && toSquare.row === 4) {
      this.enPassantTarget = columnNumberToLetter(fromSquare.col + 1).toLocaleLowerCase() + 3;
    }
    if (fromSquare.piece.type === "pawn" && activeColor === "black" && toSquare.row === 3) {
      this.enPassantTarget = columnNumberToLetter(fromSquare.col + 1).toLocaleLowerCase() + 6;
    }
  }
  private makeEnPassantMove(toSquare: Square, activeColor: ChessPieceColor) {
    const row = toSquare.row + (activeColor === "white" ? 1 : -1);
    const captureSquare = this.board.getSquare({ row, col: toSquare.col });
    if (captureSquare) {
      captureSquare.piece = null;
    }
  }
  private makeCastlingMove(toSquare: Square) {
    let castlingRook, targetSquare;
    if (toSquare.col === 6) {
      castlingRook = this.board.getSquare({ row: toSquare.row, col: 7 });
      targetSquare = this.board.getSquare({ row: toSquare.row, col: 5 });
    } else {
      castlingRook = this.board.getSquare({ row: toSquare.row, col: 0 });
      targetSquare = this.board.getSquare({ row: toSquare.row, col: 3 });
    }
    if (castlingRook && targetSquare) {
      targetSquare.piece = castlingRook.piece;
      castlingRook.piece = null;
    }
  }
  private onPromotion(promotionSquare: Square) {
    this.isMovesDisabled = true;
    const { activeColor } = this.board;
    const menu = this.createPromotionMenu(activeColor, promote.bind(this));
    promotionSquare.htmlElement.appendChild(menu);

    function promote(this: MoveController, piece: "queen" | "rook" | "knight" | "bishop") {
      promotionSquare.piece = {
        type: piece,
        color: activeColor,
      };
      menu.remove();
      this.isMovesDisabled = false;
    }
  }
  private createPromotionMenu(
    piecesColor: ChessPieceColor,
    promote: (piece: "queen" | "rook" | "knight" | "bishop") => void
  ) {
    const menu = document.createElement("div");
    menu.classList.add("promotion-menu");

    const queen = this.createMenuItem("queen", piecesColor);
    const knight = this.createMenuItem("knight", piecesColor);
    const rook = this.createMenuItem("rook", piecesColor);
    const bishop = this.createMenuItem("bishop", piecesColor);
    queen.addEventListener("click", () => promote("queen"));
    knight.addEventListener("click", () => promote("knight"));
    rook.addEventListener("click", () => promote("rook"));
    bishop.addEventListener("click", () => promote("bishop"));
    menu.appendChild(queen);
    menu.appendChild(knight);
    menu.appendChild(rook);
    menu.appendChild(bishop);
    return menu;
  }

  private createMenuItem(pieceName: ChessPieceType, pieceColor: ChessPieceColor) {
    const menuItem = document.createElement("div");
    menuItem.classList.add("square");
    menuItem.classList.add("promotion-menu-item");
    const piece = document.createElement("img");
    piece.src = `svg/${pieceColor}-${pieceName}.svg`;
    piece.classList.add("chess-piece");
    menuItem.appendChild(piece);
    return menuItem;
  }
}
