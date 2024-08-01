type ChessPieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
type ChessPieceColor = "white" | "black";

type ChessPiece = {
  type: ChessPieceType;
  color: ChessPieceColor;
};

type CastlingRights = {
  white: {
    kingside: boolean;
    queenside: boolean;
  };
  black: {
    kingside: boolean;
    queenside: boolean;
  };
};

type Opening = WhiteOpening | BlackOpening;
type WhiteOpening = {
  name: string;
  startColor: "white";
  positions: Position[];
};
type BlackOpening = {
  name: string;
  startColor: "black";
  firstMove: string;
  positions: Position[];
};
type Position = {
  id: string;
  bestMove: string;
  responseScore: number;
  opponentMoves: OpponentMove[];
};
type OpponentMove = {
  move: string;
  nextPositionId: string;
};
