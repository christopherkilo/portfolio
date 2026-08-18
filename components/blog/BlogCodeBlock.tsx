"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Token = { type: string; value: string };

const KEYWORDS =
  /\b(const|let|var|function|return|import|from|export|default|type|interface|if|else|async|await|new|void|class|extends|true|false|null|undefined|as|of|in)\b/g;

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const push = (type: string, value: string) => {
    if (!value) return;
    tokens.push({ type, value });
  };

  while (i < source.length) {
    const rest = source.slice(i);

    const comment = rest.match(/^\/\/[^\n]*/);
    if (comment) {
      push("comment", comment[0]);
      i += comment[0].length;
      continue;
    }

    const block = rest.match(/^\/\*[\s\S]*?\*\//);
    if (block) {
      push("comment", block[0]);
      i += block[0].length;
      continue;
    }

    const str = rest.match(/^(['"`])(?:\\.|(?!\1)[^\\])*\1/);
    if (str) {
      push("str", str[0]);
      i += str[0].length;
      continue;
    }

    const num = rest.match(/^\b\d+(?:\.\d+)?\b/);
    if (num) {
      push("num", num[0]);
      i += num[0].length;
      continue;
    }

    KEYWORDS.lastIndex = 0;
    const kw = KEYWORDS.exec(rest);
    if (kw && kw.index === 0) {
      push("kw", kw[0]);
      i += kw[0].length;
      continue;
    }

    const ident = rest.match(/^[A-Za-z_$][\w$]*/);
    if (ident) {
      const nextNonSpace = rest.slice(ident[0].length).match(/^\s*\(/);
      push(nextNonSpace ? "fn" : "plain", ident[0]);
      i += ident[0].length;
      continue;
    }

    const punct = rest.match(/^[{}()[\].,;:]/);
    if (punct) {
      push("punct", punct[0]);
      i += 1;
      continue;
    }

    const op = rest.match(/^[=<>!+\-*/%]+/);
    if (op) {
      push("op", op[0]);
      i += op[0].length;
      continue;
    }

    push("plain", source[i]);
    i += 1;
  }

  return tokens;
}

const TOKEN_CLASS: Record<string, string> = {
  comment: "tok tok-comment",
  str: "tok tok-str",
  num: "tok tok-num",
  kw: "tok tok-kw",
  fn: "tok tok-fn",
  punct: "tok tok-punct",
  op: "tok tok-op",
  plain: "tok tok-plain",
};

export function BlogCodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  const trimmed = code.replace(/\n$/, "");
  const tokens = useMemo(() => tokenize(trimmed), [trimmed]);

  return (
    <div className="code-panel blog-code-panel my-8 overflow-hidden rounded-2xl border border-white/10 bg-black/45">
      {language ? (
        <p className="border-b border-white/8 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {language}
        </p>
      ) : null}
      <pre className="overflow-x-auto p-4 text-[0.8125rem] leading-relaxed sm:p-5 sm:text-sm">
        <code>
          {tokens.map((token, index) => (
            <span
              key={`${index}-${token.type}`}
              className={cn(TOKEN_CLASS[token.type] ?? "tok tok-plain")}
            >
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
