import {
  TUI,
  ProcessTerminal,
  Text,
  Markdown,
  MarkdownTheme,
  Loader,
  Editor,
  EditorTheme,
  matchesKey,
  Key,
  CombinedAutocompleteProvider,
  Spacer,
} from "@mariozechner/pi-tui";

import { harness } from "./index";
import type { HarnessMessage, HarnessEvent } from "@mastra/core/harness";
import chalk from "chalk";
import { RequestContext } from "@mastra/core/request-context";

let loading = false;
let currentMode = "research";

const editorTheme: EditorTheme = {
  borderColor: (s) => chalk.dim(s),
  selectList: {
    selectedPrefix: (s) => chalk.blue(s),
    selectedText: (s) => chalk.bold(s),
    description: (s) => chalk.dim(s),
    scrollInfo: (s) => chalk.dim(s),
    noMatch: (s) => chalk.dim(s),
  },
};

const mdTheme: MarkdownTheme = {
  heading: (s) => chalk.bold.cyan(s),
  link: (s) => chalk.blue(s),
  linkUrl: (s) => chalk.dim(s),
  code: (s) => chalk.yellow(s),
  codeBlock: (s) => chalk.green(s),
  codeBlockBorder: (s) => chalk.dim(s),
  quote: (s) => chalk.italic(s),
  quoteBorder: (s) => chalk.dim(s),
  hr: (s) => chalk.dim(s),
  listBullet: (s) => chalk.cyan(s),
  bold: (s) => chalk.bold(s),
  italic: (s) => chalk.italic(s),
  strikethrough: (s) => chalk.strikethrough(s),
  underline: (s) => chalk.underline(s),
};

function messageToText(message: HarnessMessage): string {
  return message.content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text)
    .join("");
}

export async function startTUI() {
  const terminal = new ProcessTerminal();
  const tui = new TUI(terminal);
  const editor = new Editor(tui, editorTheme, { paddingX: 1 });

  let messages: string[] = [];
  let loader: Loader | null = null;
  let renderScheduled = false;

  function scheduleRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    queueMicrotask(() => {
      renderScheduled = false;
      render();
    });
  }

  const provider = new CombinedAutocompleteProvider(
    [
      { name: "research", description: "Switch to research mode" },
      { name: "writing", description: "Switch to writing mode" },
      { name: "clear", description: "Clear chat" },
    ],
    process.cwd(),
  );
  editor.setAutocompleteProvider(provider);

  editor.onSubmit = async (value: string) => {
    if (!value.trim()) return;

    if (value.startsWith("/")) {
      if (value === "/research") {
        await harness.switchMode({ modeId: "research" });
      } else if (value === "/writing") {
        await harness.switchMode({ modeId: "writing" });
      } else if (value === "/clear") {
        messages = [];
        scheduleRender();
      }
      return;
    }

    loading = true;
    scheduleRender();

    await harness.sendMessage({ content: value });

    loading = false;
    scheduleRender();
  };

  harness.subscribe((event: HarnessEvent) => {
    switch (event.type) {
      case "message_start":
        messages.push("");
        scheduleRender();
        break;

      case "message_update":
        messages[messages.length - 1] = messageToText(event.message);
        scheduleRender();
        break;

      case "mode_changed":
        currentMode = event.modeId;
        scheduleRender();
        break;

      case "agent_start":
        loading = true;
        scheduleRender();
        break;

      case "agent_end":
        loading = false;
        scheduleRender();
        break;
    }
  });

  function render() {
    const children = tui.children;
    children.length = 0;

    children.push(
      new Text(` Mode: ${currentMode.toUpperCase()} (Ctrl+R / Ctrl+W)`, 0, 0),
    );
    children.push(new Spacer(1));

    for (const msg of messages) {
      children.push(new Markdown(msg, 1, 0, mdTheme));
    }

    if (loading) {
      loader = new Loader(
        tui,
        (s) => chalk.cyan(s),
        (s) => chalk.dim(s),
        "Thinking...",
      );
      loader.start();
      children.push(loader);
    }

    children.push(editor);
    tui.setFocus(editor);
    tui.requestRender();
  }

  terminal.start(
    async (data) => {
      if (matchesKey(data, Key.ctrl("r"))) {
        await harness.switchMode({ modeId: "research" });
        return;
      }

      if (matchesKey(data, Key.ctrl("w"))) {
        await harness.switchMode({ modeId: "writing" });
        return;
      }

      editor.handleInput(data);
    },
    () => scheduleRender(),
  );

  const requestContext = new RequestContext();
  requestContext.set("userId", "imonikhea");

  await harness.init();
  await harness.selectOrCreateThread();
  await harness.sendMessage({
    content:
      "my name is mike james and i am from Lagos, i like beans and bread i would love to visit spain save it to your working memory",
    requestContext,
  });
  render();
  tui.start();
}
