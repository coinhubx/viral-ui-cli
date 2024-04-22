import { existsSync, promises } from "fs";
import path from "path";
import { handleError } from "@/src/utils/handle-error";
import { logger } from "@/src/utils/logger";
import { fetchComponents } from "@/src/utils/fetch-components";
import { Command } from "commander";
import ora from "ora";
import prompts from "prompts";
import { getPackageManager } from "../utils/get-package-manager";
import { execa } from "execa";
import { extractNewDependencies } from "../utils/extract-new-dependencies";

export const add = new Command()
  .name("add")
  .description("add a component to your project")
  .argument(
    "username",
    "the username of the author of the component(s) you want"
  )
  .argument("[fileNames...]", "the file names of the components to add")
  .action(async (username, fileNames) => {
    try {
      const cwd = path.resolve(process.cwd());

      const payload = await fetchComponents(username, fileNames);

      if (!payload.length) {
        logger.warn(
          "Selected components not found. Make sure username and component name(s) are correct."
        );
        process.exit(0);
      }

      if (payload.length < fileNames.length) {
        logger.warn("The following components were not found:");
        for (const fileName of fileNames) {
          const found = payload.find((item) => item.fileName === fileName);
          if (!found) {
            logger.warn(`- ${fileName}`);
          }
        }
      }

      const spinner = ora(`Adding components...`).start();

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
            message: `Component ${item.fileName} already exists. Would you like to overwrite it?`,
            initial: false,
          });

          if (!overwrite) {
            logger.info(`Skipped ${item.fileName}.`);
            continue;
          }
        }

        const filePath = path.resolve(targetDir, item.fileName);
        await promises.writeFile(filePath, item.content);

        const dependencies = await extractNewDependencies(item.content);
        const packageManager = await getPackageManager(cwd);
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

      spinner.succeed(`Done ✅`);
    } catch (error) {
      handleError(error);
    }
  });
