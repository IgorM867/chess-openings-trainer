import { Board } from "./Board.js";
import { DragAndDropController } from "./DragAndDropController.js";
import { OpeningsController } from "./OpeningsController.js";
import { parseFEN } from "./utils.js";

const START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const { pieces, activeColor, castlingRights, enPassantTarget, fullmoveNumber, halfmoveClock } =
  parseFEN(START_POSITION);

const board = new Board({ pieces, activeColor, fullmoveNumber, halfmoveClock });
const openingsController = new OpeningsController({ board, enPassantTarget });
new DragAndDropController({ board, moveController: openingsController.moveController });
