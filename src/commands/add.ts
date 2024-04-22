import { existsSync, promises, readFileSync } from "fs";
import path from "path";
import { handleError } from "@/src/utils/handle-error";
import { logger } from "@/src/utils/logger";
import { fetchComponents } from "@/src/utils/fetch-components";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import prompts from "prompts";
import { z } from "zod";
import { getPackageManager } from "../utils/get-package-manager";
import { execa } from "execa";
import { extractNewDependencies } from "../utils/extract-new-dependencies";

const addOptionsSchema = z.object({
  username: z.string(),
  fileNames: z.array(z.string()),
  yes: z.boolean(),
  overwrite: z.boolean(),
  cwd: z.string(),
  all: z.boolean(),
  path: z.string().optional(),
});

export const add = new Command()
  .name("add")
  .description("add a component to your project")
  .argument("username", "the username of the component(s) you want")
  .argument("[fileNames...]", "the file names of the components to add")
  .option("-y, --yes", "skip confirmation prompt.", true)
  .option("-o, --overwrite", "overwrite existing files.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-a, --all", "add all available components", false)
  .option("-p, --path <path>", "the path to add the component to.")
  .action(async (username, fileNames, opts) => {
    try {
      const options = addOptionsSchema.parse({
        username,
        fileNames,
        ...opts,
      });

      const cwd = path.resolve(options.cwd);

      if (!existsSync(cwd)) {
        logger.error(`The path ${cwd} does not exist. Please try again.`);
        process.exit(1);
      }

      const payload = await fetchComponents(username, fileNames);

      if (!payload.length) {
        logger.warn("Selected components not found. Exiting.");
        process.exit(0);
      }

      const spinner = ora(`Installing components...`).start();

      for (const item of payload) {
        const srcPath = path.join(cwd, "src");
        const targetDir = existsSync(srcPath)
          ? "src/components/ui"
          : "components/ui";

        if (item.fileName.includes("/")) {
          const dirArray = item.fileName.split("/");
          const dir = dirArray.slice(0, dirArray.length - 1).join("/");
          await promises.mkdir(path.resolve(targetDir, dir), {
            recursive: true,
          });
        } else if (!existsSync(targetDir)) {
          await promises.mkdir(targetDir, { recursive: true });
        }

        const existingComponent = existsSync(
          path.resolve(targetDir, item.fileName)
        );

        if (existingComponent) {
          spinner.stop();

          const { overwrite } = await prompts({
            type: "confirm",
            name: "overwrite",
            message: `Component ${item.fileName} already exists. Would you like to overwrite?`,
            initial: false,
          });

          if (!overwrite) {
            logger.info(
              `Skipped ${
                item.fileName
              }. To overwrite, run with the ${chalk.green("--overwrite")} flag.`
            );
            continue;
          }
        }

        const filePath = path.resolve(targetDir, item.fileName);
        await promises.writeFile(filePath, item.content);

        const dependencies = await extractNewDependencies(item.content);
        const packageManager = await getPackageManager(cwd);
        // Install dependencies.
        if (dependencies?.length) {
          await execa(
            packageManager,
            [packageManager === "npm" ? "install" : "add", ...dependencies],
            {
              cwd,
            }
          );
        }
      }

      spinner.succeed(`Done.`);
    } catch (error) {
      handleError(error);
    }
  });
