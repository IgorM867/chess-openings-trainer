export class DragAndDropController {
    _draggingSquare = null;
    board;
    moveController;
    constructor({ board, moveController }) {
        this.board = board;
        this.moveController = moveController;
        board.squares.forEach((square) => {
            const { htmlElement } = square;
            htmlElement.addEventListener("mouseover", () => {
                if (this.moveController.isMovesDisabled)
                    return;
                if (square.piece) {
                    htmlElement.classList.add("hover");
                }
                else {
                    htmlElement.classList.remove("hover");
                }
            });
            htmlElement.addEventListener("mouseout", () => {
                htmlElement.classList.remove("hover");
            });
            htmlElement.addEventListener("mousedown", (e) => {
                if (this.moveController.isMovesDisabled)
                    return;
                if (square.piece === null)
                    return;
                const img = htmlElement.querySelector("img");
                if (!img)
                    return;
                this.draggingSquare = square;
                img.classList.add("dragging");
                img.style.left = e.clientX - img.width / 2 + "px";
                img.style.top = e.clientY - img.height / 2 + "px";
            });
            htmlElement.addEventListener("mouseup", (e) => {
                const img = htmlElement.querySelector("img");
                if (!img)
                    return;
                this.draggingSquare = null;
                img.classList.remove("dragging");
                const targetSquare = this.board.getSquare({ x: e.clientX, y: e.clientY });
                if (!targetSquare)
                    return;
                this.moveController.makeMove(square, targetSquare);
            });
        });
        board.htmlElement.addEventListener("mousemove", (e) => {
            if (this.draggingSquare === null)
                return;
            const img = this.draggingSquare.htmlElement.querySelector("img");
            if (!img)
                return;
            img.style.left = e.clientX - img.width / 2 + "px";
            img.style.top = e.clientY - img.height / 2 + "px";
        });
    }
    set draggingSquare(square) {
        this._draggingSquare = square;
        if (!square) {
            this.board.squares.forEach((square) => square.htmlElement.classList.remove("move-hint"));
        }
        else if (square.piece?.color === this.board.activeColor) {
            this.moveController.getLegalMoves(square).forEach((move) => {
                move.targetSquare.htmlElement.classList.add("move-hint");
            });
        }
    }
    get draggingSquare() {
        return this._draggingSquare;
    }
}
