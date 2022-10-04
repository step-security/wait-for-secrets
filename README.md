# wait-for-secrets

Use multi-factor authentication (MFA)/ one-time password (OTPs) in your GitHub Actions workflows. `wait-for-secrets` GitHub Action waits for secrets to be entered during a workflow run. You can enter the secrets using a web browser and then use the secrets in the workflow.

## Why?

- **MFA** To enable using multi-factor authentication (MFA)/ one-time password (OTPs) for a release workflow, e.g. use OTP to publish to NPM registry.
- **Separation of duties** Even if someone has write access to the repository, they do not get access to the deployment secrets. e.g. you may not want to share the deployment credential with everyone who has write access to the repository.
- **More control** You have more control over _when_ secrets get used in your workflows. No surprises that someone triggered a release on a weekend.
- **Less management overhead** No need to create separate deployment credentials. You can use your existing account for deployment. This removes need to manage and rotate a separate set of deployment credentials.

## How?

1. Add the `wait-for-secrets` GitHub Action to your workflow and specify the secrets you need.
2. The Action will print a URL in the build log every 10 seconds and wait for you to enter the secrets
3. Click on the URL and enter the secrets that the workflow needs.
4. The Action will get the secrets you entered in the browser and continue execution.
5. Use the retreived secrets in future steps.

### Publish to NPM registry using one-time password (OTP)

Use this workflow to publish to NPM registry using one-time password.

Prerequisites:

1. Setup [two-factor authentication](https://docs.npmjs.com/configuring-two-factor-authentication) for your account.
2. Require two-factor authentication to publish package. This can be [configured in the package settings](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification).
3. Create a `Publish` [access token](https://docs.npmjs.com/creating-and-viewing-access-tokens) and set it as a GitHub secret `NODE_AUTH_TOKEN`

```yaml
name: Publish Package to npmjs
on: workflow_dispatch

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "16.x"
          registry-url: "https://registry.npmjs.org"
      - uses: step-security/get-mfa-secrets@v1
        id: wait-for-secrets
        with:
          secrets: |
            OTP: 
              name: 'OTP to publish package'
              description: 'OTP from authenticator app'
      - run: npm ci
      - run: npm publish --otp ${{ steps.wait-for-secrets.outputs.OTP }}
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN }}
```

- When you run this workflow, you will see a link in the build log to enter the OTP.
- Click on the link and enter the OTP.
- The workflow will take the OTP and pass it to the `npm publish` step.
- OTP will be used to publish the package.

### Slack notification

You can get a notification on Slack when the secret needs to be entered. Set the `slack-webhook-url` as shown below.

### Deploy to AWS using temporary security credentials

Example on how to provide AWS temporary security credentials in a workflow.

```yaml
name: Deploy to AWS

on:
  workflow_dispatch:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  publish:
    permissions:
      contents: read
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - uses: step-security/wait-for-secrets@v1
        id: wait-for-secrets
        with:
          slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          secrets: |
            AWS_ACCESS_KEY_ID: 
              name: 'AWS access key id'
              description: 'Access key id for prod'
            AWS_SECRET_ACCESS_KEY:
              name: 'AWS secret access key'
              description: 'Secret access key for prod'
            AWS_SESSION_TOKEN:
              name: 'AWS session token'
              description: 'Session token for prod'

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ steps.wait-for-secrets.outputs.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ steps.wait-for-secrets.outputs.AWS_SECRET_ACCESS_KEY }}
          aws-session-token: ${{ steps.wait-for-secrets.outputs.AWS_SESSION_TOKEN }}
          aws-region: us-west-2
```

During the workflow run, you can generate temporary AWS credentials for your account and enter them using the browser.

### How does `wait-for-secrets` work?

[To be added]

### Actual examples

Here are a couple of workflows that use `wait-for-secrets`

1. Publish to NPM: https://github.com/step-security/supply-chain-goat/blob/main/.github/workflows/mfa_release.yml
2. Deploy to AWS: https://github.com/step-security/secure-workflows/blob/main/.github/workflows/release.yml#L36-L49
3. GitHub release: https://github.com/step-security/wait-for-secrets/blob/main/.github/workflows/release.yml#L35-L44

### FAQ

1. Why does `wait-for-secrets` need `id-token: write` permission?

   It needs the `id-token: write` permission to authenticate to the StepSecurity API. This is to ensure only the authorized workflow can retreive the secrets.
