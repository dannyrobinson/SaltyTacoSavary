import { build } from "esbuild";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "fs";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "esm",
  outfile: "dist/index.js",
  external: ["react", "react/jsx-runtime"],
  jsx: "automatic",
});

mkdirSync("dist", { recursive: true });
// Ship a self-contained stylesheet: tokens inlined ahead of the component CSS
// (a relative @import would dangle when the file is copied elsewhere).
const tokens = readFileSync("src/tokens.css", "utf8");
const styles = readFileSync("src/styles.css", "utf8").replace(/@import\s+"\.\/tokens\.css";\n?/, "");
writeFileSync("dist/styles.css", tokens + "\n" + styles);
cpSync("src/tokens.css", "dist/tokens.css");
console.log("built dist/");
