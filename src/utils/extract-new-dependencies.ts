import { readFileSync } from "fs";
import path from "path";

export async function extractNewDependencies(
  content: string
): Promise<string[]> {
  const regex = /import.*from ["']([^"']+)["']/g;
  let match;
  const dependencies = [];

  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const existingDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
  };

  while ((match = regex.exec(content)) !== null) {
    const pkg = match[1];

    if (!pkg.startsWith(".") && !pkg.startsWith("/") && !pkg.startsWith("@/")) {
      const pkgBaseDir = pkg.split("/")[0];
      if (!existingDependencies[pkg] && !existingDependencies[pkgBaseDir]) {
        dependencies.push(pkg);
      }
    }
  }
  return dependencies;
}
