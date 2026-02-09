"use client"
import React, { useEffect, useRef, useState } from 'react';
import { MdDelete } from "react-icons/md";

interface FormProps {
    title: string;
    id: string;
    setShowCID: React.Dispatch<React.SetStateAction<string>>
}

function FormComp({ title, id, setShowCID }: FormProps) {
    const [inputTitle, setInputTitle] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleOnChange = (e: React.FormEvent<HTMLInputElement>) => {
        const title = (e.target as HTMLTextAreaElement).value || "";
        setInputTitle(title);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            inputRef.current?.blur();
        }
        if (e.key === "Escape") {
            if (inputTitle === title) setInputTitle(title);
            inputRef.current?.blur();
        }
    }

    const handleOnBlur = () => {
        if (inputTitle !== title ) inputRef.current?.form?.requestSubmit();
        setShowCID("");
    }

    const initializeServAction = async () => {}

    const initializeDelAction = async () => {}

    useEffect(() => {
        setInputTitle(title);
    }, [title]);

    useEffect(() => {
        if (inputRef.current) {
            const len = inputRef.current.value.length;
            inputRef.current.focus();
            inputRef.current.setSelectionRange(len, len);
        }
    }, [inputTitle]);

    return (
        <form action={initializeServAction} className="flex items-center space-x-2">
            <input className="flex-1 bg-transparent text-sm text-neutral-200 px-2 py-1 rounded-md outline-none transition hover:bg-neutral-800/70 focus:bg-neutral-800 focus:ring-1 focus:ring-neutral-600" ref={inputRef} type="text" name={title.slice(0, 5)} id={id} value={inputTitle} onChange={handleOnChange} onKeyDown={handleKeyDown} onBlur={handleOnBlur}/>
            <button type="submit" formAction={initializeDelAction} className="text-red-400 hover:text-red-500 p-1"><MdDelete size={18} /></button>
        </form>
    )
}

export default FormComp;
