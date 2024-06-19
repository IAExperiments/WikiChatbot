import fs from "fs"
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadWebUrlsfromEnvironment(){
    var wikifile = path.join(__dirname,'wikis.json');
    if (fs.existsSync(wikifile)){
        const websites = JSON.parse(fs.readFileSync(wikifile, {}));
        console.log("Website urls loaded from file ----------------------")
        console.dir(websites, {depth : 1000});
        console.log("----------------------")
        return websites;
    } else {
        const envVariables = process.env;
        const websiteVariables = Object.keys(envVariables)
            .filter(key => key.startsWith('WEBSITE'))
            .map(key => `${envVariables[key]}`);
        console.log("Website urls from environment ---------------------")
        console.dir(websiteVariables, {depth : 1000});
        console.log("----------------------")
        return websiteVariables;
    }
}

export function loadBaseImagePath(){
    const baseImageUrl = process.env.BASEIMAGEURL;
    if (baseImageUrl){
        console.log(`Base Image url ${baseImageUrl}`);
    }
    return baseImageUrl;
}

export function getEmbeddingsDeploymentName(){
    return process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME;
}

export function getImagesDescriptorDeploymentName(){
    return process.env.AZURE_OPENAI_API_VISION_DEPLOYMENT_NAME;
}