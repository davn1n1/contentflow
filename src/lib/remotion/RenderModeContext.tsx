import { createContext } from "react";

/**
 * When true, compositions should use @remotion/media components
 * (required for @remotion/web-renderer).
 * When false (default), use standard "remotion" components
 * (works in Player preview and Lambda without mediabunny issues).
 */
export const RenderModeContext = createContext(false);
