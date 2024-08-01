import "";
const positions = [
    { id: "1", bestMove: "e4", opponentMoves: [{ nextPositionId: "2", move: "e5" }] },
    { id: "2", bestMove: "Nf3", opponentMoves: [{ nextPositionId: "3", move: "Nc6" }] },
    {
        id: "3",
        bestMove: "Bc4",
        opponentMoves: [
            { nextPositionId: "4a1", move: "Bc5" },
            { nextPositionId: "4b1", move: "Nf6" },
        ],
    },
    { id: "4a1", bestMove: "c3", opponentMoves: [{ nextPositionId: "4a2", move: "Kf6" }] },
    { id: "4a2", bestMove: "d3", opponentMoves: [{ nextPositionId: "5", move: "d6" }] },
    { id: "4b1", bestMove: "d3", opponentMoves: [{ nextPositionId: "4b2", move: "Bc5" }] },
    { id: "4b2", bestMove: "c3", opponentMoves: [{ nextPositionId: "5", move: "d6" }] },
    { id: "5", bestMove: "Bb3", opponentMoves: [] },
];
const italianGame = {
    name: "Italian Game",
    startColor: "white",
    positions,
};
export { italianGame };
