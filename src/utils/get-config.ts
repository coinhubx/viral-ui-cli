import { resolveImport } from "@/src/utils/resolve-import";
import { cosmiconfig } from "cosmiconfig";
import { loadConfig } from "tsconfig-paths";
import { z } from "zod";

export const DEFAULT_COMPONENTS = "@/components";

// TODO: Figure out if we want to support all cosmiconfig formats.
// A simple components.json file would be nice.
const explorer = cosmiconfig("components", {
  searchPlaces: ["components.json"],
});

export const rawConfigSchema = z
  .object({
    $schema: z.string().optional(),
    rsc: z.coerce.boolean().default(false),
    tsx: z.coerce.boolean().default(true),
    aliases: z.object({
      components: z.string(),
      utils: z.string(),
      ui: z.string().optional(),
    }),
  })
  .strict();

export type RawConfig = z.infer<typeof rawConfigSchema>;

export const configSchema = rawConfigSchema.extend({
  resolvedPaths: z.object({
    utils: z.string(),
    components: z.string(),
    ui: z.string(),
  }),
});

export type Config = z.infer<typeof configSchema>;

export async function getConfig(cwd: string) {
  const config = await getRawConfig(cwd);

  if (!config) {
    return null;
  }

  return await resolveConfigPaths(cwd, config);
}

export async function resolveConfigPaths(cwd: string, config: RawConfig) {
  // Read tsconfig.json.
  const tsConfig = await loadConfig(cwd);

  if (tsConfig.resultType === "failed") {
    throw new Error(
      `Failed to load ${config.tsx ? "tsconfig" : "jsconfig"}.json. ${
        tsConfig.message ?? ""
      }`.trim()
    );
  }

  return configSchema.parse({
    ...config,
    resolvedPaths: {
      utils: await resolveImport(config.aliases["utils"], tsConfig),
      components: await resolveImport(config.aliases["components"], tsConfig),
      ui: config.aliases["ui"]
        ? await resolveImport(config.aliases["ui"], tsConfig)
        : await resolveImport(config.aliases["components"], tsConfig),
    },
  });
}

export async function getRawConfig(cwd: string): Promise<RawConfig | null> {
  try {
    console.log("A");
    const configResult = await explorer.search(cwd);
    console.log("B");

    if (!configResult) {
      return null;
    }
    console.log("C");
    const output = rawConfigSchema.parse(configResult.config);

    console.log("D");

    return output;
  } catch (error) {
    throw new Error(`Invalid configuration found in ${cwd}/components.json.`);
  }
}
