import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { fileURLToPath } from 'url';
import imageDownload from './imagedownloader.js'
import path from 'path'
import fs from 'fs'
import {getImagesDescriptorDeploymentName} from "./envloader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadPrompt(){
    const filePath = path.join(__dirname,'imagedescriptor.txt');
    return fs.readFileSync(filePath, 'utf8');
  }


  function readFileAsBase64(filePath) {
    // Comprueba si el archivo existe
    if (!fs.existsSync(filePath)) {
        throw new Error('El archivo no existe.');
    }

    // Lee el archivo de forma síncrona
    const fileBuffer = fs.readFileSync(filePath);

    // Comprueba si el archivo es un JPG o PNG
    const fileExtension = path.extname(filePath).toLowerCase();
    if (fileExtension !== '.jpg' && fileExtension !== '.jpeg' && fileExtension !== '.png') {
        throw new Error('Only JPG o PNG are supported');
    }

    // Convierte el buffer a una cadena Base64
    const base64String = fileBuffer.toString('base64');

    // Devuelve la cadena Base64
    return `data:image/${fileExtension === '.png' ? 'png' : 'jpeg'};base64,${base64String}`;
}
  
export default async function (imageurl) {
    const output =  path.join(__dirname,'captura2.png')
    await imageDownload(imageurl,output).catch(console.error);
    const chat = new ChatOpenAI({
        azureOpenAIApiDeploymentName: getImagesDescriptorDeploymentName(),
        temperature: 0 });

    const message = new HumanMessage({
        content: [
            {
            type: "text",
            text: loadPrompt(),
            },
            {
            type: "image_url",
            image_url: {
                url: readFileAsBase64(output),
            },
            },
        ],
        });
    const res = await chat.invoke([message]);
    return res.content;
  }