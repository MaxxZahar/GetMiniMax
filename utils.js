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
        axes.push(axis);
    }
    let attackTricks = 0;
    let defenceTricks = 0;
    const contracts = [];
    for (let i = 0; i < axesHandles.length; i++) {
        if (i % 5 !== 0) {
            const declarer = await page.evaluate(el => el.querySelectorAll('.nobrd td')[1].textContent, axesHandles[i]);
            let contract = await page.evaluate(el => el.querySelectorAll('.nobrd td')[0].textContent, axesHandles[i]);
            contract = contract.replaceAll('X', '');
            contract = contract.replaceAll(' ', '');
            if (contract.at(-1) !== 'T') {
                const suit = await page.evaluate(el => el.querySelectorAll('.nobrd td')[0].querySelector('img').src.at(-5), axesHandles[i]);
                contract += transformSuit(suit);
            }
            contracts.push(contract);
        } else {
            const declarer = await page.evaluate(el => el.querySelectorAll('.nobrd')[1].querySelectorAll('td')[1].textContent, axesHandles[i]);
            let contract = await page.evaluate(el => el.querySelectorAll('.nobrd')[1].querySelectorAll('td')[0].textContent, axesHandles[i]);
            contract = contract.replaceAll('X', '');
            contract = contract.replaceAll(' ', '');
            if (contract.at(-1) !== 'T') {
                const suit = await page.evaluate(el => el.querySelectorAll('.nobrd')[1].querySelectorAll('td')[0].querySelector('img').src.at(-5), axesHandles[i]);
                contract += transformSuit(suit);
            }
            contracts.push(contract);
        }
    }
    await browser.close()
    return axes;
}

(async () => {
    const axes = await getPairData(11);
})();