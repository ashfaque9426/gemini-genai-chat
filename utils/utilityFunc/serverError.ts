interface ServerErrorResponse {
    message: string;
    statusCode: number;
}

type ServerErrorInput = Error | { message?: string } | unknown;

export function serverError(msgStr: string, msgKeywords: string, msgKeywords2: string, msgKeywords3: string, msgKeywords4: string, err: ServerErrorInput, errStatusCode: number, errStatusCode2: number, errStatusCode3: number, errStatusCode4: number): ServerErrorResponse {
    let message = msgStr;
    let statusCode = 500;
    if (err instanceof Error) {
        message += ' Err:' + err.message;
    }
    if (msgKeywords.length > 0 && message.includes(msgKeywords)) statusCode = errStatusCode;
    else if (msgKeywords2.length > 0 && message.includes(msgKeywords2)) statusCode = errStatusCode2;
    else if (msgKeywords3.length > 0 && message.includes(msgKeywords3)) statusCode= errStatusCode3;
    else if (msgKeywords4.length > 0 && message.includes(msgKeywords4)) statusCode= errStatusCode4;
    return { message, statusCode };
}