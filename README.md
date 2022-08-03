# get-mfa-secrets b2
[![get-mfa-secrets](images/banner.png)](#)
Use Multi-Factor-Authentication (MFA) secrets in your GitHub Actions workflows

> :warning: This GitHub Action is not ready for Production use. 

## Why?
Lot of software is published using Continous Deployment (CD) Pipelines. Publishing secrets are typically stored with the CI/ CD provider. This makes it hard to use Multi-Factor-Authentication (MFA) to publish software. 

As an example, NPM allows use of OTP (one-time password) for publishing NPM package, but the OTP is only valid for a minute or so. This makes it hard to use it in the CD pipeline. 

This GitHub Action allows use of MFA and OTPs during the CD pipeline

## How does it work?
It waits for input when the credential is needed and prints out a website URL in the logs. You can click the link and enter the input in the StepSecurity website. The secret is then sent over to the GitHub Action, where it can be used. 
