import { BASE_URL } from "./constants";

type Component = {
  id: number;
  userId: string;
  content: string;
  fileName: string;
  score: number;
  createdAt: string;
  updatedAt: string;
};

export async function fetchComponents(
  username: string,
  fileNames: string[]
): Promise<Component[]> {
  try {
    const components = await fetch(`${BASE_URL}/api/components`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        fileNames,
      }),
    }).then((res) => res.json() as Promise<Component[]>);

    return components;
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to fetch components from ${BASE_URL}.`);
  }
}
