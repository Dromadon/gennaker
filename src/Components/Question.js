import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import { Button } from "react-bootstrap";



const CORRECTION_MARKER = "# Correction"
const ANSWER_LINES_BY_SIZE = {
    "xs": 2,
    "sm": 5,
    "md": 8,
    "lg": 11,
    "xl": 14
}
const DEFAULT_ANSWER_SIZE = "md"

const Question = ({filePath, answerSize, displaySettings}) => {
    const [question, setQuestion] = useState("");
    const [correction, setCorrection] = useState("");

    useEffect(() => {
        console.debug("Fetching question content for filePath: " + filePath)
        fetch(filePath, {
            // This is needed for local access sadly
            headers: {
                'Content-Type': 'text',
                'Accept': 'text'
            }
        })
            .then((res) => res.text())
            .then((text) => {
                const [question, correction] = text.split(CORRECTION_MARKER)

                setQuestion(question)
                if (text.indexOf(CORRECTION_MARKER) >= 0) {
                    setCorrection(CORRECTION_MARKER + correction)
                } else {
                    setCorrection('');
                }
            });
    }, [filePath]);

    return (
        <div className="question no-break-inside d-block rounded mb-3 p-2">
            <div class="question-content">
                <Markdown content={question} filePath={filePath} />
            </div>
            <Answer correction={correction} filePath={filePath} answerSize={answerSize} displaySettings={displaySettings} />
        </div>
    )
}


const Answer = ({correction, filePath, answerSize, displaySettings}) => {
    if (displaySettings.displayCorrection) {
        return(
            <div class="question-correction">
                <Markdown content={correction} filePath={filePath} />
            </div>
        )
    }
    else if (displaySettings.displayAnswerSpace) {
        return (
            <div class="question-answer">
                <AnswerLines answerSize={answerSize} />
            </div>
        )
    }
}


const Markdown = ({content, filePath}) => (
    <ReactMarkdown
        children={content}
        transformImageUri={uri =>
            `${transformImageURI(uri, filePath)}`}
        components={{
            h1: ({ node, ...props }) => <h6 {...props} />,
            img: ({ node, ...props }) => <img class="img-fluid" {...props} />,
            table: ({ node, ...props }) => <table class="table table-sm table-borderless table-responsive" {...props} />
        }}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]} // This is OK as we can totally trust the Markdown 
    />
)

const AnswerLines = ({answerSize}) => {
    if (answerSize !== undefined && answerSize in ANSWER_LINES_BY_SIZE)
        var answerLines = ANSWER_LINES_BY_SIZE[answerSize];
    else
        var answerLines = ANSWER_LINES_BY_SIZE[DEFAULT_ANSWER_SIZE]

    return (
        <>
            <div class="print-only">
                {[...Array(answerLines)].map(() => <br />)}
            </div>
        </>
    )
}

export function transformImageURI(uri, filePath) {
    console.debug("Transforming URI: " + uri + " for filePath: " + filePath)
    let strippedPath = filePath.substr(0, filePath.lastIndexOf("/") + 1);
    return strippedPath + uri;
}

export { Question }