import {
    generateSecretURL,
    sendToSlack,
    waitForSecrets,
    setSecrets
  } from "../src/index";

import * as cp from "child_process";

process.env["GITHUB_REPOSITORY"] = "step-security/test";
process.env["GITHUB_RUN_ID"] = "12345";
process.env["ACTIONS_ID_TOKEN_REQUEST_URL"] = "test_url";
process.env["ACTIONS_ID_TOKEN_REQUEST_TOKEN"] = "test_token";


test('generateSecretURL()', () => {
  expect(generateSecretURL()).toBe("https://app.stepsecurity.io/secrets/step-security/test/12345");
});

test('setSecrets()', () => {
  var secrets = ["Mock_Secret_1", "Mock_Secret_2"]
  expect(setSecrets(secrets)).toBe(undefined);
});
