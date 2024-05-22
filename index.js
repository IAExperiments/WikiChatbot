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
import websites from "./wikis.json" assert {type: 'json'};
import * as core from '@actions/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



var question = process.argv.pop();
console.log("question: " + question);
function loadPrompt(){
  const filePath = path.join(__dirname,'ragprompt.txt');
  return fs.readFileSync(filePath, 'utf8');
}

//Indexer

const input = `Question: ${question}`;
const docs = await loadfromurlarray(loadBaseImagePath(), websites);
const textSplitter = new RecursiveCharacterTextSplitter(
{ chunkSize: 1000, 
  chunkOverlap: 200
  });
const splits = await textSplitter.splitDocuments(docs);

const vectorStore = await MemoryVectorStore.fromDocuments(splits, new OpenAIEmbeddings());

// Retrieve and generate using the relevant snippets of the blog.
const retriever = vectorStore.asRetriever();
const prompt =  PromptTemplate.fromTemplate(loadPrompt());
const model = new ChatOpenAI({      
  azureOpenAIApiDeploymentName : 'gpt4Preview',
    temperature: 0 });

 const retrievedDocs = await retriever.getRelevantDocuments(input);

 const serializeDocs = (docs) => docs.map((doc) => doc.pageContent).join("\n");
 console.log("Sending to OpenAi:")
const chain = RunnableSequence.from([
  {
    context: retriever.pipe(serializeDocs),
    question: new RunnablePassthrough()
  },
  prompt,
  model,
  new StringOutputParser(),
]);

var result = await chain.invoke(input);
console.log("OpenAi Response:")
console.dir(result);
result = result.replace(/\\/g, '\\\\');
result = result.replace(/`/g, '\\`');
core.setOutput('answer', result);