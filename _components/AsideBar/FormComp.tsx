"use client"
import React, { useEffect, useState } from 'react';
import { MdDelete } from "react-icons/md";

interface FormProps {
    title: string;
    id: string;
    setShowCIDS: React.Dispatch<React.SetStateAction<string[]>>
}

function FormComp({ title, id }: FormProps) {
    const [inputTitle, setInputTitle] = useState("");
    const handleOnChange = (e: React.FormEvent<HTMLInputElement>) => {
        const title = (e.target as HTMLTextAreaElement).value || "";
        setInputTitle(title);
    }
    useEffect(() => {
        setInputTitle(title);
    }, [title]);
    return (
        <form>
            <input type="text" name={title.slice(0, 5)} id={id} value={inputTitle} onChange={handleOnChange} />
            <button type="submit"><MdDelete /></button>
        </form>
    )
}

export default FormComp;