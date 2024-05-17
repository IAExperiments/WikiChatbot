import "cheerio";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";

export default async function loadfromurlarray(urls) {
    let alldocs = [];
    for (let i=0; i<urls.length ; i++){
        const loader = new CheerioWebBaseLoader(urls[i]);
        const docs = await loader.load();
        alldocs.push(...docs)
    }
    return alldocs;
  }