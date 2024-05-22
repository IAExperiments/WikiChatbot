export function loadWebUrlsfromEnvironment(){
const envVariables = process.env;
const websiteVariables = Object.keys(envVariables)
    .filter(key => key.startsWith('WEBSITE_'))
    .map(key => `${envVariables[key]}`);
console.log("Website urls ----------------------")
console.dir(websiteVariables, {depth : 1000});
console.log("----------------------")
 return websiteVariables;
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