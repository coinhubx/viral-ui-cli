# ViralUI CLI

Website: https://viralui.com

Website Repo: https://github.com/ColeBlender/viral-ui-website

## ViralUI is for Next.js components

All components should be made specifically for Next.js

## Open Source

This project is still very raw. If you want a new feature then please feel encouraged to contribute on GitHub. Let's make this thing dope!

## shadcn/ui focus

ViralUI is meant to build on top of shadcn/ui. When using components from ViralUI it is advised to initialize shadcn/ui in your Next.js app first. Also, when designing components make sure to use the same CSS variables that come default with shadcn/ui.

Here they are (I also added --success):

- --background
- --foreground
- --card
- --card-foreground
- --popover
- --popover-foreground
- --primary
- --primary-foreground
- --secondary
- --secondary-foreground
- --muted
- --muted-foreground
- --accent
- --accent-foreground
- --destructive
- --destructive-foreground
- --success
- --border
- --input
- --ring

## Naming

Use kebab-case since this is what shadcn/ui already uses. Feel free to name your components whatever you want but as a user I would like it if your custom input was not called input.tsx because shadcn/ui already has that and I might want to use both in my project. I would call it something like cool-input.tsx or cole-input.tsx.

## components/ui folder

When using the CLI to add components to your project it will add the component to the components/ui folder. The CLI will automatically know if you're using the src folder or not.

## tsx > jsx

Although both tsx and jsx files are allowed it is strongly encouraged to use tsx files. TypeScript is the way.
