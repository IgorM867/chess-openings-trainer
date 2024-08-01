const italianGamePositions = [
    { id: "1", bestMove: "e4", responseScore: 0, opponentMoves: [{ nextPositionId: "2", move: "e5" }] },
    { id: "2", bestMove: "Nf3", responseScore: 0, opponentMoves: [{ nextPositionId: "3", move: "Nc6" }] },
    {
        id: "3",
        bestMove: "Bc4",
        responseScore: 0,
        opponentMoves: [
            { nextPositionId: "4a1", move: "Bc5" },
            { nextPositionId: "4b1", move: "Nf6" },
        ],
    },
    //
    { id: "4a1", bestMove: "c3", responseScore: 0, opponentMoves: [{ nextPositionId: "4a2", move: "Nf6" }] },
    { id: "4a2", bestMove: "d3", responseScore: 0, opponentMoves: [{ nextPositionId: "5", move: "d6" }] },
    //
    { id: "4b1", bestMove: "d3", responseScore: 0, opponentMoves: [{ nextPositionId: "4b2", move: "Bc5" }] },
    { id: "4b2", bestMove: "c3", responseScore: 0, opponentMoves: [{ nextPositionId: "5", move: "d6" }] },
    //
    { id: "5", bestMove: "Bb3", responseScore: 0, opponentMoves: [] },
];
/*
  1.e4 e5 2.Nf3 Nc6 3.Bc4
    3...Bc5 4.c3 Nf6 5.d3 d6
                             6.Bb3
    3...Nf6 4.d3 Bc5 5.c3 d6
  
*/
const italianGame = {
    name: "Italian Game",
    startColor: "white",
    trainedPositions: [],
    positions: italianGamePositions,
};
const scandinavianDefensePositions = [
    { id: "1", bestMove: "e4", responseScore: 0, opponentMoves: [{ nextPositionId: "2", move: "d5" }] },
    { id: "2", bestMove: "exd5", responseScore: 0, opponentMoves: [{ nextPositionId: "3", move: "Qxd5" }] },
    { id: "3", bestMove: "Nc3", responseScore: 0, opponentMoves: [] },
];
const scandinavianDefense = {
    name: "Scandinavian Defense",
    startColor: "white",
    trainedPositions: [],
    positions: scandinavianDefensePositions,
};
const sicilianDefensePositions = [
    { id: "1", bestMove: "c5", responseScore: 0, opponentMoves: [{ nextPositionId: "2", move: "Nf3" }] },
    { id: "2", bestMove: "Nc6", responseScore: 0, opponentMoves: [] },
];
const sicilianDefense = {
    name: "Sicilian Defense",
    startColor: "black",
    firstMove: "e4",
    trainedPositions: [],
    positions: sicilianDefensePositions,
};
const openings = [italianGame, scandinavianDefense, sicilianDefense];
export { openings };
