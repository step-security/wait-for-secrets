import * as core from "@actions/core";

export function parseDataFromEnvironment(): string[] {
  var repo = process.env["GITHUB_REPOSITORY"].split("/")[1];
  var owner = process.env["GITHUB_REPOSITORY"].split("/")[0];
  var runId = process.env["GITHUB_RUN_ID"];

  let infoArray: string[] = [owner, repo, runId];

  return infoArray;
}

export function generateSecretURL(owner, repo, runId): string {
  var secretUrl = `https://app.stepsecurity.io/secrets/${owner}/${repo}/${runId}`;
  return secretUrl;
}

export function setSecrets(secrets) {
  secrets.forEach((secret) => {
    core.setOutput(secret.Name, secret.Value);
    core.setSecret(secret.Value);
  });

  console.log("\nSuccessfully set secrets!");
}
