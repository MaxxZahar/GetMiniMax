const puppeteer = require('puppeteer');


function transformSuit(suit) {
    switch (suit) {
        case 't': return 'H';
        case 'e': return 'S';
        case 'd': return 'D';
        case 'b': return 'C';
    }
}


async function getPairData(n) {
    const path = `https://spb.bridgesport.ru/spb/p0526/p0526p${n}h.php`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(path);
    await page.setViewport({ width: 1080, height: 1024 });
    const axesHandles = await page.$$('.allbrd tr.odd, .allbrd tr.even');
    console.log(axesHandles.length);
    const axes = [];
    for (let i = 0; i < axesHandles.length; i += 5) {
        const axis = await page.evaluate(el => el.querySelectorAll('td')[1].textContent.at(-1), axesHandles[i]);
        for (let j = 0; j < 5; j++) {
            axes.push(axis);
        }
    }
    let attackTricks = 0;
    let defenceTricks = 0;
    const contracts = [];
    const declarers = [];
    for (let i = 0; i < axesHandles.length; i++) {
        try {
            if (i % 5 !== 0) {
                const declarer = await page.evaluate(el => el.querySelectorAll('.nobrd td')[1].textContent, axesHandles[i]);
                declarers.push(declarer);
                let contract = await page.evaluate(el => el.querySelectorAll('.nobrd td')[0].textContent, axesHandles[i]);
                contract = contract.trim();
                contract = contract.replaceAll('X', '');
                contract = contract.replaceAll(' ', '');
                if (contract.at(-1) !== 'T') {
                    try {
                        const suit = await page.evaluate(el => el.querySelectorAll('.nobrd td')[0].querySelector('img').src.at(-5), axesHandles[i]);
                        contract += transformSuit(suit);
                    } catch (err) {
                        contract = undefined;
                    }
                }
                contracts.push(contract);
            } else {
                const declarer = await page.evaluate(el => el.querySelectorAll('.nobrd')[1].querySelectorAll('td')[1].textContent, axesHandles[i]);
                declarers.push(declarer);
                let contract = await page.evaluate(el => el.querySelectorAll('.nobrd')[1].querySelectorAll('td')[0].textContent, axesHandles[i]);
                contract = contract.trim();
                contract = contract.replaceAll('X', '');
                contract = contract.replaceAll(' ', '');
                if (contract.at(-1) !== 'T') {
                    try {
                        const suit = await page.evaluate(el => el.querySelectorAll('.nobrd')[1].querySelectorAll('td')[0].querySelector('img').src.at(-5), axesHandles[i]);
                        contract += transformSuit(suit);
                    } catch (err) {
                        contract = undefined;
                    }
                }
                contracts.push(contract);
            }
        } catch (err) {
            declarers.push('N');
            contracts.push(undefined);
        }
    }
    const tricks = [];
    for (let i = 0; i < axesHandles.length; i++) {
        let trick;
        if (i % 5 === 0) {
            trick = await page.evaluate(el => el.querySelectorAll(':scope > td')[6].textContent, axesHandles[i]);
        } else {
            trick = await page.evaluate(el => el.querySelectorAll(':scope > td')[3].textContent, axesHandles[i]);
        }
        if (!trick) {
            tricks.push(undefined);
        } else if (trick === '=') {
            tricks.push(0);
        } else {
            tricks.push(Number(trick));
        }
    }
    await browser.close()
    const pair = { 'axes': axes, 'declarers': declarers, 'contracts': contracts, 'tricks': tricks };
    return pair;
}

async function getDealData(n) {
    const path = `https://spb.bridgesport.ru/spb/p0526/p0526d${n}p.php`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(path);
    await page.setViewport({ width: 1080, height: 1024 });
    const dealHandles = await page.$$('.deal td[align="center"]');
    const north = [];
    const east = [];
    const south = [];
    const west = [];
    for (let i = 6; i < 11; i++) {
        north.push(Number(await page.evaluate(el => el.textContent, dealHandles[i])));
    }
    for (let i = 11; i < 16; i++) {
        east.push(Number(await page.evaluate(el => el.textContent, dealHandles[i])));
    }
    for (let i = 16; i < 21; i++) {
        south.push(Number(await page.evaluate(el => el.textContent, dealHandles[i])));
    }
    for (let i = 21; i < 26; i++) {
        west.push(Number(await page.evaluate(el => el.textContent, dealHandles[i])));
    }
    deal = { 'north': north, 'east': east, 'south': south, 'west': west };
    await browser.close();
    return deal;
}

(async () => {
    const { axes, declarers, contracts, tricks } = await getPairData(15);
    let attack = 0;
    let attackCounter = 0;
    let defence = 0;
    let defenceCounter = 0;
    for (let i = 0; i < axes.length; i++) {
        if (contracts[i]) {
            const contractLevel = Number(contracts[i][0]);
            const tricksMade = contractLevel + 6 + tricks[i];
            const dealData = await getDealData(i + 1);
            let suit;
            switch (contracts[i][1]) {
                case "H":
                    suit = 2;
                    break;
                case "S":
                    suit = 1;
                    break;
                case "N":
                    suit = 0;
                    break;
                case "C":
                    suit = 4;
                    break;
                case "D":
                    suit = 3;
                    break;
            }
            switch (axes[i]) {
                case 'W':
                    switch (declarers[i]) {
                        case 'W':
                            attack += tricksMade - dealData['west'][suit];
                            attackCounter++;
                            break;
                        case 'E':
                            attack += tricksMade - dealData['east'][suit];
                            attackCounter++;
                            break;
                        case 'S':
                            defence += tricksMade - dealData['south'][suit];
                            defenceCounter++;
                            break;
                        case 'N':
                            defence += tricksMade - dealData['north'][suit];
                            defenceCounter++;
                            break;
                    }
                    break;
                case 'S':
                    switch (declarers[i]) {
                        case 'W':
                            defence += tricksMade - dealData['west'][suit];
                            defenceCounter++;
                            break;
                        case 'E':
                            defence += tricksMade - dealData['east'][suit];
                            defenceCounter++;
                            break;
                        case 'S':
                            attack += tricksMade - dealData['south'][suit];
                            attackCounter++;
                            break;
                        case 'N':
                            attack += tricksMade - dealData['north'][suit];
                            attackCounter++;
                            break;
                    }
                    break;
            }
        }
    }
    console.log(attack, attackCounter, defence, defenceCounter);
})();