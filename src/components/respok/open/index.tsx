import type { RespokTemplateModule } from "../types";
import { OpenShell } from "./Shell";
import { pages } from "./pages";

/** Respok "Open" English template. */
const template: RespokTemplateModule = {
  template: "open",
  Shell: OpenShell,
  pages,
};

export default template;
