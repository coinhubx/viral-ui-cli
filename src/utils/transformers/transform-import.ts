import { Transformer } from "@/src/utils/transformers";

export const transformImport: Transformer = async ({ sourceFile }) => {
  const importDeclarations = sourceFile.getImportDeclarations();

  for (const importDeclaration of importDeclarations) {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

    // Replace @/registry/[style] with the components alias.
    if (moduleSpecifier.startsWith("@/registry/")) {
      importDeclaration.setModuleSpecifier(
        moduleSpecifier.replace(/^@\/registry\/[^/]+/, "@/components")
      );
    }

    // Replace `import { cn } from "@/lib/utils"`
    if (moduleSpecifier == "@/lib/utils") {
      const namedImports = importDeclaration.getNamedImports();
      const cnImport = namedImports.find((i) => i.getName() === "cn");
      if (cnImport) {
        importDeclaration.setModuleSpecifier(
          moduleSpecifier.replace(/^@\/lib\/utils/, "@/lib/utils")
        );
      }
    }
  }

  return sourceFile;
};
