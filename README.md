# wait-for-secrets

Use multi-factor authentication (MFA)/ one-time password (OTPs) in your GitHub Actions workflows. `wait-for-secrets` GitHub Action waits for secrets to be entered during a workflow run. You can enter the secrets using a web browser and then use the secrets in the workflow.

## Why?

- To enable using multi-factor authentication (MFA)/ one-time password (OTPs) for a release workflow, e.g. use OTP to publish to NPM registry.
- Even if someone has write access to the repository, they do not get access to the deployment secrets. e.g. you may not want to share the deployment credential with everyone who has write access to the repository.
- You have more control over when secrets get used in your workflows. You release the secret during the workflow run. No surprises that someone triggered a release on a weekend.

## How?

1. Add the `wait-for-secrets` GitHub Action to your workflow and specify the secrets you need.
2. The Action will print a URL in the build log every 10 seconds and wait for you to enter the secrets
3. Click on the URL and enter the secrets that the workflow needs.
4. The Action will get the secrets you entered in the browser and continue execution.
5. Use the retreived secrets in future steps.

### Publish to NPM registry using one-time password (OTP)

### AWS Secrets

Example on how to provide AWS credentials during the workflow.

```yaml
jobs:
  release:
    permissions:
      contents: read
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - uses: step-security/wait-for-secrets@v1
        id: wait-for-secrets
        with:
          secrets: |
            AWS_ACCESS_KEY_ID
            AWS_SECRET_ACCESS_KEY

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ steps.wait-for-secrets.outputs.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ steps.wait-for-secrets.outputs.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
```

### Slack notification

You can get a notification on Slack when the secret needs to be entered. Set the `slack-webhook-url` as shown below.
This example also shows how to publish to NPM registry using an OTP.

```yaml
jobs:
  release:
    permissions:
      contents: read
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - uses: step-security/wait-for-secrets@v1
        id: wait-for-secrets
        with:
          slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          secrets: |
            otp
            npm_token
      - run: |
          echo "//registry.npmjs.org/:_authToken=$NODE_AUTH_TOKEN" > .npmrc
          npm publish --otp ${{ steps.wait-for-secrets.outputs.otp }}
        env:
          NODE_AUTH_TOKEN: ${{ steps.wait-for-secrets.outputs.npm_token }}
```

### How does `wait-for-secrets` work?

### Actual examples

Here are a couple of workflows that use `wait-for-secrets`

1. https://github.com/step-security/secure-workflows/blob/main/.github/workflows/release.yml#L36-L49
2. https://github.com/step-security/wait-for-secrets/blob/main/.github/workflows/release.yml#L35-L44

### FAQ

1. Why does `wait-for-secrets` need `id-token: write` permission?

   It needs the `id-token: write` permission to authenticate to the StepSecurity API. This is to ensure only the authorized workflow can retreive the secrets.
