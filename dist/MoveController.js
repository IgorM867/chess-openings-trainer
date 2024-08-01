import { columnNumberToLetter, getPieceLetter, getPieceType, parseChessCoordinate } from "./utils.js";
const defaultCastlingRights = {
    white: { kingside: true, queenside: true },
    black: { kingside: true, queenside: true },
};
export class MoveController {
    isMovesDisabled = false;
    board;
    castlingRights;
    enPassantTarget;
    isChecking = false;
    openingsController;
    constructor({ board, openingsController, castlingRights = defaultCastlingRights, enPassantTarget, }) {
        this.board = board;
        this.castlingRights = castlingRights;
        this.enPassantTarget = enPassantTarget;
        this.openingsController = openingsController;
    }
    makeMove(fromSquare, toSquare) {
        const { activeColor } = this.board;
        if (fromSquare.piece == null)
            return;
        if (fromSquare.piece.color !== activeColor)
            return;
        if (fromSquare === toSquare)
            return;
        const move = this.getLegalMoves(fromSquare).find((move) => move.targetSquare === toSquare);
        if (!move)
            return;
        if (!this.simulateMoveAndCheckKingSafety(fromSquare, toSquare))
            return;
        const isCapture = Boolean(toSquare.piece);
        const isMoveRight = this.openingsController.isMoveRight(this.getPGNMove(fromSquare, toSquare, isCapture), activeColor);
        if (!isMoveRight)
            return;
        this.updateCastlingRights(fromSquare, activeColor);
        this.updateEnPassantTarget(fromSquare, toSquare, activeColor);
        if (move.enPassant)
            this.makeEnPassantMove(toSquare, activeColor);
        if (move.castling)
            this.makeCastlingMove(toSquare);
        if (move.promotion)
            this.onPromotion(toSquare);
        const piece = fromSquare.piece;
        fromSquare.piece = null;
        toSquare.piece = piece;
        this.isChecking = this.isCheck(toSquare);
        this.board.activeColor = activeColor === "white" ? "black" : "white";
        const nextMove = this.openingsController.getNextMove(this.board.activeColor);
        if (nextMove)
            this.makePGNMove(nextMove);
    }
    makePGNMove(pgnMove) {
        const match = pgnMove.match(/[KQRBN]/);
        const move = pgnMove.replace("x", "").replace(/[KQRBN]/, "");
        const piece = getPieceType(match ? match[0] : "");
        const position = parseChessCoordinate(move);
        const targetSquare = this.board.getSquare(position);
        const fromSquare = this.board.squares.find((square) => square.piece &&
            square.piece.type === piece &&
            this.getLegalMoves(square).some((move) => move.targetSquare === targetSquare));
        if (!targetSquare || !fromSquare)
            return;
        this.makeMove(fromSquare, targetSquare);
    }
    getLegalMoves(square) {
        if (square.piece === null)
            return [];
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
    getPGNMove(fromSquare, toSquare, isCapture) {
        if (!fromSquare.piece)
            return "";
        const pieceLetter = getPieceLetter(fromSquare.piece?.type);
        let letter = pieceLetter === "P" ? "" : pieceLetter;
        if (pieceLetter === "P" && isCapture)
            letter = columnNumberToLetter(fromSquare.col + 1);
        const columnLetter = columnNumberToLetter(toSquare.col + 1);
        const row = Math.abs(toSquare.row - 7) + 1;
        return `${letter}${isCapture ? "x" : ""}${columnLetter}${row}`;
    }
    simulateMoveAndCheckKingSafety(fromSquare, toSquare) {
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
    isCheck(square) {
        const opponentKing = this.board.squares.find((s) => s.piece && s.piece.color !== square.piece?.color && s.piece.type === "king");
        if (!opponentKing)
            return false;
        const moves = this.getLegalMoves(square);
        return moves.some((move) => move.targetSquare === opponentKing);
    }
    isSquareAttacked(square) {
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
        const isKnightsAttack = knightSqaures.some((square) => square.piece && square.piece.color !== activeColor && square.piece.type === "knight");
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
        const isKingAttack = kingSqaures.some((square) => square.piece && square.piece.color !== activeColor && square.piece.type === "king");
        const pawnPositions = [
            { row: row + pawnDirection, col: col - 1 },
            { row: row + pawnDirection, col: col + 1 },
        ];
        const pawnSqaures = this.board.getSquares(pawnPositions);
        const isPawnAttack = pawnSqaures.some((square) => square.piece && square.piece.color !== activeColor && square.piece.type === "pawn");
        const diagonalMoves = this.getDiagonalMoves(square.row, square.col);
        const diagonalSquares = this.board.getSquares(diagonalMoves);
        const isDiagonalPieceAttack = diagonalSquares.some((square) => square.piece &&
            square.piece.color !== activeColor &&
            (square.piece.type === "queen" || square.piece.type === "bishop"));
        const horizontalMoves = this.getHorizontalMoves(square.row, square.col);
        const horizontalSquares = this.board.getSquares(horizontalMoves);
        const isHorizontalPieceAttack = horizontalSquares.some((square) => square.piece &&
            square.piece.color !== activeColor &&
            (square.piece.type === "queen" || square.piece.type === "rook"));
        const verticalMoves = this.getVerticalMoves(square.row, square.col);
        const verticalSquares = this.board.getSquares(verticalMoves);
        const isVerticalPieceAttack = verticalSquares.some((square) => square.piece &&
            square.piece.color !== activeColor &&
            (square.piece.type === "queen" || square.piece.type === "rook"));
        return (isKnightsAttack ||
            isKingAttack ||
            isPawnAttack ||
            isDiagonalPieceAttack ||
            isHorizontalPieceAttack ||
            isVerticalPieceAttack);
    }
    getKingMoves(square) {
        if (square.piece?.type !== "king")
            return [];
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
        const moves = this.board
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
            const areSquaresAttacked = squareG && squareF && (this.isSquareAttacked(squareG) || this.isSquareAttacked(squareF));
            if (squareH?.piece?.type === "rook" &&
                squareH.piece.color === kingColor &&
                !this.isChecking &&
                !arePiecesBetween &&
                !areSquaresAttacked) {
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
            const areSquaresAttacked = squareC && squareD && (this.isSquareAttacked(squareC) || this.isSquareAttacked(squareD));
            if (squareA?.piece?.type === "rook" &&
                squareA.piece.color === kingColor &&
                !this.isChecking &&
                !arePiecesBetween &&
                !areSquaresAttacked) {
                if (squareC) {
                    moves.push({ targetSquare: squareC, castling: true });
                }
            }
        }
        return moves;
    }
    getQueenMoves(square) {
        if (square.piece?.type !== "queen")
            return [];
        const { row, col } = square;
        const queenMoves = [
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
    getRookMoves(square) {
        if (square.piece?.type !== "rook")
            return [];
        const { row, col } = square;
        const rookMoves = [
            ...this.getVerticalMoves(row, col),
            ...this.getHorizontalMoves(row, col),
        ];
        return this.board.getSquares(rookMoves).map((square) => {
            return {
                targetSquare: square,
            };
        });
    }
    getBishopMoves(square) {
        if (square.piece?.type !== "bishop")
            return [];
        const { row, col } = square;
        const bishopMoves = this.getDiagonalMoves(row, col);
        return this.board.getSquares(bishopMoves).map((square) => {
            return {
                targetSquare: square,
            };
        });
    }
    getKnightMoves(square) {
        if (square.piece?.type !== "knight")
            return [];
        const { activeColor } = this.board;
        const { row, col } = square;
        const knightMoves = [
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
    getPawnMoves(square) {
        if (square.piece?.type !== "pawn")
            return [];
        const { row, col } = square;
        const pawnColor = square.piece.color;
        const oneForward = pawnColor === "white" ? -1 : 1;
        const startingRow = pawnColor === "white" ? 6 : 1;
        const pawnMoves = [];
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
        const moves = this.board
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
    findDirectionalMoves(newCoordinates) {
        const activeColor = this.board.activeColor;
        const moves = [];
        let i = 1;
        while (true) {
            const coordinates = newCoordinates(i);
            const targetSquare = this.board.getSquare(coordinates);
            if (!targetSquare || targetSquare.piece?.color === activeColor)
                break;
            if (targetSquare.piece) {
                moves.push(coordinates);
                break;
            }
            moves.push(coordinates);
            i++;
        }
        return moves;
    }
    getVerticalMoves(row, col) {
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
    getHorizontalMoves(row, col) {
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
    getDiagonalMoves(row, col) {
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
    updateCastlingRights(fromSquare, activeColor) {
        if (fromSquare.piece === null)
            return;
        if (fromSquare.piece.type === "king") {
            this.castlingRights[activeColor].kingside = false;
            this.castlingRights[activeColor].queenside = false;
        }
        if (fromSquare.piece.type === "rook") {
            const row = activeColor === "black" ? 0 : 7;
            if (fromSquare.row === row && fromSquare.col === 0) {
                this.castlingRights[activeColor].queenside = false;
            }
            else if (fromSquare.row === row && fromSquare.col === 7) {
                this.castlingRights[activeColor].kingside = false;
            }
        }
    }
    updateEnPassantTarget(fromSquare, toSquare, activeColor) {
        if (fromSquare.piece === null)
            return;
        this.enPassantTarget = null;
        if (fromSquare.piece.type === "pawn" && activeColor === "white" && toSquare.row === 4) {
            this.enPassantTarget = columnNumberToLetter(fromSquare.col + 1).toLocaleLowerCase() + 3;
        }
        if (fromSquare.piece.type === "pawn" && activeColor === "black" && toSquare.row === 3) {
            this.enPassantTarget = columnNumberToLetter(fromSquare.col + 1).toLocaleLowerCase() + 6;
        }
    }
    makeEnPassantMove(toSquare, activeColor) {
        const row = toSquare.row + (activeColor === "white" ? 1 : -1);
        const captureSquare = this.board.getSquare({ row, col: toSquare.col });
        if (captureSquare) {
            captureSquare.piece = null;
        }
    }
    makeCastlingMove(toSquare) {
        let castlingRook, targetSquare;
        if (toSquare.col === 6) {
            castlingRook = this.board.getSquare({ row: toSquare.row, col: 7 });
            targetSquare = this.board.getSquare({ row: toSquare.row, col: 5 });
        }
        else {
            castlingRook = this.board.getSquare({ row: toSquare.row, col: 0 });
            targetSquare = this.board.getSquare({ row: toSquare.row, col: 3 });
        }
        if (castlingRook && targetSquare) {
            targetSquare.piece = castlingRook.piece;
            castlingRook.piece = null;
        }
    }
    onPromotion(promotionSquare) {
        this.isMovesDisabled = true;
        const { activeColor } = this.board;
        const menu = this.createPromotionMenu(activeColor, promote.bind(this));
        promotionSquare.htmlElement.appendChild(menu);
        function promote(piece) {
            promotionSquare.piece = {
                type: piece,
                color: activeColor,
            };
            menu.remove();
            this.isMovesDisabled = false;
        }
    }
    createPromotionMenu(piecesColor, promote) {
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
    createMenuItem(pieceName, pieceColor) {
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
