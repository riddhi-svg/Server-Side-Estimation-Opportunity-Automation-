const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // We'll set a typical desktop user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  const url = 'https://pagespeed.web.dev/analysis/https-www-tvsmotor-com/e462y2liu0?form_factor=desktop';
  console.log(`Navigating to ${url}`);
  
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  
  console.log('Waiting for content to load...');
  try {
    // Wait for the performance score to show up, ensuring Lighthouse report is loaded
    await page.waitForSelector('.lh-root', { timeout: 30000 });
    console.log('.lh-root found.');
  } catch (e) {
    console.log('Timeout waiting for .lh-root, continuing anyway...');
  }
  
  // Give it an extra few seconds to make sure all dropdowns/tables expand if possible, or render fully
  await new Promise(r => setTimeout(r, 5000)); 
  
  console.log('Expanding all view details buttons...');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(b => {
      if (b.innerText && b.innerText.toLowerCase().includes('expand view')) {
        b.click();
      }
    });
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Extracting text content...');
  const markdownText = await page.evaluate(() => {
    function parseNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.replace(/\s+/g, ' ');
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }
      
      const tag = node.tagName.toLowerCase();
      // Ignore hidden or non-content tags
      if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'svg' || tag === 'path') {
        return '';
      }
      
      if (tag === 'a') {
        let text = '';
        for (let child of node.childNodes) text += parseNode(child);
        text = text.trim();
        const href = node.href;
        if (text && href && href.startsWith('http')) {
          return `[${text}](${href})`;
        }
        return text;
      }
      
      if (tag === 'img') {
        let alt = node.alt ? ` alt="${node.alt}"` : '';
        return `\n<img src="${node.src}"${alt}>\n`;
      }
      
      let text = '';
      for (let child of node.childNodes) {
        text += parseNode(child);
      }
      
      if (tag === 'div' || tag === 'p' || tag === 'section' || tag === 'li' || tag === 'tr' || tag === 'h1' || tag === 'h2' || tag === 'h3') {
        return '\n' + text.trim() + '\n';
      }
      return text;
    }
    
    const root = document.querySelector('c-wiz') || document.body;
    let text = parseNode(root);
    // Cleanup multiple newlines
    return text.replace(/\n\s*\n/g, '\n').trim();
  });
  
  const logFile = path.join(__dirname, '../logs/tvsmotor-detailed-report.txt');
  fs.writeFileSync(logFile, markdownText);
  console.log(`Saved report to ${logFile}`);
  
  await browser.close();
}

run().catch(console.error);
