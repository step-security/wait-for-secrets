import * as httpm from "@actions/http-client";
import * as core from "@actions/core"

(async () => {
  // call API
  let _http = new httpm.HttpClient();
  _http.requestOptions = { socketTimeout: 3 * 1000 };
  var counter = 0;
  while (true) {

    var repo = process.env["GITHUB_REPOSITORY"].split("/")[1];
    var owner = process.env["GITHUB_REPOSITORY"].split("/")[0];
    var runId = process.env["GITHUB_RUN_ID"];

    var secretsString = ""

    core.getMultilineInput("secrets").forEach( (secret) => {secretsString = secretsString + secret + ",";})

    secretsString = secretsString.slice(0, -1);

    console.log(secretsString)

    var url = "https://9046hrh9g0.execute-api.us-west-2.amazonaws.com/v1/secrets?owner=" + owner + "&repo=" + repo + "&runId="+ runId+ "&secrets=secret1,secret2";

    try {
      // TODO: Replace owner, repo, runId, and list of secrets in the below API request with actual values
      var response = await _http.get(
        url
        //`https://9046hrh9g0.execute-api.us-west-2.amazonaws.com/v1/secrets?owner=step-security&repo=secureworkflows&runId=123&secrets=secret1,secret2`
      );
      // The response should be something like
      // {"repo":"step-security/secureworkflows","runId":"123","areSecretsSet":true,"secrets":[{"Name":"secret1","Value":"val1"},{"Name":"secret2","Value":"valueofsecret2"}]}
      
      // console.log(url)
      //console.log(response.readBody())
      // console.log(response)
      if (response.message.statusCode === 200) {
        const body: string = await response.readBody();
        const respJSON = JSON.parse(body);
        
        if (respJSON.areSecretsSet === true) {
          //something
          respJSON.secrets.forEach( (secret) => {
            core.setOutput(secret.Name, secret.Value);
        });
        break;
        }
        else{
          await sleep(9000);

          console.log("Visit the URL to input the secrets:")

          console.log("https://int1.stepsecurity.io/secrets?owner=" + owner + "&repo=" + repo + "&runId=" + runId)

        }

        //Go to URL to enter secrets

        // If areSecretsSet is set to false, it means the secrets are not yet set by user, so wait for 10 seconds and print the link.
        // Link should be of the form: https://app.stepsecurity.io/secrets?owner=step-security&repo=secureworkflows&runId=123
        // If areSecretsSet is set to true, take the secrets and set to output using core.setOutput(secretname, secretvalue)
        // https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#using-workflow-commands-to-access-toolkit-functions
        console.log(`retrying...`);
        let xyz = core.getInput("secrets")
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
