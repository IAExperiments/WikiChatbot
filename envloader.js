export default function loadWebUrlsfromEnvironment(){
const envVariables = process.env;
const websiteVariables = Object.keys(envVariables)
    .filter(key => key.startsWith('WEBSITE_'))
    .map(key => `${envVariables[key]}`);
console.log("Website urls ----------------------")
console.dir(websiteVariables, {depth : 1000});
console.log("----------------------")
 return websiteVariables;
}