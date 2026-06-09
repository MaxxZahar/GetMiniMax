function transformSuit(suit) {
    switch (suit) {
        case 't': return 'H';
        case 'e': return 'S';
        case 'd': return 'D';
        case 'b': return 'C';
    }
}

function getSuit(contract) {
    switch (contract[1]) {
        case "H":
            return 2;
        case "S":
            return 1;
        case "N":
            return 0;
        case "C":
            return 4;
        case "D":
            return 3;
    }
}

module.exports = { transformSuit, getSuit };