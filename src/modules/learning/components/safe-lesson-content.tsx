import type { ReactNode } from "react";

function renderInlineFormatting(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={idx} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Renders structured plain/Markdown text into safe React elements.
 * Never uses dangerouslySetInnerHTML, preventing XSS from authored content.
 */
export function SafeLessonContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  function flushList(keyPrefix: number) {
    if (listItems.length === 0) return;
    const Tag = listOrdered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`list-${keyPrefix}`}
        className={
          listOrdered
            ? "my-3 list-decimal space-y-1.5 pl-6 text-sm leading-7 text-muted-foreground"
            : "my-3 list-disc space-y-1.5 pl-6 text-sm leading-7 text-muted-foreground"
        }
      >
        {listItems.map((item, i) => (
          <li key={i}>{renderInlineFormatting(item)}</li>
        ))}
      </Tag>
    );
    listItems = [];
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(index);
      return;
    }

    if (line.startsWith("### ")) {
      flushList(index);
      blocks.push(
        <h3 key={`h3-${index}`} className="mt-6 mb-2 text-base font-semibold text-foreground">
          {renderInlineFormatting(line.slice(4))}
        </h3>
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushList(index);
      blocks.push(
        <h2 key={`h2-${index}`} className="mt-6 mb-2 text-xl font-semibold text-foreground">
          {renderInlineFormatting(line.slice(3))}
        </h2>
      );
      return;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (listItems.length > 0 && listOrdered) {
        flushList(index);
      }
      listOrdered = false;
      listItems.push(line.slice(2));
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (listItems.length > 0 && !listOrdered) {
        flushList(index);
      }
      listOrdered = true;
      listItems.push(orderedMatch[1]);
      return;
    }

    flushList(index);
    blocks.push(
      <p key={`p-${index}`} className="my-3 text-sm leading-7 text-muted-foreground">
        {renderInlineFormatting(line)}
      </p>
    );
  });

  flushList(lines.length);

  return <div className="space-y-1">{blocks}</div>;
}
