#!/bin/bash
echo "Executing the POST request..."
curl -i -s -k -X $'POST' \
-H $'Host: pagespeed.web.dev' \
-H $'Sec-Ch-Ua: "Chromium";v="151", "Not=A?Brand";v="99"' \
-H $'Sec-Ch-Ua-Mobile: ?0' \
-H $'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36' \
-H $'Sec-Ch-Ua-Arch: "x86"' \
-H $'Sec-Ch-Ua-Form-Factors: "Desktop"' \
-H $'Sec-Ch-Ua-Platform-Version: "15.0.0"' \
-H $'Sec-Ch-Ua-Full-Version-List: "Chromium";v="151.0.0.0", "Not=A?Brand";v="99.0.0.0"' \
-H $'Sec-Ch-Ua-Bitness: "64"' \
-H $'Sec-Ch-Ua-Model: ""' \
-H $'Sec-Ch-Ua-Platform: "Windows"' \
-H $'Content-Type: application/x-www-form-urlencoded;charset=UTF-8' \
-H $'Accept: */*' \
-H $'X-Same-Domain: 1' \
-H $'Origin: https://pagespeed.web.dev' \
-H $'Sec-Fetch-Site: same-origin' \
-H $'Sec-Fetch-Mode: cors' \
-H $'Sec-Fetch-Dest: empty' \
-H $'Referer: https://pagespeed.web.dev/analysis/https-www-tvsmotor-com/e462y2liu0?form_factor=desktop' \
-H $'Accept-Language: en-US,en;q=0.9' \
-H $'Priority: u=1, i' \
-H $'Connection: keep-alive' \
-H $'Cookie: _ga=GA1.1.848888998.1728206898; _ga_5CH1F0338F=GS1.1.1728206897.1.1.1728206901.0.0.0' \
$'https://pagespeed.web.dev/_/PagespeedUi/browserinfo?f.sid=-3844824316723512221&bl=boq_chrome-lightbrary-ui_20261004.03_p0&hl=en-US&_reqid=3093959&rt=c' \
-d $'f.req=%5B%5B%5B%22wN2kP%22%2C%22%5B%5C%22https%3A%2F%2Fwww.tvsmotor.com%2F%5C%22%2C%5C%22%5C%22%2C%5C%22%5C%22%2C%5C%22%5C%22%2C0%2Cnull%2C0%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5D%2C%5C%22desktop%5C%22%2C0%2C%5C%22%5C%22%2Cnull%2C1%2Cnull%2C0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&at=AJ3lrY6Q5qQ-_QeT0bdc9gdxOJqc8S1JSg%3A1728206899433&' > logs/tvsmotor-curl-report.txt

echo "Done! Saved to logs/tvsmotor-curl-report.txt"
