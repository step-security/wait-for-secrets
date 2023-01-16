import * as core from "@actions/core";
import * as kp from "keypair";
import * as crypto from "crypto";
import { buffer } from "stream/consumers";

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

export function setSecrets(secrets, privateKey) {
  secrets.forEach((secret) => {

    const buffer = Buffer.from(secret.Value, 'base64');
    const decryptedSecret = crypto.privateDecrypt({key: privateKey, passphrase: '',},buffer,).toString('utf-8')
    core.setOutput(secret.Name, decryptedSecret);
    core.setSecret(decryptedSecret);
  });

  console.log("\nSuccessfully set secrets!");
}

export function generateKeys(): string[]{
  var keyPair = kp.default();
  //console.log(keyPair)
  var keys = [keyPair.public, keyPair.private]
  return keys
}
