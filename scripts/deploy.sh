#!/usr/bin/env bash
# Build the site from published Sanity content and upload it to AWS.
# Run from Sim's Mac (GitHub Actions can't deploy yet: the AWS account's
# guardrails block the OIDC role it would use).
#
#   ./scripts/deploy.sh
#
# Uses the `iamsimr` AWS CLI profile. Override with AWS_PROFILE=...
set -euo pipefail
cd "$(dirname "$0")/.."

PROFILE="${AWS_PROFILE:-iamsimr}"
BUCKET="${S3_BUCKET:-iamsimr.com-site-802149819955}"
DISTRIBUTION="${CLOUDFRONT_DISTRIBUTION_ID:-E1UIUJG4KN39IJ}"

npm run build

# Fingerprinted assets never change content under the same name: cache for a year.
aws s3 sync dist/_astro "s3://$BUCKET/_astro" --profile "$PROFILE" \
  --cache-control "public, max-age=31536000, immutable"

# Everything else must be revalidated; remove files that no longer exist.
aws s3 sync dist "s3://$BUCKET" --profile "$PROFILE" --delete \
  --exclude "_astro/*" --cache-control "public, max-age=0, must-revalidate"

aws cloudfront create-invalidation --profile "$PROFILE" \
  --distribution-id "$DISTRIBUTION" --paths "/*" --query 'Invalidation.Id' --output text

echo "Deployed. Live at https://iamsimr.com in a minute or two."
