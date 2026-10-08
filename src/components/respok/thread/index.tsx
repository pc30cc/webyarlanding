import type { RespokTemplateModule } from "../types";
import { ThreadShell } from "./Shell";
import { pages } from "./pages";

/** Respok "Thread" English template. */
const template: RespokTemplateModule = {
  template: "thread",
  Shell: ThreadShell,
  pages,
};

export default template;
