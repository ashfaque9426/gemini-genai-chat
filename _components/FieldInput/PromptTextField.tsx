"use client"
import React from 'react';
import cn from '@/utils/clsx';

interface FieldInputProps {
    name: string;
    id: string;
    value: string;
    placeholder?: string;
    inputStyles?: string;
    onEventChange?: (e: React.FormEvent<HTMLTextAreaElement>) => void;
    sendPrompt?: () => void;
}

export default function PromptTextField({
    name,
    id,
    placeholder,
    inputStyles,
    value,
    onEventChange,
    sendPrompt
}: FieldInputProps) {
    const ref = React.useRef<HTMLTextAreaElement>(null);

    const resize = () => {
        const el = ref.current;
        if (!el) return;

        if (!el.value.includes("\n")) {
            el.style.height = "auto";
            return;
        }

        const maxHeight = 384;
        el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;

        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    };

    const resetHeight = () => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
    };

    const handleInput = () => {
        if (value === "") {
            resetHeight();
            return;
        }

        resize();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value !== "" && value.trim().length > 0) sendPrompt?.();
            resetHeight();
            return;
        }

        if (e.key === "Enter" && e.shiftKey) {
            requestAnimationFrame(resize);
        }
    };

    return (
        <textarea
            ref={ref}
            rows={1}
            name={name}
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={onEventChange}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className={cn(
                "text-md px-2 py-3 border border-gray-400 rounded-lg",
                "bg-black/80 text-white placeholder:text-gray-300",
                "resize-none",
                "min-h-12 max-h-96",
                "transition-all duration-150",
                inputStyles
            )}
        />
    );
}
