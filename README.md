# wait-for-secrets

GitHub Action that waits for secrets to be entered during a workflow run. The secrets can be entered using a web browser.

## Why?
- To enable using one-time password (OTPs) for a release workflow.
- To remove need to persist secrets in GitHub Secrets. 
- You have more control over when secrets get used in your workflows.
- Even if someone has write access to the repository, they do not get access to the secrets

## How?

1. Add the `wait-for-secrets` GitHub Action to your workflow and specify the secrets you need. 
2. The Action will print a URL in the build log every 10 seconds. 
3. Click on the URL and enter the secrets that the workflow needs.
4. The Action will get the secrets you entered in the browser and continue execution. 
5. Use the retreived secrets in future steps. 

### AWS Secrets

Example on how to provide AWS credentials during the workflow. 

It needs the `id-token: write` permission to authenticate to the StepSecurity API. This is to ensure only the authorized workflow can retreive the secrets. 

``` yaml
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

``` yaml
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
