// Resolution mapping: Shotstack preset → pixel dimensions
export const RESOLUTION_MAP: Record<string, Record<string, { width: number; height: number }>> = {
  "16:9": {
    preview: { width: 512, height: 288 },
    "360": { width: 640, height: 360 },
    "480": { width: 848, height: 480 },
    "720": { width: 1280, height: 720 },
    "1080": { width: 1920, height: 1080 },
    "4k": { width: 3840, height: 2160 },
  },
  "9:16": {
    preview: { width: 288, height: 512 },
    "360": { width: 360, height: 640 },
    "480": { width: 480, height: 848 },
    "720": { width: 720, height: 1280 },
    "1080": { width: 1080, height: 1920 },
    "4k": { width: 2160, height: 3840 },
  },
  "1:1": {
    preview: { width: 288, height: 288 },
    "360": { width: 360, height: 360 },
    "480": { width: 480, height: 480 },
    "720": { width: 720, height: 720 },
    "1080": { width: 1080, height: 1080 },
    "4k": { width: 2160, height: 2160 },
  },
  "4:5": {
    preview: { width: 288, height: 360 },
    "360": { width: 360, height: 450 },
    "480": { width: 480, height: 600 },
    "720": { width: 720, height: 900 },
    "1080": { width: 1080, height: 1350 },
    "4k": { width: 2160, height: 2700 },
  },
};

// Static S3 assets used in the workflow (hardcoded in n8n Code nodes)
export const STATIC_ASSETS = {
  WHOOSH_IN: "https://fxforaliving.s3.eu-central-1.amazonaws.com/recursos/Whoosh3+IN.wav",
  WHOOSH_OUT: "https://fxforaliving.s3.eu-central-1.amazonaws.com/recursos/Whoosh4+OUT.wav",
  TRANSPARENT: "https://fxforaliving.s3.eu-central-1.amazonaws.com/recursos/Transparente.png",
  OPACITY_100: "https://fxforaliving.s3.eu-central-1.amazonaws.com/recursos/Opacidad100.mov",
  OPACITY_90: "https://fxforaliving.s3.eu-central-1.amazonaws.com/recursos/Opacidad90.mov",
  OPACITY_60: "https://fxforaliving.s3.eu-central-1.amazonaws.com/recursos/Opacidad60.mov",
  OPACITY_40: "https://fxforaliving.s3.eu-central-1.amazonaws.com/recursos/Opacidad40.mov",
} as const;

// Default values
export const DEFAULTS = {
  FPS: 30,
  RESOLUTION: "1080",
  ASPECT_RATIO: "16:9",
  BACKGROUND: "#000000",
} as const;
