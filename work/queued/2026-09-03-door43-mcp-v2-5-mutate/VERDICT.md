# VERDICT — `mutate` floor (captain ruling 2026-09-03 ~01:25 ET, pick 1: A + B + C)

Source: `REFUSED-CANDIDATES.md` (DCS 1.27.2+dcs, 323 paths, 243 write operations observed live 2026-09-03T05:14Z). Captain's words: "Refuse lists tons of actions that seem useful… maybe all refusals are just confirm? Or some how dangerously overridable… maybe we direct users to create a GH issue for items they want/need if they get a refusal and leave it at that." Ruled as three parts; `src/refused.ts` is generated from the table below and test-pinned.

**A — REFUSE is what no one can undo. Six rows.** Everything else that was REFUSE drops to CONFIRM (useful, dangerous, undoable by someone; DCS still enforces who may call it — T2).
**B — Every refusal teaches.** The `403` envelope's `hints[]` carries a pre-formed issue link `https://github.com/klappy/door43-mcp/issues/new?title=mutate:+<VERB>+<path>&labels=refused` and the DCS UI path. No in-band override; the issue is the appeal.
**C — Overridable per deployment, never per call.** Worker var `REFUSED_ALLOW` (comma-separated `VERB path` entries) opens a refused row on that deployment only; set by the operator with `wrangler` (HUMAN-ONLY, stays human); every such call logs `override: 1` in telemetry (column added to the allowlist). Default unset. The caller cannot unlock anything from the wire.

Counts after ruling: REFUSE 6 · CONFIRM 112 · FREE 125.


## REFUSE (6)

| Rule | Verb | Path | Swagger summary |
|---|---|---|---|
| REFUSE | DELETE | `/admin/users/spam` | Delete spam users - deletes those listed in the spam users list, but WILL NOT delete those that logged in more than 2 days from signing up, have repos, or was created in the last week. |
| REFUSE | DELETE | `/admin/users/{username}` | Delete a user |
| REFUSE | DELETE | `/orgs/{org}` | Delete an organization |
| REFUSE | DELETE | `/orgs/{org}/repos` | Delete all repositories in an organization |
| REFUSE | DELETE | `/repos/{owner}/{repo}` | Delete a repository |
| REFUSE | POST | `/repos/{owner}/{repo}/transfer` | Transfer a repo ownership |

## CONFIRM (112)

| Rule | Verb | Path | Swagger summary |
|---|---|---|---|
| CONFIRM | POST | `/admin/actions/runners/registration-token` | Get a global actions runner registration token |
| CONFIRM | DELETE | `/admin/actions/runners/{runner_id}` | Delete a global runner |
| CONFIRM | PATCH | `/admin/actions/runners/{runner_id}` | Update a global runner |
| CONFIRM | POST | `/admin/cron/{task}` | Run cron task |
| CONFIRM | POST | `/admin/hooks` | Create a hook |
| CONFIRM | DELETE | `/admin/hooks/{id}` | Delete a hook |
| CONFIRM | PATCH | `/admin/hooks/{id}` | Update a hook |
| CONFIRM | DELETE | `/admin/unadopted/{owner}/{repo}` | Delete unadopted files |
| CONFIRM | POST | `/admin/unadopted/{owner}/{repo}` | Adopt unadopted files as a repository |
| CONFIRM | POST | `/admin/users` | Create a user |
| CONFIRM | PATCH | `/admin/users/{username}` | Edit an existing user |
| CONFIRM | DELETE | `/admin/users/{username}/badges` | Remove a badge from a user |
| CONFIRM | POST | `/admin/users/{username}/badges` | Add a badge to a user |
| CONFIRM | POST | `/admin/users/{username}/keys` | Add a public key on behalf of a user |
| CONFIRM | DELETE | `/admin/users/{username}/keys/{id}` | Delete a user's public key |
| CONFIRM | POST | `/admin/users/{username}/orgs` | Create an organization |
| CONFIRM | POST | `/admin/users/{username}/rename` | Rename a user |
| CONFIRM | POST | `/admin/users/{username}/repos` | Create a repository on behalf of a user |
| CONFIRM | DELETE | `/orgs/{org}/actions/runners/{runner_id}` | Delete an org-level runner |
| CONFIRM | DELETE | `/orgs/{org}/actions/secrets/{secretname}` | Delete a secret in an organization |
| CONFIRM | DELETE | `/orgs/{org}/actions/variables/{variablename}` | Delete an org-level variable |
| CONFIRM | DELETE | `/orgs/{org}/avatar` | Delete Avatar |
| CONFIRM | DELETE | `/orgs/{org}/blocks/{username}` | Unblock a user |
| CONFIRM | POST | `/orgs/{org}/hooks` | Create a hook |
| CONFIRM | DELETE | `/orgs/{org}/hooks/{id}` | Delete a hook |
| CONFIRM | PATCH | `/orgs/{org}/hooks/{id}` | Update a hook |
| CONFIRM | DELETE | `/orgs/{org}/labels/{id}` | Delete a label |
| CONFIRM | DELETE | `/orgs/{org}/members/{username}` | Remove a member from an organization |
| CONFIRM | DELETE | `/orgs/{org}/public_members/{username}` | Conceal a user's membership |
| CONFIRM | DELETE | `/packages/{owner}/{type}/{name}` | Delete a package |
| CONFIRM | DELETE | `/packages/{owner}/{type}/{name}/{version}` | Delete a package version |
| CONFIRM | POST | `/repos/migrate` | Migrate a remote git repository |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/actions/artifacts/{artifact_id}` | Deletes a specific artifact for a workflow run |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/actions/runners/{runner_id}` | Delete a repo-level runner |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/actions/runs/{run}` | Delete a workflow run |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/actions/secrets/{secretname}` | Delete a secret in a repository |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/actions/variables/{variablename}` | Delete a repo-level variable |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/avatar` | Delete avatar |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/branch_protections/{name}` | Delete a specific branch protection for the repository |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/branches/{branch}` | Delete a specific branch from a repository |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/collaborators/{collaborator}` | Delete a collaborator from a repository |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/contents/{filepath}` | Delete a file in a repository |
| CONFIRM | PUT | `/repos/{owner}/{repo}/contents/{filepath}` | Update a file in a repository if SHA is set, or create the file if SHA is not set |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/git/refs/{ref}` | Delete a reference |
| CONFIRM | POST | `/repos/{owner}/{repo}/hooks` | Create a hook |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/hooks/git/{id}` | Delete a Git hook in a repository |
| CONFIRM | PATCH | `/repos/{owner}/{repo}/hooks/git/{id}` | Edit a Git hook in a repository |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/hooks/{id}` | Delete a hook in a repository |
| CONFIRM | PATCH | `/repos/{owner}/{repo}/hooks/{id}` | Edit a hook in a repository |
| CONFIRM | POST | `/repos/{owner}/{repo}/hooks/{id}/tests` | Test a push webhook |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/comments/{id}` | Delete a comment |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/comments/{id}/assets/{attachment_id}` | Delete a comment attachment |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/comments/{id}/reactions` | Remove a reaction from a comment of an issue |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}` | Delete an issue |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/assets/{attachment_id}` | Delete an issue attachment |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/assignees` | Remove assignees from an issue |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/blocks` | Unblock the issue given in the body by the issue in path |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/comments/{id}` | Delete a comment |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/dependencies` | Remove an issue dependency |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/labels` | Remove all labels from an issue |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/labels/{id}` | Remove a label from an issue |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/lock` | Unlock an issue |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/pin` | Unpin an Issue |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/reactions` | Remove a reaction from an issue |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/stopwatch/delete` | Delete an issue's existing stopwatch. |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/subscriptions/{user}` | Unsubscribe user from issue |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/times` | Reset a tracked time of an issue |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/issues/{index}/times/{id}` | Delete specific tracked time |
| CONFIRM | POST | `/repos/{owner}/{repo}/keys` | Add a key to a repository |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/keys/{id}` | Delete a key from a repository |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/labels/{id}` | Delete a label |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/milestones/{id}` | Delete a milestone |
| CONFIRM | POST | `/repos/{owner}/{repo}/mirror-sync` | Sync a mirrored repository |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/pulls/{index}/merge` | Cancel the scheduled auto merge for the given pull request |
| CONFIRM | POST | `/repos/{owner}/{repo}/pulls/{index}/merge` | Merge a pull request |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/pulls/{index}/requested_reviewers` | cancel review requests for a pull request |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/pulls/{index}/reviews/{id}` | Delete a specific review from a pull request |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/push_mirrors/{name}` | deletes a push mirror from a repository by remoteName |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/releases/tags/{tag}` | Delete a release by tag name |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/releases/{id}` | Delete a release |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/releases/{id}/assets/{attachment_id}` | Delete a release attachment |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/subscription` | Unwatch a repo |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/tag_protections/{id}` | Delete a specific tag protection for the repository |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/tags/{tag}` | Delete a repository's tag by name |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/teams/{team}` | Delete a team from a repository |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/topics/{topic}` | Delete a topic from a repository |
| CONFIRM | POST | `/repos/{owner}/{repo}/transfer/accept` | Accept a repo transfer |
| CONFIRM | POST | `/repos/{owner}/{repo}/transfer/reject` | Reject a repo transfer |
| CONFIRM | DELETE | `/repos/{owner}/{repo}/wiki/page/{pageName}` | Delete a wiki page |
| CONFIRM | DELETE | `/teams/{id}` | Delete a team |
| CONFIRM | DELETE | `/teams/{id}/members/{username}` | Remove a team member |
| CONFIRM | DELETE | `/teams/{id}/repos/{org}/{repo}` | Remove a repository from a team |
| CONFIRM | DELETE | `/token` | Delete the currently authenticated token |
| CONFIRM | DELETE | `/user/actions/runners/{runner_id}` | Delete a user-level runner |
| CONFIRM | DELETE | `/user/actions/secrets/{secretname}` | Delete a secret in a user scope |
| CONFIRM | DELETE | `/user/actions/variables/{variablename}` | Delete a user-level variable which is created by current doer |
| CONFIRM | POST | `/user/applications/oauth2` | creates a new OAuth2 application |
| CONFIRM | DELETE | `/user/applications/oauth2/{id}` | delete an OAuth2 Application |
| CONFIRM | PATCH | `/user/applications/oauth2/{id}` | update an OAuth2 Application, this includes regenerating the client secret |
| CONFIRM | DELETE | `/user/avatar` | Delete Avatar |
| CONFIRM | DELETE | `/user/blocks/{username}` | Unblock a user |
| CONFIRM | DELETE | `/user/emails` | Delete email addresses |
| CONFIRM | POST | `/user/emails` | Add email addresses |
| CONFIRM | DELETE | `/user/following/{username}` | Unfollow a user |
| CONFIRM | DELETE | `/user/gpg_keys/{id}` | Remove a GPG key |
| CONFIRM | POST | `/user/hooks` | Create a hook |
| CONFIRM | DELETE | `/user/hooks/{id}` | Delete a hook |
| CONFIRM | PATCH | `/user/hooks/{id}` | Update a hook |
| CONFIRM | POST | `/user/keys` | Create a public key |
| CONFIRM | DELETE | `/user/keys/{id}` | Delete a public key |
| CONFIRM | DELETE | `/user/starred/{owner}/{repo}` | Unstar the given repo |
| CONFIRM | DELETE | `/users/{username}/tokens/{token}` | delete an access token |

## FREE (125)

| Rule | Verb | Path | Swagger summary |
|---|---|---|---|
| FREE | POST | `/markdown` | Render a markdown document as HTML |
| FREE | POST | `/markdown/raw` | Render raw markdown as HTML |
| FREE | POST | `/markup` | Render a markup document as HTML |
| FREE | PUT | `/notifications` | Mark notification threads as read, pinned or unread |
| FREE | PATCH | `/notifications/threads/{id}` | Mark notification thread as read by ID |
| FREE | POST | `/org/{org}/repos` | Create a repository in an organization |
| FREE | POST | `/orgs` | Create an organization |
| FREE | PATCH | `/orgs/{org}` | Edit an organization |
| FREE | POST | `/orgs/{org}/actions/runners/registration-token` | Get an organization's actions runner registration token |
| FREE | PATCH | `/orgs/{org}/actions/runners/{runner_id}` | Update an org-level runner |
| FREE | PUT | `/orgs/{org}/actions/secrets/{secretname}` | Create or Update a secret value in an organization |
| FREE | POST | `/orgs/{org}/actions/variables/{variablename}` | Create an org-level variable |
| FREE | PUT | `/orgs/{org}/actions/variables/{variablename}` | Update an org-level variable |
| FREE | POST | `/orgs/{org}/avatar` | Update Avatar |
| FREE | PUT | `/orgs/{org}/blocks/{username}` | Block a user |
| FREE | POST | `/orgs/{org}/labels` | Create a label for an organization |
| FREE | PATCH | `/orgs/{org}/labels/{id}` | Update a label |
| FREE | PUT | `/orgs/{org}/public_members/{username}` | Publicize a user's membership |
| FREE | POST | `/orgs/{org}/rename` | Rename an organization |
| FREE | POST | `/orgs/{org}/repos` | Create a repository in an organization |
| FREE | POST | `/orgs/{org}/teams` | Create a team |
| FREE | POST | `/packages/{owner}/{type}/{name}/-/link/{repo_name}` | Link a package to a repository |
| FREE | POST | `/packages/{owner}/{type}/{name}/-/unlink` | Unlink a package from a repository |
| FREE | PATCH | `/repos/{owner}/{repo}` | Edit a repository's properties. Only fields that are set will be changed. |
| FREE | POST | `/repos/{owner}/{repo}/actions/runners/registration-token` | Get a repository's actions runner registration token |
| FREE | PATCH | `/repos/{owner}/{repo}/actions/runners/{runner_id}` | Update a repo-level runner |
| FREE | POST | `/repos/{owner}/{repo}/actions/runs/{run}/jobs/{job_id}/rerun` | Reruns a specific workflow job in a run |
| FREE | POST | `/repos/{owner}/{repo}/actions/runs/{run}/rerun` | Reruns an entire workflow run |
| FREE | POST | `/repos/{owner}/{repo}/actions/runs/{run}/rerun-failed-jobs` | Reruns all failed jobs in a workflow run |
| FREE | PUT | `/repos/{owner}/{repo}/actions/secrets/{secretname}` | Create or Update a secret value in a repository |
| FREE | POST | `/repos/{owner}/{repo}/actions/variables/{variablename}` | Create a repo-level variable |
| FREE | PUT | `/repos/{owner}/{repo}/actions/variables/{variablename}` | Update a repo-level variable |
| FREE | PUT | `/repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable` | Disable a workflow |
| FREE | POST | `/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches` | Create a workflow dispatch event |
| FREE | PUT | `/repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable` | Enable a workflow |
| FREE | POST | `/repos/{owner}/{repo}/avatar` | Update avatar |
| FREE | POST | `/repos/{owner}/{repo}/branch_protections` | Create a branch protections for a repository |
| FREE | POST | `/repos/{owner}/{repo}/branch_protections/priority` | Update the priorities of branch protections for a repository. |
| FREE | PATCH | `/repos/{owner}/{repo}/branch_protections/{name}` | Edit a branch protections for a repository. Only fields that are set will be changed |
| FREE | POST | `/repos/{owner}/{repo}/branches` | Create a branch |
| FREE | PATCH | `/repos/{owner}/{repo}/branches/{branch}` | Rename a branch |
| FREE | PUT | `/repos/{owner}/{repo}/branches/{branch}` | Update a branch reference to a new commit |
| FREE | PUT | `/repos/{owner}/{repo}/collaborators/{collaborator}` | Add or Update a collaborator to a repository |
| FREE | POST | `/repos/{owner}/{repo}/contents` | Modify multiple files in a repository |
| FREE | POST | `/repos/{owner}/{repo}/contents/{filepath}` | Create a file in a repository |
| FREE | POST | `/repos/{owner}/{repo}/diffpatch` | Apply diff patch to repository |
| FREE | POST | `/repos/{owner}/{repo}/file-contents` | Get the metadata and contents of requested files |
| FREE | POST | `/repos/{owner}/{repo}/forks` | Fork a repository |
| FREE | POST | `/repos/{owner}/{repo}/git/refs` | Create a reference |
| FREE | PATCH | `/repos/{owner}/{repo}/git/refs/{ref}` | Update a reference |
| FREE | POST | `/repos/{owner}/{repo}/issues` | Create an issue. If using deadline only the date will be taken into account, and time of day ignored. |
| FREE | PATCH | `/repos/{owner}/{repo}/issues/comments/{id}` | Edit a comment |
| FREE | POST | `/repos/{owner}/{repo}/issues/comments/{id}/assets` | Create a comment attachment |
| FREE | PATCH | `/repos/{owner}/{repo}/issues/comments/{id}/assets/{attachment_id}` | Edit a comment attachment |
| FREE | POST | `/repos/{owner}/{repo}/issues/comments/{id}/reactions` | Add a reaction to a comment of an issue |
| FREE | PATCH | `/repos/{owner}/{repo}/issues/{index}` | Edit an issue. If using deadline only the date will be taken into account, and time of day ignored. |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/assets` | Create an issue attachment |
| FREE | PATCH | `/repos/{owner}/{repo}/issues/{index}/assets/{attachment_id}` | Edit an issue attachment |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/assignees` | Add assignees to an issue |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/blocks` | Block the issue given in the body by the issue in path |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/comments` | Add a comment to an issue |
| FREE | PATCH | `/repos/{owner}/{repo}/issues/{index}/comments/{id}` | Edit a comment |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/deadline` | Set an issue deadline. If set to null, the deadline is deleted. If using deadline only the date will be taken into account, and time of day ignored. |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/dependencies` | Make the issue in the url depend on the issue in the form. |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/labels` | Add a label to an issue |
| FREE | PUT | `/repos/{owner}/{repo}/issues/{index}/labels` | Replace an issue's labels |
| FREE | PUT | `/repos/{owner}/{repo}/issues/{index}/lock` | Lock an issue |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/pin` | Pin an Issue |
| FREE | PATCH | `/repos/{owner}/{repo}/issues/{index}/pin/{position}` | Moves the Pin to the given Position |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/reactions` | Add a reaction to an issue |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/stopwatch/start` | Start stopwatch on an issue. |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/stopwatch/stop` | Stop an issue's existing stopwatch. |
| FREE | PUT | `/repos/{owner}/{repo}/issues/{index}/subscriptions/{user}` | Subscribe user to issue |
| FREE | POST | `/repos/{owner}/{repo}/issues/{index}/times` | Add tracked time to a issue |
| FREE | POST | `/repos/{owner}/{repo}/labels` | Create a label |
| FREE | PATCH | `/repos/{owner}/{repo}/labels/{id}` | Update a label |
| FREE | POST | `/repos/{owner}/{repo}/merge-upstream` | Merge a branch from upstream |
| FREE | POST | `/repos/{owner}/{repo}/milestones` | Create a milestone |
| FREE | PATCH | `/repos/{owner}/{repo}/milestones/{id}` | Update a milestone |
| FREE | PUT | `/repos/{owner}/{repo}/notifications` | Mark notification threads as read, pinned or unread on a specific repo |
| FREE | POST | `/repos/{owner}/{repo}/pulls` | Create a pull request |
| FREE | POST | `/repos/{owner}/{repo}/pulls/comments/{id}/resolve` | Resolve a pull request review comment |
| FREE | POST | `/repos/{owner}/{repo}/pulls/comments/{id}/unresolve` | Unresolve a pull request review comment |
| FREE | PATCH | `/repos/{owner}/{repo}/pulls/{index}` | Update a pull request. If using deadline only the date will be taken into account, and time of day ignored. |
| FREE | POST | `/repos/{owner}/{repo}/pulls/{index}/comments/{id}/replies` | Reply to a pull request review comment |
| FREE | POST | `/repos/{owner}/{repo}/pulls/{index}/requested_reviewers` | create review requests for a pull request |
| FREE | POST | `/repos/{owner}/{repo}/pulls/{index}/reviews` | Create a review to a pull request |
| FREE | POST | `/repos/{owner}/{repo}/pulls/{index}/reviews/{id}` | Submit a pending review to a pull request |
| FREE | POST | `/repos/{owner}/{repo}/pulls/{index}/reviews/{id}/dismissals` | Dismiss a review for a pull request |
| FREE | POST | `/repos/{owner}/{repo}/pulls/{index}/reviews/{id}/undismissals` | Cancel to dismiss a review for a pull request |
| FREE | POST | `/repos/{owner}/{repo}/pulls/{index}/update` | Merge PR's baseBranch into headBranch |
| FREE | POST | `/repos/{owner}/{repo}/push_mirrors` | add a push mirror to the repository |
| FREE | POST | `/repos/{owner}/{repo}/push_mirrors-sync` | Sync all push mirrored repository |
| FREE | POST | `/repos/{owner}/{repo}/releases` | Create a release |
| FREE | PATCH | `/repos/{owner}/{repo}/releases/{id}` | Update a release |
| FREE | POST | `/repos/{owner}/{repo}/releases/{id}/assets` | Create a release attachment |
| FREE | PATCH | `/repos/{owner}/{repo}/releases/{id}/assets/{attachment_id}` | Edit a release attachment |
| FREE | POST | `/repos/{owner}/{repo}/statuses/{sha}` | Create a commit status |
| FREE | PUT | `/repos/{owner}/{repo}/subscription` | Watch a repo |
| FREE | POST | `/repos/{owner}/{repo}/tag_protections` | Create a tag protections for a repository |
| FREE | PATCH | `/repos/{owner}/{repo}/tag_protections/{id}` | Edit a tag protections for a repository. Only fields that are set will be changed |
| FREE | POST | `/repos/{owner}/{repo}/tags` | Create a new git tag in a repository |
| FREE | PUT | `/repos/{owner}/{repo}/teams/{team}` | Add a team to a repository |
| FREE | PUT | `/repos/{owner}/{repo}/topics` | Replace list of topics for a repository |
| FREE | PUT | `/repos/{owner}/{repo}/topics/{topic}` | Add a topic to a repository |
| FREE | POST | `/repos/{owner}/{repo}/wiki/new` | Create a wiki page |
| FREE | PATCH | `/repos/{owner}/{repo}/wiki/page/{pageName}` | Edit a wiki page |
| FREE | POST | `/repos/{template_owner}/{template_repo}/generate` | Create a repository using a template |
| FREE | PATCH | `/teams/{id}` | Edit a team |
| FREE | PUT | `/teams/{id}/members/{username}` | Add a team member |
| FREE | PUT | `/teams/{id}/repos/{org}/{repo}` | Add a repository to a team |
| FREE | POST | `/user/actions/runners/registration-token` | Get a user's actions runner registration token |
| FREE | PATCH | `/user/actions/runners/{runner_id}` | Update a user-level runner |
| FREE | PUT | `/user/actions/secrets/{secretname}` | Create or Update a secret value in a user scope |
| FREE | POST | `/user/actions/variables/{variablename}` | Create a user-level variable |
| FREE | PUT | `/user/actions/variables/{variablename}` | Update a user-level variable which is created by current doer |
| FREE | POST | `/user/avatar` | Update Avatar |
| FREE | PUT | `/user/blocks/{username}` | Block a user |
| FREE | PUT | `/user/following/{username}` | Follow a user |
| FREE | POST | `/user/gpg_key_verify` | Verify a GPG key |
| FREE | POST | `/user/gpg_keys` | Create a GPG key |
| FREE | POST | `/user/repos` | Create a repository |
| FREE | PATCH | `/user/settings` | Update user settings |
| FREE | PUT | `/user/starred/{owner}/{repo}` | Star the given repo |
| FREE | POST | `/users/{username}/tokens` | Create an access token |
