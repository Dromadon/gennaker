import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'


const CORRECTION_MARKER="# Correction"
const ANSWER_LINES_BY_SIZE={
    "xs": 2,
    "sm": 5,
    "md": 8,
    "lg": 11,
    "xl": 14
}
const DEFAULT_ANSWER_SIZE="md"

function Question (props) {
    const [question, setQuestion] = useState("");
    const [correction, setCorrection] = useState("");

    console.log(props.filePath)
    useEffect(() => {fetch(props.filePath, {
        // This is needed for local access sadly
        headers : { 
          'Content-Type': 'text',
          'Accept': 'text'
        }
        })
        .then((res) => res.text())
        .then((text) => {
                const [question, correction] = text.split(CORRECTION_MARKER)
                
                setQuestion(question)
                if(text.indexOf(CORRECTION_MARKER)>=0) {
                    setCorrection(CORRECTION_MARKER+correction)
                } else {
                    setCorrection('');
                }
            });
        }, [props.filePath]);
    
    return (
        <div className="question no-break-inside d-block rounded p-3 mb-2">
            <div class="question-content">
                <ReactMarkdown 
                children={question} 
                transformImageUri={uri =>
                    `${transformImageURI(uri, props.filePath)}`} 
                components={{
                    h1: ({node, ...props}) => <h6 {...props}/>,
                    img: ({node, ...props}) => <img class="img-fluid" {...props}/>,
                    table: ({node, ...props}) => <table class="table table-sm table-borderless table-responsive" {...props}/>
                }}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}/>
            </div>
            { props.displayCorrection ?
                <ReactMarkdown 
                    class="question-correction"
                    children={correction} 
                    transformImageUri={uri =>
                        `${process.env.PUBLIC_URL}/${transformImageURI(uri, props.filePath)}`} 
                    components={{h1: ({node, ...props}) => <h6 class="text-primary" {...props}/>,
                                table: ({node, ...props}) => <table class="table table-sm" {...props}/>}}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]} // This is OK as we can totally trust the Markdown
                /> 
                :   <div class="question-answer"><AnswerLines answerSize={props.answerSize}/></div>
            }
        </div>
    )
}

function AnswerLines(props) {
    var answerLines = ANSWER_LINES_BY_SIZE[DEFAULT_ANSWER_SIZE];

    if (props.answerSize !== undefined && props.answerSize in ANSWER_LINES_BY_SIZE) {
        answerLines = ANSWER_LINES_BY_SIZE[props.answerSize];
    } 

    return(
        <div>
            {[...Array(answerLines)].map(() => <br/>)}
        </div>
    )
}

export function transformImageURI(uri, filePath) {
    console.debug(uri);
    console.debug(filePath);
    let strippedPath = filePath.substr(0, filePath.lastIndexOf("/")+1);
    console.debug(strippedPath);
    return strippedPath + uri;
}

export {Question}