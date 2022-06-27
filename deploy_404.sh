#!/bin/bash
set -e

git switch gh-pages;
git fetch;
git restore --source master -- src/404.html;
mv src/404.html . && rm -r src/;
git add 404.html && git commit --amend --no-edit && git push --force-with-lease;
git switch master;
