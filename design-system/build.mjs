import { build } from "esbuild";
import { cpSync, mkdirSync } from "fs";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "esm",
  outfile: "dist/index.js",
  external: ["react", "react/jsx-runtime"],
  jsx: "automatic",
});

mkdirSync("dist", { recursive: true });
cpSync("src/styles.css", "dist/styles.css");
cpSync("src/tokens.css", "dist/tokens.css");
console.log("built dist/");
