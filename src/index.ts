import * as httpm from "@actions/http-client";
import * as core from "@actions/core"

(async () => {
  // call API
  let _http = new httpm.HttpClient();
  _http.requestOptions = { socketTimeout: 3 * 1000 };
  var counter = 0;
  var sendToSlack = true;
  while (true) {

    var repo = process.env["GITHUB_REPOSITORY"].split("/")[1];
    var owner = process.env["GITHUB_REPOSITORY"].split("/")[0];
    var runId = process.env["GITHUB_RUN_ID"];
    var authIDToken = core.getIDToken()

    var headers = new Headers().append("Authorization", "Bearer " + authIDToken)

    var secretsString = ""

    core.getMultilineInput("secrets").forEach( (secret) => {secretsString = secretsString + secret + ",";})

    secretsString = secretsString.slice(0, -1);

    var url = "https://9046hrh9g0.execute-api.us-west-2.amazonaws.com/v1/secrets?owner=" + owner + "&repo=" + repo + "&runId="+ runId+ "&secrets=" + secretsString;

    try {
      var response = await _http.get(
        url, {headers: {Authorization: 'Bearer ' + authIDToken}}
        //`https://9046hrh9g0.execute-api.us-west-2.amazonaws.com/v1/secrets?owner=step-security&repo=secureworkflows&runId=123&secrets=secret1,secret2`
      );
      // The response should be something like
      // {"repo":"step-security/secureworkflows","runId":"123","areSecretsSet":true,"secrets":[{"Name":"secret1","Value":"val1"},{"Name":"secret2","Value":"valueofsecret2"}]}
      if (response.message.statusCode === 200) {
        const body: string = await response.readBody();
        const respJSON = JSON.parse(body);
        
        if (respJSON.areSecretsSet === true) {
          //something
          respJSON.secrets.forEach( (secret) => {
            core.setOutput(secret.Name, secret.Value);
            core.setSecret(secret.Value);
        });

        console.log("Successfully set secrets!")
        break;
        }
        else{
          await sleep(9000);

          if(process.env.SLACK_WEBHOOK_URL){
            
            if(sendToSlack){
              var slackPostData = {"text":"https://int1.stepsecurity.io/secrets?owner=" + owner + "&repo=" + repo + "&runId=" + runId}
              
              var slackresponse = await _http.postJson(
                process.env.SLACK_WEBHOOK_URL, slackPostData
                //`https://9046hrh9g0.execute-api.us-west-2.amazonaws.com/v1/secrets?owner=step-security&repo=secureworkflows&runId=123&secrets=secret1,secret2`
              );
              // The response should be something like
              // {"repo":"step-security/secureworkflows","runId":"123","areSecretsSet":true,"secrets":[{"Name":"secret1","Value":"val1"},{"Name":"secret2","Value":"valueofsecret2"}]}
              
              if (slackresponse.statusCode === 200) {
                console.log("Visit the URL sent to Slack to input the secrets.")
                sendToSlack = false;
              }else{
                console.log("Error sending to Slack. Status code: " + slackresponse.statusCode)
              }}
          }else{
            console.log("Visit the URL to input the secrets:")
          
            console.log("https://int1.stepsecurity.io/secrets?owner=" + owner + "&repo=" + repo + "&runId=" + runId)

          }

        }
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
