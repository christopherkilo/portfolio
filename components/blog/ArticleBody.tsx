import type { ReactNode } from "react";
import { Children, isValidElement } from "react";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugifyHeading } from "@/lib/blog/headings";
import { BlogCodeBlock } from "@/components/blog/BlogCodeBlock";
import { ScreenshotFrame } from "@/components/blog/ScreenshotFrame";

function headingText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(headingText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return headingText(
      (children as { props?: { children?: ReactNode } }).props?.children,
    );
  }
  return "";
}

const components: Components = {
  h2: ({ children }) => {
    const text = headingText(children);
    const id = slugifyHeading(text);
    return (
      <h2 id={id} className="blog-h2 scroll-mt-[var(--scroll-mt)]">
        {children}
      </h2>
    );
  },
  h3: ({ children }) => {
    const text = headingText(children);
    const id = slugifyHeading(text);
    return (
      <h3 id={id} className="blog-h3 scroll-mt-[var(--scroll-mt)]">
        {children}
      </h3>
    );
  },
  p: ({ children }) => {
    const items = Children.toArray(children).filter((child) => child !== "\n");
    if (
      items.length === 1 &&
      isValidElement(items[0]) &&
      items[0].type === ScreenshotFrame
    ) {
      return items[0];
    }
    return <p className="blog-p">{children}</p>;
  },
  ul: ({ children }) => <ul className="blog-ul">{children}</ul>,
  ol: ({ children }) => <ol className="blog-ol">{children}</ol>,
  li: ({ children }) => <li className="blog-li">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="blog-quote">{children}</blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="blog-link"
      {...(href?.startsWith("http")
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => (
    <ScreenshotFrame src={typeof src === "string" ? src : ""} alt={alt ?? ""} />
  ),
  table: ({ children }) => (
    <div className="blog-table-wrap">
      <table className="blog-table">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="blog-th">{children}</th>,
  td: ({ children }) => <td className="blog-td">{children}</td>,
  hr: () => <hr className="blog-hr" />,
  code: ({ className, children }) => {
    const language = /language-([a-z0-9]+)/i.exec(className ?? "")?.[1];
    const text = String(children);
    const inline = !className && !text.includes("\n");
    if (inline) {
      return <code className="blog-inline-code">{children}</code>;
    }
    return <BlogCodeBlock code={text} language={language} />;
  },
  pre: ({ children }) => <>{children}</>,
};

export function ArticleBody({ content }: { content: string }) {
  return (
    <div className="blog-prose">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
