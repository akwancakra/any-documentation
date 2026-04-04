export interface EditModeData {
  content: string;
  metadata: {
    title?: string;
    description?: string;
  };
  filePath: string;
}

export type AiProviderPref = "auto" | "openai" | "gemini" | "ollama";

export type AiAvailability = {
  openai: boolean;
  gemini: boolean;
  ollama: boolean;
} | null;

export type ViewMode = "split" | "editor" | "preview";

export type EditorThemeValue = "vs-dark" | "hc-black" | "vs" | "hc-light";

export interface ThemeOption {
  category: string;
  value: EditorThemeValue;
  label: string;
  icon: string;
}

export const THEME_OPTIONS: readonly ThemeOption[] = [
  { category: "Dark Themes", value: "vs-dark", label: "VS Code Dark", icon: "🌙" },
  { category: "Dark Themes", value: "hc-black", label: "High Contrast Dark", icon: "⚫" },
  { category: "Light Themes", value: "vs", label: "VS Code Light", icon: "☀️" },
  { category: "Light Themes", value: "hc-light", label: "High Contrast Light", icon: "⚪" },
] as const;

export const DEFAULT_MDX_CONTENT = `---
title: "New Document"
description: "A new MDX document"
---

# Welcome to MDX Editor

This is a **split view** editor for MDX files with **AI Enhancement**.

## Features

- 🎨 Live preview
- 📝 Syntax highlighting
- 🔥 Hot reload
- 📱 Responsive layout
- 🤖 **AI Enhancement** — auto-fix formatting and structure

## Try AI Enhancement

Below is intentionally messy content you can use to test AI enhancement:

### Messy Table

| Name    | Status | Notes                    |
| ------- | ------ | ------------------------ |
| Editor  | ✅     | Just testing             |
| Preview | ✅     | Real-time preview        |
| AI      | ✅     | OpenAI / Gemini / Ollama |

### Code Blocks

\`\`\`javascript
function test() {
          // unclosed-looking code block sample
}
\`\`\`

## Normal Content

<Callout type="info">
Use the **AI Enhancement** button in the toolbar to clean up the examples above.
</Callout>

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Fix Format</TabsTrigger>
    <TabsTrigger value="tab2">Tidy Layout</TabsTrigger>
    <TabsTrigger value="tab3">Improve Content</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Choose **"Fix Syntax & Format"** to repair syntax issues and broken formatting.
  </TabsContent>
  <TabsContent value="tab2">
    Choose **"Tidy Format"** to normalize spacing and consistency without changing meaning.
  </TabsContent>
  <TabsContent value="tab3">
    Choose **"Improve Content"** for clearer structure and richer MDX components.
  </TabsContent>
</Tabs>

Enjoy writing with AI! 🚀`;
