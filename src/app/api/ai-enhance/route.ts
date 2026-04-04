import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getAiEnhanceAvailability } from "@/lib/ai-enhance-env";

type ProviderId = "openai" | "gemini" | "ollama";

const DEFAULT_ORDER: ProviderId[] = ["openai", "gemini", "ollama"];

function parseOrderFromEnv(): ProviderId[] {
  const raw = process.env.AI_ENHANCE_ORDER?.trim();
  if (!raw) return DEFAULT_ORDER;
  const seen = new Set<ProviderId>();
  const out: ProviderId[] = [];
  for (const part of raw.split(",")) {
    const p = part.trim().toLowerCase();
    if (
      (p === "openai" || p === "gemini" || p === "ollama") &&
      !seen.has(p)
    ) {
      seen.add(p);
      out.push(p);
    }
  }
  return out.length > 0 ? out : DEFAULT_ORDER;
}

function initializeProviders() {
  const envAvail = getAiEnhanceAvailability();
  return {
    openai: {
      id: "openai" as const,
      available: envAvail.openai,
      apiKey: process.env.OPENAI_API_KEY ?? "",
      model: process.env.OPENAI_AI_MODEL || "gpt-4o-mini",
    },
    gemini: {
      id: "gemini" as const,
      available: envAvail.gemini,
      model: process.env.GEMINI_AI_MODEL || "gemini-2.0-flash-exp",
      client: process.env.GEMINI_API_KEY
        ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        : null,
    },
    ollama: {
      id: "ollama" as const,
      available: envAvail.ollama,
      endpoint: process.env.OLLAMA_API_ENDPOINT || "http://localhost:11434",
      model: process.env.OLLAMA_AI_MODEL || "llama3.2",
      apiKey: process.env.OLLAMA_API_KEY,
    },
  };
}

type ProvidersState = ReturnType<typeof initializeProviders>;

function resolveTryOrder(
  providers: ProvidersState,
  preferred?: ProviderId | null
): ProviderId[] {
  const order = parseOrderFromEnv();
  let chain = order.filter((id) => providers[id].available);
  for (const id of DEFAULT_ORDER) {
    if (providers[id].available && !chain.includes(id)) {
      chain.push(id);
    }
  }
  if (
    preferred &&
    (preferred === "openai" ||
      preferred === "gemini" ||
      preferred === "ollama") &&
    providers[preferred].available
  ) {
    return [preferred, ...chain.filter((id) => id !== preferred)];
  }
  return chain;
}

async function generateWithOpenAI(
  prompt: string,
  config: { apiKey: string; model: string }
) {
  const client = new OpenAI({ apiKey: config.apiKey });
  const completion = await client.chat.completions.create({
    model: config.model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 4096,
  });
  const text = completion.choices[0]?.message?.content;
  if (text == null || text === "") {
    throw new Error("OpenAI returned empty response");
  }
  return text;
}

async function generateWithOllama(
  prompt: string,
  config: ProvidersState["ollama"]
) {
  const response = await fetch(`${config.endpoint}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
    },
    body: JSON.stringify({
      model: config.model,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { response?: string; text?: string };
  const out = data.response || data.text || "";
  if (!out) throw new Error("Ollama returned empty response");
  return out;
}

async function generateWithGemini(
  prompt: string,
  config: ProvidersState["gemini"]
) {
  if (!config.client) {
    throw new Error("Gemini client not initialized");
  }

  const model = config.client.getGenerativeModel({ model: config.model });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

async function generateForProvider(
  id: ProviderId,
  prompt: string,
  providers: ProvidersState
): Promise<string> {
  switch (id) {
    case "openai":
      return generateWithOpenAI(prompt, {
        apiKey: providers.openai.apiKey,
        model: providers.openai.model,
      });
    case "gemini":
      return generateWithGemini(prompt, providers.gemini);
    case "ollama":
      return generateWithOllama(prompt, providers.ollama);
    default: {
      const _exhaustive: never = id;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const providers = initializeProviders();
  return NextResponse.json({
    available: {
      openai: providers.openai.available,
      gemini: providers.gemini.available,
      ollama: providers.ollama.available,
    },
    order: parseOrderFromEnv(),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
  try {
    const body = (await req.json()) as {
      content?: string;
      type?: string;
      provider?: string;
    };
    const { content, type = "fix", provider: bodyProvider } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    let preferred: ProviderId | null = null;
    if (
      bodyProvider === "openai" ||
      bodyProvider === "gemini" ||
      bodyProvider === "ollama"
    ) {
      preferred = bodyProvider;
    }

    const providers = initializeProviders();
    const tryOrder = resolveTryOrder(providers, preferred);

    if (tryOrder.length === 0) {
      return NextResponse.json(
        {
          error:
            "No AI provider configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or OLLAMA_API_KEY in the environment.",
        },
        { status: 500 }
      );
    }

    let prompt = "";

    switch (type) {
      case "fix":
        prompt = `
You are an expert AI assistant specializing in MDX and Markdown formatting. Your task is to fix and clean up the provided MDX content.

Fix the following issues if they exist:
1. Syntax errors in MDX/Markdown
2. Incorrect table formatting
3. Inconsistent heading hierarchy
4. Poor list formatting
5. Unclosed code blocks
6. Broken link formatting
7. Unclosed or incorrectly formatted JSX components
8. Invalid frontmatter
9. Inconsistent spacing and indentation
10. Broken bold/italic formatting

Available components:
- <Callout type="info|warning|error">content</Callout>
- <Tabs defaultValue="tab1"><TabsList><TabsTrigger value="tab1">Tab 1</TabsTrigger></TabsList><TabsContent value="tab1">Content</TabsContent></Tabs>
- <Card title="Title">Content</Card>
- <Cards><Card>Content</Card></Cards>
- <Accordion><AccordionItem title="Title">Content</AccordionItem></Accordion>
- <Steps><Step>Content</Step></Steps>
- <Banner>Content</Banner>
- <PDFViewer src="/path/to/file.pdf" height="400px" />
- <VideoViewer src="/path/to/video.mp4" />

CRITICAL RULES:
- Do NOT change the original content or language
- ONLY fix formatting and syntax issues
- Preserve all existing information exactly
- Do NOT wrap the response in code blocks or markdown formatting
- Do NOT add \`\`\`mdx or any code block wrapper
- Return ONLY the raw MDX content without any wrapper
- If frontmatter exists, ensure valid YAML format
- If no issues exist, return the original content unchanged
- Maintain the original language (Indonesian/English) of the content

Content to fix:
${content}

Return ONLY the fixed MDX content without any explanation or code block wrapper.`;
        break;

      case "improve":
        prompt = `
You are an expert AI assistant specializing in content writing and MDX formatting. Your task is to improve the quality of the provided MDX content.

Enhance the content by:
1. Improving heading structure for better hierarchy
2. Adding clearer descriptions where needed
3. Optimizing the use of available MDX components
4. Improving table formatting for better information display
5. Adding callouts for important information
6. Organizing content with tabs when appropriate
7. Adding emphasis (bold/italic) in the right places
8. Improving flow and readability
9. Adding emoji for visual appeal (when appropriate)
10. Optimizing spacing and layout

Available components:
- <Callout type="info|warning|error">content</Callout>
- <Tabs defaultValue="tab1"><TabsList><TabsTrigger value="tab1">Tab 1</TabsTrigger></TabsList><TabsContent value="tab1">Content</TabsContent></Tabs>
- <Card title="Title">Content</Card>
- <Cards><Card>Content</Card></Cards>
- <Accordion><AccordionItem title="Title">Content</AccordionItem></Accordion>
- <Steps><Step>Content</Step></Steps>
- <Banner>Content</Banner>

CRITICAL RULES:
- Preserve ALL original information, do not remove any content
- ONLY improve formatting and presentation
- Do NOT change the language of the content
- Do NOT wrap the response in code blocks or markdown formatting
- Do NOT add \`\`\`mdx or any code block wrapper
- Return ONLY the raw MDX content without any wrapper
- Use components that fit the context appropriately
- Preserve frontmatter if it exists
- Maintain the original language (Indonesian/English) of all text content

Content to improve:
${content}

Return ONLY the improved MDX content without any explanation or code block wrapper.`;
        break;

      case "format":
        prompt = `
You are an expert AI assistant specializing in MDX and Markdown formatting. Your task is to clean up the formatting of the provided MDX content without changing its content.

Clean up formatting by:
1. Consistent spacing between elements
2. Proper indentation for nested elements
3. Consistent use of bold/italic
4. Clean and aligned table formatting
5. Consistent heading hierarchy
6. Consistent list formatting
7. Proper code block formatting
8. Proper line breaks between sections
9. Consistent use of quotes
10. Clean frontmatter formatting

CRITICAL RULES:
- Do NOT change any content or information whatsoever
- ONLY clean up formatting and spacing
- Preserve all text, links, and data exactly as they are
- Do NOT change the language of any content
- Do NOT wrap the response in code blocks or markdown formatting
- Do NOT add \`\`\`mdx or any code block wrapper
- Return ONLY the raw MDX content without any wrapper
- If frontmatter exists, clean up the YAML formatting
- Use consistent spacing throughout
- Maintain the original language (Indonesian/English) of all content

Content to format:
${content}

Return ONLY the formatted MDX content without any explanation or code block wrapper.`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid enhancement type" },
          { status: 400 }
        );
    }

    let enhancedContent = "";
    let usedProvider = "";
    let usedModel = "";
    let lastError: unknown;

    for (const id of tryOrder) {
      try {
        enhancedContent = await generateForProvider(id, prompt, providers);
        usedProvider = id;
        usedModel = providers[id].model;
        break;
      } catch (err) {
        lastError = err;
        console.error(`AI provider "${id}" failed:`, err);
      }
    }

    if (!enhancedContent) {
      console.error("All AI providers failed:", lastError);
      return NextResponse.json(
        { error: "Failed to enhance content with AI" },
        { status: 500 }
      );
    }

    enhancedContent = enhancedContent
      .replace(/^```mdx\s*\n/, "")
      .replace(/^```\s*\n/, "")
      .replace(/\n```\s*$/, "")
      .trim();

    if (enhancedContent.startsWith("```") && enhancedContent.endsWith("```")) {
      const lines = enhancedContent.split("\n");
      if (lines.length > 2) {
        lines.shift();
        lines.pop();
        enhancedContent = lines.join("\n");
      }
    }

    const trimmed = enhancedContent.trim();

    return NextResponse.json({
      enhancedContent: trimmed,
      originalLength: content.length,
      enhancedLength: trimmed.length,
      provider: usedProvider,
      model: usedModel,
    });
  } catch (error) {
    console.error("AI Enhancement error:", error);
    return NextResponse.json(
      { error: "Failed to enhance content with AI" },
      { status: 500 }
    );
  }
}
