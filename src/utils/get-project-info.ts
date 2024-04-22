import { existsSync } from "fs";
import path from "path";
import {
  Config,
  RawConfig,
  getConfig,
  resolveConfigPaths,
} from "@/src/utils/get-config";
import fg from "fast-glob";
import fs, { pathExists } from "fs-extra";
import { loadConfig } from "tsconfig-paths";
import { BASE_URL } from "./constants";

const PROJECT_TYPES = [
  "next-app",
  "next-app-src",
  "next-pages",
  "next-pages-src",
] as const;

type ProjectType = (typeof PROJECT_TYPES)[number];

const PROJECT_SHARED_IGNORE = [
  "**/node_modules/**",
  ".next",
  "public",
  "dist",
  "build",
];

export async function getProjectInfo() {
  const info = {
    tsconfig: null,
    srcDir: false,
    appDir: false,
    srcComponentsUiDir: false,
    componentsUiDir: false,
  };

  try {
    const tsconfig = await getTsConfig();

    return {
      tsconfig,
      srcDir: existsSync(path.resolve("./src")),
      appDir:
        existsSync(path.resolve("./app")) ||
        existsSync(path.resolve("./src/app")),
      srcComponentsUiDir: existsSync(path.resolve("./src/components/ui")),
      componentsUiDir: existsSync(path.resolve("./components/ui")),
    };
  } catch (error) {
    return info;
  }
}

export async function getTsConfig() {
  try {
    const tsconfigPath = path.join("tsconfig.json");
    const tsconfig = await fs.readJSON(tsconfigPath);

    if (!tsconfig) {
      throw new Error("tsconfig.json is missing");
    }

    return tsconfig;
  } catch (error) {
    return null;
  }
}

export async function getProjectConfig(cwd: string): Promise<Config | null> {
  // Check for existing component config.
  const existingConfig = await getConfig(cwd);
  if (existingConfig) {
    return existingConfig;
  }

  const projectType = await getProjectType(cwd);
  const tsConfigAliasPrefix = await getTsConfigAliasPrefix(cwd);

  if (!projectType || !tsConfigAliasPrefix) {
    return null;
  }

  const isTsx = await isTypeScriptProject(cwd);

  const config: RawConfig = {
    $schema: `${BASE_URL}/schema.json`,
    rsc: ["next-app", "next-app-src"].includes(projectType),
    tsx: isTsx,
    aliases: {
      utils: `${tsConfigAliasPrefix}/lib/utils`,
      components: `${tsConfigAliasPrefix}/components`,
    },
  };

  return await resolveConfigPaths(cwd, config);
}

export async function getProjectType(cwd: string): Promise<ProjectType | null> {
  const files = await fg.glob("**/*", {
    cwd,
    deep: 3,
    ignore: PROJECT_SHARED_IGNORE,
  });

  const isNextProject = files.find((file) => file.startsWith("next.config."));
  if (!isNextProject) {
    return null;
  }

  const isUsingSrcDir = await fs.pathExists(path.resolve(cwd, "src"));
  const isUsingAppDir = await fs.pathExists(
    path.resolve(cwd, `${isUsingSrcDir ? "src/" : ""}app`)
  );

  if (isUsingAppDir) {
    return isUsingSrcDir ? "next-app-src" : "next-app";
  }

  return isUsingSrcDir ? "next-pages-src" : "next-pages";
}

export async function getTsConfigAliasPrefix(cwd: string) {
  const tsConfig = await loadConfig(cwd);

  if (tsConfig?.resultType === "failed" || !tsConfig?.paths) {
    return null;
  }

  // This assume that the first alias is the prefix.
  for (const [alias, paths] of Object.entries(tsConfig.paths)) {
    if (paths.includes("./*") || paths.includes("./src/*")) {
      return alias[0];
    }
  }

  return null;
}

export async function isTypeScriptProject(cwd: string) {
  // Check if cwd has a tsconfig.json file.
  return pathExists(path.resolve(cwd, "tsconfig.json"));
}
