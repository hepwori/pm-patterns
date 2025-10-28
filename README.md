# PM Patterns

## Vercel preview deployments

Pull requests automatically build and deploy a preview version of the site to Vercel via GitHub Actions.

To enable the workflow, add the following repository secrets with values from your Vercel project settings:

- `VERCEL_TOKEN` – A Vercel personal token with access to the project.
- `VERCEL_ORG_ID` – The organization (or team) ID that owns the project.
- `VERCEL_PROJECT_ID` – The project ID for this site.

After the secrets are configured, every non-draft pull request will receive a comment containing the preview URL once the deployment succeeds.
