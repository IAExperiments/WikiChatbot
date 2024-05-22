import * as cheerio from 'cheerio';
import https from 'https';
import url from 'url';
import { Document
 } from 'langchain/document';

async function fetchPage(pageUrl) {
    return new Promise((resolve, reject) => {
        https.get(pageUrl, (response) => {
            let data = '';
            if (response.statusCode !== 200) {
                reject(new Error(`Request failed with status code ${response.statusCode}`));
                return;
            }
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function loadDocument(imagebaseUrl, pageUrl) {
    try {
        const data = await fetchPage(pageUrl);
        const $ = cheerio.load(data);
        if(imagebaseUrl) {
            $('img').each((index, element) => {
                const imgSrc = $(element).attr('src');
                if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('https')) {
                    const absoluteUrl = url.resolve(imagebaseUrl, imgSrc);
                    $(element).attr('src', absoluteUrl);
                }
            });
        }

        const text = $("body").html();
        const description = $("meta[name='description']").attr("content");
        const title = $("meta[property='og:title']").attr("content");
        const lang = $("meta[property='og:locale']").attr("content")? $("meta[property='og:locale']").attr("content") : "en-US";
        return new Document({
            pageContent: text,
            metadata: {
              description,
              title,
              lang
            },
          });
        
    } catch (error) {
        console.error('Error processing or downloading', error);
        return null;
    }
}

export default async function (imagebaseUrl, urls) {
    let alldocs = [];
    for (let i=0; i<urls.length ; i++){
        const doc = await loadDocument(imagebaseUrl, urls[i]);
        alldocs.push(doc)
    }
    return alldocs;
  }

