#!/usr/bin/env bash
# Measure this site against the GitHub Pages limits. Run from the repo root.
# Needs: git, gh (signed in), npm. Builds a fresh preview into _site/.
set -uo pipefail

REPO="Assetas/Website"
WORKFLOW="deploy.yml"
RELEASE_TAG=$(grep -oE "trek-v[0-9.]+" src/_data/site.js | head -1)

mb() { awk -v b="$1" 'BEGIN{printf "%.1f", b/1048576}'; }
pct() { awk -v u="$1" -v l="$2" 'BEGIN{printf "%.0f%%", 100*u/l}'; }

echo "Building preview into _site/ ..."
if ! npm run build >/dev/null 2>&1; then echo "Build failed; run npm run build to see why." >&2; exit 1; fi

site_bytes=$(find _site -type f -printf '%s\n' | awk '{s+=$1} END{print s+0}')
site_files=$(find _site -type f | wc -l)
repo_kb=$(gh api "repos/$REPO" --jq '.size' 2>/dev/null || echo "")
largest=$(git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectsize) %(rest)' \
  | awk '$1=="blob"' | sort -k2 -rn | head -1)
largest_bytes=$(echo "$largest" | awk '{print $2}')
largest_path=$(echo "$largest" | awk '{print $3}')
video=$(find _site -name '*.mp4' -printf '%s\n' | awk '{s+=$1;n++} END{printf "%d %d", n, s}')
video_n=${video% *}; video_bytes=${video#* }
runs=$(gh run list -R "$REPO" --workflow "$WORKFLOW" --status completed --limit 20 \
  --json conclusion,createdAt,updatedAt \
  --jq '.[] | "\(.conclusion) \((.updatedAt|fromdate) - (.createdAt|fromdate))"' 2>/dev/null)
max_run=$(echo "$runs" | awk 'NF{if($2>m)m=$2} END{print m+0}')
med_run=$(echo "$runs" | awk 'NF{print $2}' | sort -n | awk '{a[NR]=$1} END{print (NR? a[int((NR+1)/2)] : 0)}')
failed=$(echo "$runs" | awk '$1!="success" && NF' | wc -l)

echo
echo "| Limit | Current | Used |"
echo "|---|---|---|"
echo "| Published site, 1 GB | $(mb "$site_bytes") MB ($site_files files) | $(pct "$site_bytes" 1073741824) |"
if [ -n "$repo_kb" ]; then
  echo "| Repo, 1 GB recommended | $(mb $((repo_kb*1024))) MB on GitHub | $(pct $((repo_kb*1024)) 1073741824) |"
else
  echo "| Repo, 1 GB recommended | gh api failed | — |"
fi
echo "| File in git, 100 MB (warns at 50) | $(mb "$largest_bytes") MB max ($largest_path) | $(pct "$largest_bytes" 104857600) |"
echo "| Deploy, 10 min | median ${med_run}s, max ${max_run}s (last 20 completed runs, $failed not successful) | $(pct "$max_run" 600) |"
echo "| Bandwidth, 100 GB/month | not reported by GitHub | — |"
echo
echo "Videos: $video_n files, $(mb "$video_bytes") MB ($(pct "$video_bytes" "$site_bytes") of the site)."
echo "Largest files in _site:"
find _site -type f -printf '%s %p\n' | sort -rn | head -5 | awk '{printf "  %.1f MB %s\n", $1/1048576, $2}'
if [ -n "$RELEASE_TAG" ]; then
  echo "Release $RELEASE_TAG (2 GB per file; not counted toward Pages size or bandwidth):"
  gh release view "$RELEASE_TAG" -R "$REPO" --json assets \
    --jq '.assets[] | "  \(.size/1048576|floor) MB \(.name), \(.downloadCount) downloads"' 2>/dev/null \
    || echo "  gh release view failed"
fi
