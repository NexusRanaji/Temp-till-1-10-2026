import React, { useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

interface MathRendererProps {
  content: string | number | undefined | null;
  className?: string;
  inline?: boolean;
}

/**
 * Preprocess text to normalize math delimiters produced by LLMs.
 * LLMs frequently use:
 * - \[ equation \] -> $$ equation $$
 * - \( equation \) -> $ equation $
 * - escaped brackets \\[ equation \\] -> $$ equation $$
 * - raw math expressions
 */
function normalizeMathDelimiters(raw: string): string {
  if (!raw) return '';
  let text = String(raw);

  // Normalize escaped backslashes in front of brackets (e.g. \\\[ or \\\( )
  text = text.replace(/\\\\\[/g, '\\[').replace(/\\\\\]/g, '\\]');
  text = text.replace(/\\\\\(/g, '\\(').replace(/\\\\\)/g, '\\)');

  // Convert display math \[ ... \] to $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, formula) => {
    return `\n\n$$\n${formula.trim()}\n$$\n\n`;
  });

  // Convert inline math \( ... \) to $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, formula) => {
    return `$${formula.trim()}$`;
  });

  // Convert \begin{...} blocks to $$ ... $$ if not already wrapped in $
  text = text.replace(
    /(?<!\$|\\)(\\begin\{(?:equation|align|gather|matrix|pmatrix|bmatrix|vmatrix|cases)\*?\}[\s\S]*?\\end\{(?:equation|align|gather|matrix|pmatrix|bmatrix|vmatrix|cases)\*?\})(?!\$)/g,
    '\n\n$$\n$1\n$$\n\n'
  );

  // Normalize single dollar math with inner whitespace: e.g. `$ x = 5 $` -> `$x = 5$`
  text = text.replace(/\$([^\$\n]+?)\$/g, (match, inner) => {
    const trimmed = inner.trim();
    // Don't format lone numbers (e.g. $100 price)
    if (trimmed && !/^\d+(?:,\d+)*(?:\.\d+)?$/.test(trimmed)) {
      return `$${trimmed}$`;
    }
    return match;
  });

  return text;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  const processedText = useMemo(() => {
    return normalizeMathDelimiters(content ? String(content) : '');
  }, [content]);

  if (!processedText) {
    return null;
  }

  // Inline mode for options, question titles, badge labels, table cells, etc.
  if (inline) {
    return (
      <span className={`inline-math-container inline-flex flex-wrap items-baseline gap-x-1 ${className}`}>
        <Markdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
          components={{
            p: ({ children }) => <span className="inline">{children}</span>,
            span: ({ children, ...props }) => <span {...props}>{children}</span>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline">
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[0.85em] text-amber-600 dark:text-amber-400">
                {children}
              </code>
            ),
          }}
        >
          {processedText}
        </Markdown>
      </span>
    );
  }

  // Full rich display mode for Chatbot responses, detailed explanations, exam question blocks, etc.
  return (
    <div className={`math-renderer-content prose dark:prose-invert max-w-none text-inherit leading-relaxed ${className}`}>
      <Markdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-serif font-bold text-slate-900 dark:text-slate-100 mt-2.5 mb-1">
              {children}
            </h3>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 px-3 py-1.5 rounded-r-lg my-3 italic text-slate-700 dark:text-slate-300">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-100 dark:bg-slate-800/80 font-semibold">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white/50 dark:bg-slate-900/50">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 text-left text-slate-700 dark:text-slate-200 font-bold">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{children}</td>,
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.includes('language-') || (typeof children === 'string' && children.includes('\n'));
            if (isBlock) {
              return (
                <div className="relative my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 p-3 text-xs font-mono">
                  <pre className="overflow-x-auto">
                    <code>{children}</code>
                  </pre>
                </div>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[0.88em] text-amber-600 dark:text-amber-400 border border-slate-200/60 dark:border-slate-700/60">
                {children}
              </code>
            );
          },
          hr: () => <hr className="my-4 border-slate-200 dark:border-slate-800" />,
          strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-slate-100">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {processedText}
      </Markdown>
    </div>
  );
};
