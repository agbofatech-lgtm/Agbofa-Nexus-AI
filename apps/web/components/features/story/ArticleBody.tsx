import type { ReactNode } from "react";

export interface ArticleBodyProps {
  content: string;
}

function renderBlock(block: string, index: number): ReactNode {
  const normalized = block.trim();
  if (!normalized) return null;

  if (normalized.startsWith("## ")) {
    return <h2 key={index}>{normalized.slice(3)}</h2>;
  }

  if (normalized.startsWith("> ")) {
    return <blockquote key={index}>{normalized.slice(2)}</blockquote>;
  }

  const lines = normalized.split("\n");
  if (lines.every((line) => line.startsWith("- "))) {
    return (
      <ul key={index}>
        {lines.map((line) => (
          <li key={line}>{line.slice(2)}</li>
        ))}
      </ul>
    );
  }

  return <p key={index}>{normalized}</p>;
}

export function ArticleBody({ content }: ArticleBodyProps) {
  const blocks = content.split(/\n\s*\n/);

  return (
    <section className="article-body" aria-label="Article body">
      {blocks.map(renderBlock)}
    </section>
  );
}
