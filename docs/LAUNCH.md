# Launch runbook (one-time setup)

About 45 minutes of hands-on time, plus waiting for DNS. Do the steps in order.
Each step says **what you're doing and why**, so you learn the system as you build it.

Expected cost: about **$0.50–1/month** (the Route 53 hosted zone) plus your domain renewal.

---

## 0. Before you start

- [ ] An AWS account with MFA on the root user. Do the console work below as an
      IAM Identity Center or IAM admin user, not root.
- [ ] Set a **billing alarm**: Billing → Budgets → Create budget → "Zero spend" or a $5 monthly budget.
      *Why:* the single best protection against surprise bills while you learn.
- [ ] Switch the console region (top right) to **N. Virginia (us-east-1)**.
      *Why:* CloudFront only accepts HTTPS certificates created in us-east-1.
- [ ] This repo pushed to GitHub as `yosimothy/iamsimr.com`.
      (If you choose a different name, use it in step 3.)

## 1. Record your current email DNS

Log in to wherever iamsimr.com's DNS lives today (your registrar, or iCloud's
"Custom Email Domain" page shows the required records). Write down:

- the TXT record starting `apple-domain=`
- the CNAME for `sig1._domainkey` (its target looks like `sig1.dkim.iamsimr.com.at.icloudmailadmin.com`)
- any other records you've added yourself (anything not MX/SPF/DKIM). If there are any, tell Claude so they get added to `infra/dns.yaml`.

*Why:* in step 2 we create a fresh DNS zone in AWS. When you switch to it, any
record you didn't copy stops existing, and missing MX records = no email.

## 2. Create the DNS stack

CloudFormation → **Create stack** → *With new resources* → *Upload a template file* → `infra/dns.yaml`.

- Stack name: `iamsimr-dns`
- `AppleDomainVerification`: the full `apple-domain=...` value
- `DkimTarget`: the sig1 CNAME target

When it shows **CREATE_COMPLETE**, open **Outputs** and copy the four **NameServers**.

*What happened:* Route 53 now holds a complete copy of your DNS, but nobody's
asking it yet. The internet still asks your old provider.

## 3. Point the domain at Route 53

At your **registrar** (where you bought the domain), find "Nameservers" /
"Custom DNS" and replace the existing ones with the four from step 2.

*Why:* nameservers are the registry's pointer saying "for iamsimr.com, ask *these*
servers." Changes take anywhere from minutes to 48 hours to spread.

Check progress with `dig NS iamsimr.com +short` (or <https://dnschecker.org>).
When it returns the `awsdns` servers, send yourself a test email at hey@iamsimr.com.

## 4. Create the site stack

CloudFormation → Create stack → upload `infra/site.yaml`.

- Stack name: `iamsimr-site`
- `HostedZoneId`: from the dns stack's Outputs
- `GitHubRepo`: `yosimothy/iamsimr.com`
- `CreateGitHubOIDCProvider`: `true` (unless your account already has one: IAM → Identity providers)
- On the last page, tick **"I acknowledge that AWS CloudFormation might create IAM resources."**

This takes **10–30 minutes**, mostly waiting for the certificate to validate and
CloudFront to spread worldwide. If it sits on the Certificate for over an hour,
step 3 hasn't propagated yet; it'll finish on its own once it has.

*What happened:* a private bucket, a CDN with HTTPS in front of it, DNS records
pointing your domain at the CDN, and a role GitHub can borrow to deploy.

## 5. Connect GitHub to AWS

In the GitHub repo: **Settings → Secrets and variables → Actions → Variables tab → New repository variable**.
Create three, copying values from the site stack's **Outputs**:

| Variable | From output |
| --- | --- |
| `AWS_ROLE_ARN` | `DeployRoleArn` |
| `S3_BUCKET` | `BucketName` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `DistributionId` |

These are *variables*, not secrets: none of them grant access on their own.
Access comes from the role's trust rule, which only accepts workflows from your repo's `main` branch.

## 6. Deploy

Repo → **Actions** → *Build and deploy* → **Run workflow** (or just push to `main`).
When it's green, open <https://iamsimr.com>. 🎉

## 7. Auto-deploy when you publish in Sanity

The Sanity project (`j76vr3np`) and editor (<https://iamsimr.sanity.studio>) already exist,
and the build reads from it automatically. One link is left: telling GitHub to rebuild when you hit Publish.

1. Create a fine-grained GitHub token (Settings → Developer settings → Fine-grained tokens)
   limited to this repo with **Contents: Read and write**.
2. <https://www.sanity.io/manage> → iamsimr.com → API → **Webhooks** → Create:
   - URL: `https://api.github.com/repos/yosimothy/iamsimr.com/dispatches`
   - Dataset: `production`, Trigger on: Create, Update, Delete
   - Filter: `_type in ["post", "project"]`
   - Projection: `{"event_type": "sanity-publish"}`
   - HTTP method: POST, Drafts: off
   - HTTP headers: `Authorization: Bearer <your token>` and `Accept: application/vnd.github+json`

*What happened:* the website is "headless". Content lives in Sanity, presentation
lives in this repo, and the only link between them is a build that reads one from the other.
Publish in the editor → webhook → GitHub Actions → Astro build pulls from Sanity → S3 → CloudFront.

## If something's wrong

| Symptom | Likely cause |
| --- | --- |
| Workflow: "Not authorized to perform sts:AssumeRoleWithWebIdentity" | `GitHubRepo` in the stack doesn't exactly match the repo name, or you pushed from a branch other than `main`. |
| Site shows "Access Denied" XML | Nothing uploaded yet (run step 6), or the bucket policy didn't apply. |
| Browser warns about the certificate | DNS for www/apex not pointing at CloudFront yet; wait for step 3. |
| Old content after deploy | Invalidations take 1–2 minutes. Hard refresh. |
| Email stopped arriving | Compare Route 53's records with step 1's list. |
| Published in Sanity but nothing changed | Check the webhook's attempt log in sanity.io/manage; a 401/404 means the token or repo URL is wrong. |

## Tearing it down

Empty the S3 bucket, then delete `iamsimr-site`, then `iamsimr-dns`
(point the nameservers back to your registrar first, or email stops).
