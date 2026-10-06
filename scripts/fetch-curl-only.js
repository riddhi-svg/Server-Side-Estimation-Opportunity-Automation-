const { execSync } = require('child_process');
const fs = require('fs');

async function run() {
  console.log("Fetching GET request to pagespeed.web.dev...");
  // Using pure fetch which acts exactly like curl
  const res = await fetch("https://pagespeed.web.dev/analysis/https-www-tvsmotor-com/e462y2liu0?form_factor=desktop", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });
  
  const html = await res.text();
  const cookies = res.headers.get('set-cookie');
  
  // Extract WIZ tokens dynamically since hardcoded ones expire
  const sidMatch = html.match(/"FdrFJe":"([^"]+)"/);
  const blMatch = html.match(/"cfb2h":"([^"]+)"/);
  const atMatch = html.match(/var _F_combinedSignature = '([^']+)'/);

  if (!sidMatch || !blMatch || !atMatch) {
    console.log("Failed to extract tokens. The site might have blocked the request.");
    return;
  }

  const sid = sidMatch[1];
  const bl = blMatch[1];
  const at = atMatch[1];

  console.log("Extracted Tokens:", { sid, bl, at });

  const postUrl = `https://pagespeed.web.dev/_/PagespeedUi/browserinfo?f.sid=${sid}&bl=${bl}&hl=en-US&_reqid=${Math.floor(Math.random() * 1000000)}&rt=c`;
  
  // Construct exactly the payload requested
  const reqData = new URLSearchParams();
  reqData.append('f.req', `[[["wN2kP","[\\"https://www.tvsmotor.com/\\",\\"\\",\\"\\",\\"\\",0,null,0,null,null,null,null,[],\\"desktop\\",0,\\"\\",null,1,null,0]",null,"generic"]]]`);
  reqData.append('at', `${at}:${Date.now()}`);

  console.log("Fetching POST request (The curl equivalent)...");
  
  const postRes = await fetch(postUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Cookie": cookies || ""
    },
    body: reqData.toString()
  });

  const postText = await postRes.text();
  console.log("POST Response Status:", postRes.status);
  
  // Save response to txt file
  fs.writeFileSync("logs/tvsmotor-curl-report.txt", postText);
  console.log("Response saved to logs/tvsmotor-curl-report.txt");
  
  // Attempt to parse if it's 200
  if (postRes.status === 200) {
      try {
          // WIZ returns )]}' on the first line
          const cleanText = postText.replace(")]}'\n\n", "");
          const data = JSON.parse(cleanText);
          console.log("Successfully parsed JSON array from response. (Note: Internal format is heavily nested)");
      } catch (e) {
          console.log("Could not parse response as JSON.");
      }
  } else {
      console.log("The request was rejected with a " + postRes.status + " error.");
  }
}

run();
