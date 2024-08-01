const pieceDictionary = {
    K: { color: "white", type: "king" },
    Q: { color: "white", type: "queen" },
    R: { color: "white", type: "rook" },
    B: { color: "white", type: "bishop" },
    N: { color: "white", type: "knight" },
    P: { color: "white", type: "pawn" },
    k: { color: "black", type: "king" },
    q: { color: "black", type: "queen" },
    r: { color: "black", type: "rook" },
    b: { color: "black", type: "bishop" },
    n: { color: "black", type: "knight" },
    p: { color: "black", type: "pawn" },
};
export function parseFEN(FEN) {
    const [piecesPlacement, activeColor, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber,] = FEN.split(" ");
    const pieces = [];
    piecesPlacement.split("/").forEach((row) => {
        row.split("").forEach((value) => {
            const piece = pieceDictionary[value];
            if (piece) {
                pieces.push(piece);
            }
            else {
                const num = Number(value);
                for (let i = 0; i < num; i++) {
                    pieces.push(null);
                }
            }
        });
    });
    const color = activeColor === "w" ? "white" : "black";
    const castlingRightsObject = {
        white: {
            kingside: castlingRights.includes("K"),
            queenside: castlingRights.includes("Q"),
        },
        black: {
            kingside: castlingRights.includes("k"),
            queenside: castlingRights.includes("q"),
        },
    };
    const enPassantTargetSquare = enPassantTarget === "-" ? null : enPassantTarget;
    return {
        pieces,
        activeColor: color,
        castlingRights: castlingRightsObject,
        enPassantTarget: enPassantTargetSquare,
        halfmoveClock: Number(halfmoveClock),
        fullmoveNumber: Number(fullmoveNumber),
    };
}
export function columnNumberToLetter(col) {
    switch (col) {
        case 1:
            return "a";
        case 2:
            return "b";
        case 3:
            return "c";
        case 4:
            return "d";
        case 5:
            return "e";
        case 6:
            return "f";
        case 7:
            return "g";
        case 8:
            return "h";
        default:
            return "";
    }
}
export function columnLetterToNumber(col) {
    switch (col) {
        case "a":
            return 0;
        case "b":
            return 1;
        case "c":
            return 2;
        case "d":
            return 3;
        case "e":
            return 4;
        case "f":
            return 5;
        case "g":
            return 6;
        case "h":
            return 7;
        default:
            throw new Error(`Column '${col}' is not a valid column letter`);
    }
}
export function parseChessCoordinate(input) {
    const col = columnLetterToNumber(input[0]);
    const row = Math.abs(parseInt(input[1]) - 1 - 7);
    return { row, col };
}
export function getPieceLetter(piece) {
    switch (piece) {
        case "king":
            return "K";
        case "queen":
            return "Q";
        case "rook":
            return "R";
        case "bishop":
            return "B";
        case "knight":
            return "N";
        case "pawn":
            return "P";
        default:
            return "";
    }
}
export function getPieceType(letter) {
    switch (letter) {
        case "K":
            return "king";
        case "Q":
            return "queen";
        case "R":
            return "rook";
        case "B":
            return "bishop";
        case "N":
            return "knight";
        default:
            return "pawn";
    }
}
