import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import loadfromurlarray from "./scraper.js";
import { loadWebUrlsfromEnvironment, loadBaseImagePath }  from "./envloader.js";
import * as core from '@actions/core';
import imageDescriptor from './imageDescriptor.js'

const websites = loadWebUrlsfromEnvironment()


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var question = process.argv.pop();
console.log("question: " + question);
function loadPrompt(){
  const filePath = path.join(__dirname,'ragprompt.txt');
  return fs.readFileSync(filePath, 'utf8');
}


function extractandsanitizeMarkdown(markdownContent) {
  // Expresión regular para encontrar las imágenes en Markdown
  const imageLinkPattern = /!\[.*?\]\((.*?)\)/g;
  
  // Extraer los enlaces de las imágenes
  const imageLinks = [];
  let match;
  
  while ((match = imageLinkPattern.exec(markdownContent)) !== null) {
      imageLinks.push(match[1]);
  }

  // Eliminar las imágenes del contenido de Markdown
  const sanitizedContent = markdownContent.replace(imageLinkPattern, '');

  return {
      sanitizedContent,
      imageLinks
  };
}

//TestImage
let imageDescriptions = [];
const inputsanitized  = extractandsanitizeMarkdown(question);
for (let i =0; i< inputsanitized.imageLinks.length; i++){
  imageDescriptions[i] = await imageDescriptor(inputsanitized.imageLinks[i]);
}
console.log("Screenshots descriptions");
console.dir(imageDescriptions, {depth:1000});

//Indexer
const input = `Question: ${inputsanitized.sanitizedContent}` ;
console.log(input);
const docs = await loadfromurlarray(loadBaseImagePath(), websites);
const textSplitter = new RecursiveCharacterTextSplitter(
{ chunkSize: 1000, 
  chunkOverlap: 200
  });
const splits = await textSplitter.splitDocuments(docs);

const vectorStore = await MemoryVectorStore.fromDocuments(splits, new OpenAIEmbeddings());

// Retrieve and generate using the relevant snippets of the blog.
const retriever = vectorStore.asRetriever();
let promptTpl = loadPrompt();
promptTpl = promptTpl.replace("{images}", imageDescriptions.join(".\n"));
console.log("PROMPT:")
console.log(promptTpl)
const prompt =  PromptTemplate.fromTemplate(promptTpl);
const model = new ChatOpenAI({      
  temperature: 0 });

 const retrievedDocs = await retriever.getRelevantDocuments(input);

 const serializeDocs = (docs) => docs.map((doc) => doc.pageContent).join("\n");
 console.log("Sending to OpenAi:")

  const chain = RunnableSequence.from([
  {
    context: retriever.pipe(serializeDocs),
    // images: () => imageDescriptions[0],
    question: new RunnablePassthrough(),
  },
  prompt,
  model,
  new StringOutputParser(),
]);

const inputOAI = `question: ${inputsanitized.sanitizedContent}`;

//var result = await chain.invoke(input);
var result = await chain.invoke(inputOAI);
console.log("OpenAi Response:")
console.dir(result);
result = result.replace(/\\/g, '\\\\');
result = result.replace(/`/g, '\\`');
core.setOutput('answer', result);