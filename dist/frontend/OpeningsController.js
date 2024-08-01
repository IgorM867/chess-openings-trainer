import { MoveController } from "./MoveController.js";
import { openings } from "./openings.js";
export class OpeningsController {
    openings = openings;
    moveController;
    board;
    activeOpenning;
    currentPosition;
    isResponseRight = true;
    hasOpeningMistake = false;
    constructor({ board, enPassantTarget }) {
        this.moveController = new MoveController({ board, enPassantTarget, openingsController: this });
        this.board = board;
        this.activeOpenning = openings[0];
        this.currentPosition = openings[0].positions[0];
        this.setActiveOpening(openings[0]);
        this.renderOpeningsList();
    }
    isMoveRight(PGNMove, activeColor) {
        if (activeColor === this.activeOpenning.startColor) {
            const isMoveRight = PGNMove === this.currentPosition.bestMove;
            if (!isMoveRight) {
                this.isResponseRight = false;
                return false;
            }
            return isMoveRight;
        }
        return true;
    }
    getNextMove(activeColor) {
        if (this.activeOpenning.startColor === activeColor)
            return null;
        this.addTrainedPositionId(this.currentPosition.id);
        if (this.currentPosition.opponentMoves.length === 0) {
            if (this.hasOpeningMistake ||
                this.activeOpenning.trainedPositions.length < this.activeOpenning.positions.length) {
                this.setActiveOpening(this.activeOpenning);
            }
            else {
                this.setActiveOpening(this.getNextOpening());
            }
            return null;
        }
        const nextMoves = this.currentPosition.opponentMoves.map((move) => {
            return {
                ...move,
                responseScore: this.getPosition(move.nextPositionId)?.responseScore,
            };
        });
        nextMoves.sort((a, b) => a.responseScore - b.responseScore);
        if (this.isResponseRight) {
            this.currentPosition.responseScore += 1;
        }
        else {
            this.currentPosition.responseScore -= 1;
            this.hasOpeningMistake = true;
            this.isResponseRight = true;
        }
        const nextMove = nextMoves[0];
        this.currentPosition = this.getPosition(nextMove.nextPositionId);
        return nextMove.move;
    }
    getNextOpening() {
        const nextIndex = this.openings.indexOf(this.activeOpenning) + 1;
        if (nextIndex >= this.openings.length)
            return this.openings[0];
        return this.openings[nextIndex];
    }
    getPosition(positionId) {
        const position = this.activeOpenning.positions.find((position) => position.id === positionId);
        if (!position)
            throw new Error("There is no position with id " + positionId);
        return position;
    }
    setActiveOpening(opening) {
        this.activeOpenning = opening;
        this.currentPosition = opening.positions[0];
        this.isResponseRight = true;
        this.hasOpeningMistake = false;
        this.board.restartBoard();
        if (opening.startColor === "black") {
            this.moveController.makePGNMove(opening.firstMove);
            this.board.rotate("black");
        }
        else {
            this.board.rotate("white");
        }
        this.renderOpeningsList();
    }
    addTrainedPositionId(id) {
        if (!this.activeOpenning.trainedPositions.includes(id)) {
            this.activeOpenning.trainedPositions.push(id);
            this.renderOpeningsList();
        }
    }
    renderOpeningsList() {
        const openingsList = document.querySelector(".openings-list");
        if (!openingsList)
            throw new Error("Openings list does not exist");
        openingsList.innerHTML = "";
        const header = document.createElement("h2");
        header.textContent = "Openings";
        openingsList.appendChild(header);
        this.openings.forEach((opening) => {
            const openingItem = document.createElement("li");
            openingItem.textContent = `${opening.name} (${opening.trainedPositions.length}/${opening.positions.length})`;
            openingsList.appendChild(openingItem);
            if (opening === this.activeOpenning) {
                openingItem.classList.add("active-opening");
            }
            openingItem.addEventListener("click", () => {
                this.setActiveOpening(opening);
            });
        });
    }
}
