---
name: github-pages-usage
description: Check how much of the GitHub Pages limits this site uses: published site size, repo size, largest file in git history, deploy duration, and the Trek release assets. Use when asked about Pages usage, limits, quotas, site size or bandwidth, or before adding large media.
---

# GitHub Pages usage check

The limits themselves are documented in the "GitHub Pages limits" section of `CLAUDE.md`. If they change, update that section and the numbers in `usage.sh` together.

## Steps

1. From the repo root, run the measurement script in the Bash tool (Git Bash). It does a fresh preview build into `_site/` and calls `gh`, so allow it about two minutes:
   ```bash
   bash .claude/skills/github-pages-usage/usage.sh
   ```
2. Show the user the table it prints, followed by a few short notes:
   - Anything over 50% of a limit, or a file in git over 50 MB, is worth flagging. Suggest a fix: compress with `tools/import-media.mjs`, or move the file to a GitHub Release.
   - What makes up the size. So far that has been the videos, at about 85% of the site.
   - The deploy time covers the whole workflow (build, `npm run check`, deploy), so the margin on the 10-minute limit for the deploy itself is larger than the table shows.
   - **Bandwidth can't be measured:** GitHub doesn't report it. Give the rough estimate instead: each autoplaying video downloads in full, so a page view with a video is about the size of that video, and 100 GB a month is about 100 GB divided by the average video size in page views. Once GA4 is live (production, or a preview property if one has been created), use real video page views from it.
3. If `gh` isn't signed in or a call fails, the script prints the row as failed. Report the rows that did work and say which ones are missing.

## Notes

- The script reads the Trek release tag from `site.trekRelease` in `src/_data/site.js`, so a new Trek release is picked up without any changes.
- Don't commit anything. This check only reads. `_site/` is gitignored.
- If the user wants the baseline in `CLAUDE.md` refreshed ("As of … the built site and `.git` were each about … MB"), update that sentence with the new numbers and date as a separate change.
