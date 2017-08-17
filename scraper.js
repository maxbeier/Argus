/* eslint-disable no-await-in-loop */

const request = require('request');
const cheerio = require('cheerio');
const low = require('lowdb');
const mail = require('./mail');
const diff = require('./diff');

const db = low('db.json');
db.defaults({ checks: [] }).write();

init();

async function init() {
   const now = Date.now();

   const checks = db.get('checks').value().filter((check) => {
      if (!check.lastChecked || !check.currentValue) return true;
      if (check.endingAt && (now > +new Date(check.endingAt))) return false;

      const nextCheck = new Date(check.lastChecked + (check.interval * 60 * 1000));
      return +nextCheck < now;
   });


   for (const check of checks) {
      const { id, selector, currentValue, changes = [] } = check;

      const html = await scrape(check.url);
      const $ = cheerio.load(html);
      const rawText = $(selector || 'body').text();
      const newValue = clean(rawText);
      const newData = { lastChecked: now };

      if (!currentValue) {
         newData.currentValue = newValue;
      }
      else if (currentValue !== newValue) {
         newData.currentValue = newValue;
         newData.changes = [...changes, {
            date: now,
            value: currentValue || '',
         }];
         const content = trim(diff(currentValue, newValue));
         await mail.sendChangeMail(check.email, { ...check, content });
      }

      await db.read().get('checks')
         .find({ id })
         .assign(newData)
         .write();
   }
}

async function scrape(url = '') {
   return new Promise((resolve, reject) => {
      request({ url }, (error, response, body) => {
         if (error) reject(error);
         resolve(body);
      });
   });
}

function clean(content = '') {
   return content
      .replace(/^\s*\n/mg, '\n') // remove multiple empty lines
      .replace(/^[\t ]*/mg, '') // remove leading whitespace
      .trim(); // remove any surrounding whitespace
}

function trim(content = '') {
   // if content is too long, reduce around first diff
   if (content.length > 1000) {
      const firstDiffPos = content.indexOf('<span class="bg-');
      const start = Math.max(firstDiffPos - 500, 0);
      const end = Math.min(firstDiffPos + 500, content.length);
      const slice = content.slice(start, end);
      return `...${slice}...`;
   }

   return content;
}
