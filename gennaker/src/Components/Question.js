import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';

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
    const [content, setContent] = useState("");
    const [question, setQuestion] = useState("");
    const [correction, setCorrection] = useState("");

    useEffect(() => {fetch(props.filePath, {
        // This is needed for local access sadly
        headers : { 
          'Content-Type': 'text',
          'Accept': 'text'
        }
        })
        .then((res) => res.text())
        .then((text) => {
                setContent(text); 
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
        <div className="question rounded p-3 mb-2">
            <ReactMarkdown 
                children={question} 
                transformImageUri={uri =>
                    `${process.env.PUBLIC_URL}/${transformImageURI(uri, props.filePath)}`} 
                components={{h1: ({node, ...props}) => <h6 {...props} />}}
            />
            { props.displayCorrection ? 
                <ReactMarkdown 
                    children={correction} 
                    transformImageUri={uri =>
                        `${process.env.PUBLIC_URL}/${transformImageURI(uri, props.filePath)}`} 
                    components={{h1: ({node, ...props}) => <h6 class="text-primary" {...props} />}}
                /> : <AnswerLines answerSize={props.answerSize}/>

            }
        </div>
    )
}

function AnswerLines(props) {
    var answerLines = ANSWER_LINES_BY_SIZE[DEFAULT_ANSWER_SIZE];

    if (props.answerSize != undefined && props.answerSize in ANSWER_LINES_BY_SIZE) {
        answerLines = ANSWER_LINES_BY_SIZE[props.answerSize];
    } 

    return(
        <div>
            {[...Array(answerLines)].map(() => <br/>)}
        </div>
    )
}

export function transformImageURI(uri, filePath) {
    let strippedPath = filePath.substr(0, filePath.lastIndexOf("/")+1);
    return strippedPath + uri;
}

export {Question}