import { existsSync, promises as fs } from "fs";
import path from "path";
import { getPackageManager } from "@/src/utils/get-package-manager";
import { handleError } from "@/src/utils/handle-error";
import { logger } from "@/src/utils/logger";
import { fetchComponents } from "@/src/utils/registry";
import { transform } from "@/src/utils/transformers";
import chalk from "chalk";
import { Command } from "commander";
import { execa } from "execa";
import ora from "ora";
import prompts from "prompts";
import { z } from "zod";

const addOptionsSchema = z.object({
  username: z.string(),
  components: z.array(z.string()),
  yes: z.boolean(),
  overwrite: z.boolean(),
  cwd: z.string(),
  all: z.boolean(),
  path: z.string().optional(),
});

export const add = new Command()
  .name("add")
  .description("add a component to your project")
  .argument("username", "the username of the component you want")
  .argument("[components...]", "the components to add")
  .option("-y, --yes", "skip confirmation prompt.", true)
  .option("-o, --overwrite", "overwrite existing files.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-a, --all", "add all available components", false)
  .option("-p, --path <path>", "the path to add the component to.")
  .action(async (username, components, opts) => {
    try {
      const options = addOptionsSchema.parse({
        username,
        components,
        ...opts,
      });

      const cwd = path.resolve(options.cwd);

      if (!existsSync(cwd)) {
        logger.error(`The path ${cwd} does not exist. Please try again.`);
        process.exit(1);
      }

      // const registryIndex = await getRegistryIndex();
      const payload = await fetchComponents();

      if (!payload.length) {
        logger.warn("Selected components not found. Exiting.");
        process.exit(0);
      }

      const spinner = ora(`Installing components...`).start();

      for (const item of payload) {
        spinner.text = `Installing ${item.fileName}...`;
        const targetDir = "@/components/ui";

        if (!targetDir) {
          continue;
        }

        if (!existsSync(targetDir)) {
          await fs.mkdir(targetDir, { recursive: true });
        }

        // const existingComponent = item.files.filter((file) =>
        //   existsSync(path.resolve(targetDir, file.name))
        // );

        // if (existingComponent.length && !options.overwrite) {
        //   if (selectedComponents.includes(item.name)) {
        //     spinner.stop();

        //     const { overwrite } = await prompts({
        //       type: "confirm",
        //       name: "overwrite",
        //       message: `Component ${item.name} already exists. Would you like to overwrite?`,
        //       initial: false,
        //     });

        //     if (!overwrite) {
        //       logger.info(
        //         `Skipped ${item.name}. To overwrite, run with the ${chalk.green(
        //           "--overwrite"
        //         )} flag.`
        //       );
        //       continue;
        //     }

        //     spinner.start(`Installing ${item.name}...`);
        //   } else {
        //     continue;
        //   }
        // }

        // for (const file of item.files) {
        //   let filePath = path.resolve(targetDir, file.name);

        //   // Run transformers.
        // const content = await transform({
        //   filename: item.fileName,
        //   raw: item.content,
        // });

        // console.log(content);

        await fs.writeFile("src/components/ui/button.tsx", item.content);
        // }

        //
        //
        //
        //
        // Good Below this

        // const packageManager = await getPackageManager(cwd);

        // Install dependencies.
        // if (item.dependencies?.length) {
        //   await execa(
        //     packageManager,
        //     [
        //       packageManager === "npm" ? "install" : "add",
        //       ...item.dependencies,
        //     ],
        //     {
        //       cwd,
        //     }
        //   );
        // }

        // // Install devDependencies.
        // if (item.devDependencies?.length) {
        //   await execa(
        //     packageManager,
        //     [
        //       packageManager === "npm" ? "install" : "add",
        //       "-D",
        //       ...item.devDependencies,
        //     ],
        //     {
        //       cwd,
        //     }
        //   );
        // }
      }

      spinner.succeed(`Done.`);
    } catch (error) {
      handleError(error);
    }
  });
