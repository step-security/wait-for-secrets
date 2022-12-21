import * as httpm from "@actions/http-client";
import * as core from "@actions/core";
import {
  generateSecretURL,
  parseDataFromEnvironment,
  setSecrets,
} from "./common";
interface HttpBinData {
  url: string;
  data: any;
  json: any;
  headers: any;
  args?: any;
}

(async () => {
  waitForSecrets();
})();

async function waitForSecrets() {
  // call API
  let _http = new httpm.HttpClient();
  _http.requestOptions = { socketTimeout: 3 * 1000 };
  var counter = 0;

  var environmentData = parseDataFromEnvironment();

  var secretUrl = generateSecretURL(
    environmentData[0],
    environmentData[1],
    environmentData[2]
  );

  var slackWebhookUrl = core.getInput("slack-webhook-url");

  var secretsTimeOut: number = +core.getInput("wait-timeout");

  if (slackWebhookUrl !== undefined && slackWebhookUrl !== "") {
    await sendToSlack(slackWebhookUrl, secretUrl);
  }

  var authIDToken = await core.getIDToken();

  var secretsString = core.getMultilineInput("secrets");

  var url = "https://prod.api.stepsecurity.io/v1/secrets";
  var additionalHeaders = { Authorization: "Bearer " + authIDToken };

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
      authIDToken = await core.getIDToken();
      additionalHeaders = { Authorization: "Bearer " + authIDToken };

      var response = await _http.get(url, additionalHeaders);
      if (response.message.statusCode === 200) {
        const body: string = await response.readBody();
        const respJSON = JSON.parse(body);

        if (respJSON.areSecretsSet === true) {
          setSecrets(respJSON.secrets);
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

        await sleep(1000);

        counter++;
        if (counter > 6 * secretsTimeOut) {
          console.log("\ntimed out");
          break;
        }
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
}

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
