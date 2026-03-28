"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";
import Editor from "@monaco-editor/react";

export interface MDXCodeEditorHandle {
  insertText: (text: string) => void;
}

interface MDXCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme?: string;
}

const MDXCodeEditor = forwardRef<MDXCodeEditorHandle, MDXCodeEditorProps>(
  ({ value, onChange, theme = "vs-dark" }, ref) => {
    const editorRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        const selection = editor.getSelection();
        const op = {
          range: selection,
          text,
          forceMoveMarkers: true,
        };
        editor.executeEdits("insert-snippet", [op]);
        editor.focus();
      },
    }));

    const handleEditorChange = (value: string | undefined) => {
      onChange(value || "");
    };

    const handleEditorDidMount = (editor: any, monaco: any) => {
      editorRef.current = editor;
    // Configure Monaco Editor for MDX
    try {
      monaco.languages.register({ id: "mdx" });
    } catch (e) {
      // Language might already be registered
    }

    try {
      // Set language configuration for MDX (similar to markdown)
      monaco.languages.setLanguageConfiguration("mdx", {
        comments: {
          blockComment: ["<!--", "-->"],
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
          ["<", ">"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: "<", close: ">" },
          { open: "`", close: "`" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
          { open: "**", close: "**" },
          { open: "*", close: "*" },
        ],
      });

      // Set tokenization rules for MDX
      monaco.languages.setMonarchTokenizer("mdx", {
        tokenizer: {
          root: [
            // Frontmatter
            [/^---$/, "keyword", "@frontmatter"],

            // JSX Components
            [/<[A-Z][a-zA-Z0-9]*/, "tag"],
            [/<\/[A-Z][a-zA-Z0-9]*>/, "tag"],
            [/\/>/, "tag"],

            // Markdown headers
            [/^#{1,6}\s.*$/, "heading"],

            // Code blocks
            [/```[\s\S]*?```/, "code"],
            [/`[^`]*`/, "code"],

            // Bold and italic
            [/\*\*[^*]*\*\*/, "strong"],
            [/\*[^*]*\*/, "emphasis"],

            // Links
            [/\[([^\]]*)\]\(([^)]*)\)/, "link"],

            // Lists
            [/^\s*[-*+]\s/, "list"],
            [/^\s*\d+\.\s/, "list"],

            // Blockquotes
            [/^>\s.*$/, "quote"],

            // JSX expressions
            [/\{[^}]*\}/, "expression"],
          ],

          frontmatter: [
            [/^---$/, "keyword", "@pop"],
            [/^[a-zA-Z_][a-zA-Z0-9_]*:/, "attribute.name"],
            [/"[^"]*"/, "string"],
            [/'[^']*'/, "string"],
          ],
        },
      });
    } catch (e) {
      // Tokenizer might already be set
      // MDX tokenizer already configured
    }

      // Add keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        window.dispatchEvent(new CustomEvent("editor-save"));
      });
    };

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          <h3 className="text-sm font-medium">MDX Source</h3>
          <div className="text-xs text-muted-foreground">
            Ctrl/Cmd + S to save
          </div>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            language="mdx"
            value={value}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme={theme}
            options={{
              automaticLayout: true,
              wordWrap: "on",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineHeight: 22,
              padding: { top: 16, bottom: 16 },
              folding: true,
              lineNumbers: "on",
              renderLineHighlight: "line",
              selectOnLineNumbers: true,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: false,
              renderWhitespace: "selection",
              renderControlCharacters: false,
            }}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-muted-foreground">
                  Loading editor...
                </div>
              </div>
            }
          />
        </div>
      </div>
    );
  }
);

MDXCodeEditor.displayName = "MDXCodeEditor";

export default MDXCodeEditor;
