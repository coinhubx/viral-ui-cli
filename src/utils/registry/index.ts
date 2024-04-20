import path from "path";
import { Config } from "@/src/utils/get-config";
import {
  registryBaseColorSchema,
  registryIndexSchema,
  registryItemWithContentSchema,
  registryWithContentSchema,
} from "@/src/utils/registry/schema";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";
import { z } from "zod";
import { BASE_URL } from "../constants";

const baseUrl = process.env.COMPONENTS_REGISTRY_URL ?? BASE_URL;
const agent = process.env.https_proxy
  ? new HttpsProxyAgent(process.env.https_proxy)
  : undefined;

export async function getRegistryIndex() {
  try {
    const [result] = await fetchRegistry(["index.json"]);

    return registryIndexSchema.parse(result);
  } catch (error) {
    throw new Error(`Failed to fetch components from registry.`);
  }
}

export async function getRegistryBaseColors() {
  return [
    {
      name: "zinc",
      label: "Zinc",
    },
  ];
}

export async function getRegistryBaseColor(baseColor: string) {
  try {
    const [result] = await fetchRegistry([`colors/${baseColor}.json`]);

    return registryBaseColorSchema.parse(result);
  } catch (error) {
    throw new Error(`Failed to fetch base color from registry.`);
  }
}

export async function resolveTree(
  index: z.infer<typeof registryIndexSchema>,
  names: string[]
) {
  const tree: z.infer<typeof registryIndexSchema> = [];

  for (const name of names) {
    const entry = index.find((entry) => entry.name === name);

    if (!entry) {
      continue;
    }

    tree.push(entry);

    if (entry.registryDependencies) {
      const dependencies = await resolveTree(index, entry.registryDependencies);
      tree.push(...dependencies);
    }
  }

  return tree.filter(
    (component, index, self) =>
      self.findIndex((c) => c.name === component.name) === index
  );
}

export async function fetchTree(tree: z.infer<typeof registryIndexSchema>) {
  try {
    const paths = tree.map((item) => `ui/${item.name}.json`);
    const result = await fetchRegistry(paths);

    return registryWithContentSchema.parse(result);
  } catch (error) {
    throw new Error(`Failed to fetch tree from registry.`);
  }
}

export async function getItemTargetPath(config: Config, override?: string) {
  if (override) {
    return override;
  }

  if (config.aliases.ui) {
    return config.resolvedPaths.ui;
  }

  const parent = "components";
  if (!(parent in config.resolvedPaths)) {
    return null;
  }

  return path.join(
    config.resolvedPaths[parent as keyof typeof config.resolvedPaths],
    "ui"
  );
}

async function fetchRegistry(paths: string[]) {
  try {
    const results = await Promise.all(
      paths.map(async (path) => {
        const response = await fetch(`${baseUrl}/registry/${path}`, {
          agent,
        });
        return await response.json();
      })
    );

    return results;
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to fetch registry from ${baseUrl}.`);
  }
}
