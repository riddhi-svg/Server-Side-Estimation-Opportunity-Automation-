const fs = require('fs');

async function run() {
  const res = await fetch("https://pagespeed.web.dev/analysis/https-www-tvsmotor-com/e462y2liu0?form_factor=desktop");
  const html = await res.text();
  
  const cookies = res.headers.get('set-cookie');
  console.log("Cookies:", cookies);
  
  const sidMatch = html.match(/"FdrFJe":"([^"]+)"/);
  const blMatch = html.match(/"cfb2h":"([^"]+)"/);
  const atMatch = html.match(/var _F_combinedSignature = '([^']+)'/);

  if (!sidMatch || !blMatch || !atMatch) {
    console.log("Failed to extract tokens");
    return;
  }

  const sid = sidMatch[1];
  const bl = blMatch[1];
  const at = atMatch[1];

  const postUrl = `https://pagespeed.web.dev/_/PagespeedUi/browserinfo?f.sid=${sid}&bl=${bl}&hl=en-US&_reqid=1234567&rt=c`;
  const reqData = new URLSearchParams();
  reqData.append('f.req', `[[["wN2kP","[\\"https://www.tvsmotor.com/\\",\\"\\",\\"\\",\\"\\",0,null,0,null,null,null,null,[],\\"desktop\\",0,\\"\\",null,1,null,0]",null,"generic"]]]`);
  reqData.append('at', `${at}:${Date.now()}`);

  const postRes = await fetch(postUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "Cookie": cookies || ""
    },
    body: reqData.toString()
  });

  const postText = await postRes.text();
  console.log("POST Status:", postRes.status);
  fs.writeFileSync("logs/post-response.txt", postText);
  console.log(postText.substring(0, 300));
}

run();
