import * as httpm from "@actions/http-client";
import * as core from "@actions/core";

interface HttpBinData {
  url: string;
  data: any;
  json: any;
  headers: any;
  args?: any;
}

(async () => {
  // call API
  let _http = new httpm.HttpClient();
  _http.requestOptions = { socketTimeout: 3 * 1000 };
  var counter = 0;
  var repo = process.env["GITHUB_REPOSITORY"].split("/")[1];
  var owner = process.env["GITHUB_REPOSITORY"].split("/")[0];
  var runId = process.env["GITHUB_RUN_ID"];
  var secretUrl =
    "https://int1.stepsecurity.io/secrets?owner=" +
    owner +
    "&repo=" +
    repo +
    "&runId=" +
    runId;

  var slackWebhookUrl = core.getInput("slack-webhook-url");
  if (slackWebhookUrl !== undefined && slackWebhookUrl !== "") {
    await sendToSlack(slackWebhookUrl, secretUrl);
  }

  var authIDToken = await core.getIDToken();

  var secretsString = core.getMultilineInput("secrets");
  console.log(JSON.stringify(secretsString));

  var url = "https://9046hrh9g0.execute-api.us-west-2.amazonaws.com/v1/secrets";
  const additionalHeaders = { Authorization: "Bearer " + authIDToken };

  var putResponse = await _http.putJson<HttpBinData>(
    url,
    secretsString,
    additionalHeaders
  );
  if (putResponse.statusCode !== 200) {
    console.log(`error in sending secret metadata`);
    return;
  }

  while (true) {
    try {
      var response = await _http.get(url, additionalHeaders);
      if (response.message.statusCode === 200) {
        const body: string = await response.readBody();
        const respJSON = JSON.parse(body);

        if (respJSON.areSecretsSet === true) {
          respJSON.secrets.forEach((secret) => {
            core.setOutput(secret.Name, secret.Value);
            core.setSecret(secret.Value);
          });

          console.log("\nSuccessfully set secrets!");
          var response = await _http.del(url, additionalHeaders);
          if (response.message.statusCode === 200) {
            console.log("Successfully cleared secrets");
          }
          break;
        } else {
          console.log(
            "\x1b[32m%s\x1b[0m",
            "Visit this URL to input secrets:",
            secretUrl
          );

          await sleep(9000);
        }

        counter++;
        if (counter > 60) {
          console.log("\ntimed out");
          break;
        }
        await sleep(1000);
      } else {
        let body: string = await response.readBody();
        if (body !== "Token used before issued") {
          console.log(`\nresponse: ${body}`);
          break;
        }
      }
    } catch (e) {
      console.log(`error in connecting: ${e}`);
    }
  }
})();

async function sendToSlack(slackWebhookUrl, url) {
  var slackPostData = { text: url };
  let _http = new httpm.HttpClient();
  _http.requestOptions = { socketTimeout: 3 * 1000 };
  var slackresponse = await _http.postJson(slackWebhookUrl, slackPostData);
  if (slackresponse.statusCode === 200) {
    console.log("Visit the URL sent to Slack to input the secrets.");
  } else {
    console.log(
      "Error sending to Slack. Status code: " + slackresponse.statusCode
    );
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
