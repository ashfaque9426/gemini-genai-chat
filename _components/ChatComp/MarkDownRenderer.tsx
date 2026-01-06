"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type Props = {
  text: string;
};

export default function MarkdownRenderer({ text }: Props) {
  const components: Components = {
    code({ node, children, ...props }) {
      const isInline = node?.tagName === "code";

      if (isInline) {
        return (
          <code
            className="rounded bg-muted px-1 py-0.5 text-sm"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100">
          <code>{children}</code>
        </pre>
      );
    },
  };

  return (
    <article className="prose prose-slate dark:prose-invert max-w-full my-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </article>
  );
}