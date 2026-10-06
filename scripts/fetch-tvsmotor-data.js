const fs = require('fs');
const path = require('path');

async function run() {
  const logFile = path.join(__dirname, '../logs/tvsmotor-query-response.txt');
  fs.writeFileSync(logFile, ''); // clear file

  console.log('Executing Request 1 (GET)...');
  try {
    const res1 = await fetch('https://pagespeed.web.dev/analysis/https-www-tvsmotor-com/e462y2liu0?form_factor=desktop', {
      method: 'GET',
      headers: {
        'Host': 'pagespeed.web.dev',
        'Sec-Ch-Ua': '"Chromium";v="151", "Not=A?Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Accept-Language': 'en-US,en;q=0.9',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Priority': 'u=0, i'
      }
    });
    
    const text1 = await res1.text();
    fs.appendFileSync(logFile, '--- REQUEST 1 (GET) ---\n');
    fs.appendFileSync(logFile, `Status: ${res1.status} ${res1.statusText}\n\n`);
    fs.appendFileSync(logFile, text1 + '\n\n');
    console.log(`Request 1 completed with status ${res1.status}`);
  } catch (err) {
    console.error('Request 1 failed:', err);
    fs.appendFileSync(logFile, `--- REQUEST 1 FAILED ---\n${err.message}\n\n`);
  }

  console.log('Executing Request 2 (POST)...');
  try {
    const res2 = await fetch('https://pagespeed.web.dev/_/PagespeedUi/browserinfo?f.sid=-5179672223417280785&bl=boq_chrome-lightbrary-ui_20260928.03_p0&hl=en-US&_reqid=52946&rt=j', {
      method: 'POST',
      headers: {
        'Host': 'pagespeed.web.dev',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Chromium";v="151", "Not=A?Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'X-Same-Domain': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': '*/*',
        'Origin': 'https://pagespeed.web.dev',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://pagespeed.web.dev/',
        'Priority': 'u=1, i',
        'Cookie': 'ga_S8N9N15MT1=GS2.1.s1790759543$o1$g0$t1790759543$j60$l0$h0; _ga=GA1.1.418023280.1790759544; OTZ=8807592_34_34__34'
      },
      body: 'f.req=%5B9%2C1%2C1.5%2C%5Bnull%2C1080%2C1920%5D%2C%5Bnull%2C558%2C1036%5D%2C%5B1%2C1%2Cnull%2C0%5D%2C%5B0%2C0%2C0%5D%5D&'
    });
    
    const text2 = await res2.text();
    fs.appendFileSync(logFile, '--- REQUEST 2 (POST) ---\n');
    fs.appendFileSync(logFile, `Status: ${res2.status} ${res2.statusText}\n\n`);
    fs.appendFileSync(logFile, text2 + '\n\n');
    console.log(`Request 2 completed with status ${res2.status}`);
  } catch (err) {
    console.error('Request 2 failed:', err);
    fs.appendFileSync(logFile, `--- REQUEST 2 FAILED ---\n${err.message}\n\n`);
  }
  
  console.log(`\nAll responses saved successfully to ${logFile}`);
}

run();
