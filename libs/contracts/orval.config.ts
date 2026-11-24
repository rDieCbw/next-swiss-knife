import { defineConfig } from "orval";

export default defineConfig({
  swiss: {
    input: "./openapi.json",
    output: {
      mode: "single",
      target: "./src/generated/client.ts",
      client: "react-query",
      httpClient: "fetch",
      override: {
        mutator: {
          path: "./src/mutator.ts",
          name: "customFetch",
        },
      },
    },
  },
});
