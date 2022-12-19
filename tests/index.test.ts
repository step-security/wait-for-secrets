import {
    generateSecretURL,
    setSecrets,
    parseDataFromEnvironment
  } from "../src/index";

test('generateSecretURL()', () => {
  expect(generateSecretURL("step-security", "test","12345")).toBe("https://app.stepsecurity.io/secrets/step-security/test/12345");
});

// test('setSecrets()', () => {
//   var secrets = ["Mock_Secret_1", "Mock_Secret_2"]
//   expect(setSecrets(secrets)).toBe(undefined);
// });

test('parseDataFromEnvironment()', () => {
  process.env["GITHUB_REPOSITORY"] = "step-security/test";
  process.env["GITHUB_RUN_ID"] = "12345";

  expect(parseDataFromEnvironment()).toStrictEqual(["step-security","test","12345"]);
});
