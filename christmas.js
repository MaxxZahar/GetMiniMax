const puppeteer = require('puppeteer');
const pth = require('path');
const fs = require('fs');
const { transformSuit, getSuit } = require('./funcs');

const players = {}

function createEmptyDataObject() {
    return { 'attackCounter': 0, 'defenceCounter': 0, 'attackMini': 0, 'defenceMini': 0, 'contractsMade': 0, 'contractsDefeated': 0 };
}


async function getDealMini(page) {
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
    return deal;
}


async function getDealData(path) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(path);
    await page.setViewport({ width: 1080, height: 1024 });
    const deal = await getDealMini(page);
    const nameHandles = await page.$$('.allbrd tr.odd, .allbrd tr.even');
    console.log(nameHandles.length);
    for (let i = 0; i < nameHandles.length; i++) {
        const north = await page.evaluate(el => el.querySelectorAll('td')[0].querySelectorAll('a')[0].textContent.trim(), nameHandles[i]);
        const south = await page.evaluate(el => el.querySelectorAll('td')[0].querySelectorAll('a')[1].textContent.trim(), nameHandles[i]);
        const east = await page.evaluate(el => el.querySelectorAll('td')[1].querySelectorAll('a')[0].textContent.trim(), nameHandles[i]);
        const west = await page.evaluate(el => el.querySelectorAll('td')[1].querySelectorAll('a')[1].textContent.trim(), nameHandles[i]);
        const pair1 = `${north}-${south}`;
        const pair2 = `${east}-${west}`;
        if (!Object.hasOwn(players, pair1)) {
            players[pair1] = createEmptyDataObject();
        }
        if (!Object.hasOwn(players, pair2)) {
            players[pair2] = createEmptyDataObject();
        }
        const declarer = await page.evaluate(el => el.querySelectorAll('td')[2].querySelectorAll('td')[1].textContent.trim(), nameHandles[i]);
        let contract = await page.evaluate(el => el.querySelectorAll('td')[2].querySelectorAll('td')[0].textContent.trim(), nameHandles[i]);
        contract = contract.replaceAll('X', '');
        contract = contract.replaceAll('x', '');
        contract = contract.replaceAll(' ', '');
        if (contract.at(-1) !== 'T') {
            try {
                const suit = await page.evaluate(el => el.querySelectorAll('td')[2].querySelector('img').src.at(-5), nameHandles[i]);
                contract += transformSuit(suit);
            } catch (err) {
                contract = undefined;
            }
        }
        let tricks = await page.evaluate(el => el.querySelectorAll(':scope > td')[4].textContent.trim(), nameHandles[i]);
        if (!tricks) {
            tricks = undefined;
        } else if (tricks === '=') {
            tricks = 0;
        } else {
            tricks = Number(tricks);
        }
        if (contract) {
            const contractLevel = Number(contract[0]);
            const suit = getSuit(contract);
            switch (declarer) {
                case 'N':
                    players[pair1]['attackCounter']++;
                    players[pair1]['attackMini'] += contractLevel + 6 + tricks - deal['north'][suit];
                    players[pair2]['defenceCounter']++;
                    players[pair2]['defenceMini'] += -(contractLevel + 6 + tricks - deal['north'][suit]);
                    if (tricks >= 0) {
                        players[pair1]['contractsMade']++;
                    } else {
                        players[pair2]['contractsDefeated']++;
                    }
                    break;
                case 'S':
                    players[pair1]['attackCounter']++;
                    players[pair1]['attackMini'] += contractLevel + 6 + tricks - deal['south'][suit];
                    players[pair2]['defenceCounter']++;
                    players[pair2]['defenceMini'] += -(contractLevel + 6 + tricks - deal['south'][suit]);
                    if (tricks >= 0) {
                        players[pair1]['contractsMade']++;
                    } else {
                        players[pair2]['contractsDefeated']++;
                    }
                    break;
                case 'E':
                    players[pair2]['attackCounter']++;
                    players[pair2]['attackMini'] += contractLevel + 6 + tricks - deal['east'][suit];
                    players[pair1]['defenceCounter']++;
                    players[pair1]['defenceMini'] += -(contractLevel + 6 + tricks - deal['east'][suit]);
                    if (tricks >= 0) {
                        players[pair2]['contractsMade']++;
                    } else {
                        players[pair1]['contractsDefeated']++;
                    }
                    break;
                case 'W':
                    players[pair2]['attackCounter']++;
                    players[pair2]['attackMini'] += contractLevel + 6 + tricks - deal['west'][suit];
                    players[pair1]['defenceCounter']++;
                    players[pair1]['defenceMini'] += -(contractLevel + 6 + tricks - deal['west'][suit]);
                    if (tricks >= 0) {
                        players[pair2]['contractsMade']++;
                    } else {
                        players[pair1]['contractsDefeated']++;
                    }
                    break;
                default:
                    console.log('DEFAULT');
            }
        }

    }
    await browser.close();
}


(async () => {
    const outputPath = pth.join('./', 'data', 'data.csv');
    const wStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' });
    for (let i = 1; i < 25; i++) {
        console.log(`Working Session 1 Deal ${i}`);
        await getDealData(`https://spb.bridgesport.ru/spb/pCr26/p030126_1/d${i}p.php#h`);
    }
    for (let i = 1; i < 25; i++) {
        console.log(`Working Session 2 Deal ${i}`);
        await getDealData(`https://spb.bridgesport.ru/spb/pCr26/p030126_2/d${i}p.php#h`);
    }
    for (let i = 1; i < 25; i++) {
        console.log(`Working Session 3 Deal ${i}`);
        await getDealData(`https://spb.bridgesport.ru/spb/pCr26/p030126_3/d${i}p.php#h`);
    }
    const header = 'Пара;Attack;Made;AttMini;AvgAttMini;Defence;Defeated;DefMini;AvgDefMini\n';
    wStream.write(header);
    for (const pair in players) {
        wStream.write(`${pair};${players[pair]['attackCounter']};${players[pair]['contractsMade'] / players[pair]['attackCounter']};${players[pair]['attackMini']};${players[pair]['attackMini'] / players[pair]['attackCounter']};${players[pair]['defenceCounter']};${players[pair]['contractsDefeated'] / players[pair]['defenceCounter']};${players[pair]['defenceMini']};${players[pair]['defenceMini'] / players[pair]['defenceCounter']}\n`);
    }
    wStream.end();
    console.log(players);
})();