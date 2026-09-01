import { MastraBrowser } from "@mastra/core/agent";

import {
  LocalSandbox,
  LocalFilesystem,
  Workspace,
} from "@mastra/core/workspace";
import { BrowserViewer } from "@mastra/browser-viewer";

export const workspaceHarness = new Workspace({
  filesystem: new LocalFilesystem({
    basePath: "./workspace",
  }),
  sandbox: new LocalSandbox({
    workingDirectory: "./workspace",
    env: {
      NODE_ENV: "development",
    },
  }),
  skills: ["/skills", ".agents/skills"],
  bm25: true,
  lsp: true,
  autoIndexPaths: ["/workspace"],
  browser: new BrowserViewer({
    cli: "agent-browser",
    headless: false,
    onLaunch: async (browserInstance) => {
      console.log("Browser launched:", browserInstance);
    },
    onClose: async (browserInstance) => {
      console.log("Browser closed", browserInstance);
    },
  }) as unknown as MastraBrowser,
});
