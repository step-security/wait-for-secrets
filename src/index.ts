import * as httpm from "@actions/http-client";

(async () => {
  // call API
  let _http = new httpm.HttpClient();
  _http.requestOptions = { socketTimeout: 3 * 1000 };
  var counter = 0;
  while (true) {
    try {
      // TODO: Replace owner, repo, runId, and list of secrets in the below API request with actual values
      var response = await _http.get(
        `https://9046hrh9g0.execute-api.us-west-2.amazonaws.com/v1/secrets?owner=step-security&repo=secureworkflows&runId=123&secrets=secret1,secret2`
      );
      // The response should be something like
      // {"repo":"step-security/secureworkflows","runId":"123","areSecretsSet":true,"secrets":[{"Name":"secret1","Value":"val1"},{"Name":"secret2","Value":"valueofsecret2"}]}

      if (response.message.statusCode === 200) {
        // If areSecretsSet is set to false, it means the secrets are not yet set by user, so wait for 10 seconds and print the link.
        // Link should be of the form: https://app.stepsecurity.io/secrets?owner=step-security&repo=secureworkflows&runId=123
        // If areSecretsSet is set to true, take the secrets and set to output using core.setOutput(secretname, secretvalue)
        // https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#using-workflow-commands-to-access-toolkit-functions
        console.log(`retrying...`);
        counter++;
        if (counter > 60) {
          console.log("timed out");
          break;
        }
        await sleep(1000);
      } else {
        let body: string = await response.readBody();
        console.log(`response: ${body}`);
        break;
      }
    } catch (e) {
      console.log(`error in connecting: ${e}`);
    }
  }
})();

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
