import { HttpsProxyAgent } from "https-proxy-agent";
// import fetch from "node-fetch";
import { BASE_URL } from "../constants";

// const agent = process.env.https_proxy
//   ? new HttpsProxyAgent(process.env.https_proxy)
//   : undefined;

type Component = {
  id: number;
  userId: string;
  content: string;
  fileName: string;
  score: number;
  createdAt: string;
  updatedAt: string;
};

export async function fetchComponents(): Promise<Component[]> {
  try {
    const component = await fetch(`${BASE_URL}/api/components`, {
      method: "POST",
      // agent,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "cole",
        fileName: "button.tsx",
      }),
    }).then((res) => res.json() as Promise<Component>);

    return [component];
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to fetch registry from ${BASE_URL}.`);
  }
}
