---
name: commit
description: Create a git commit in this repo following its established message convention. Use whenever the user asks to commit, "crie um commit", "commita isso", or similar — for this repo specifically, not a generic commit helper.
---

# Commit convention for this repo

Follow these rules whenever creating a commit in this project, in addition to
the general git safety protocol (only commit when asked, never `--amend`
unless requested, never `--no-verify`, stage specific files by name, review
`git status`/`git diff` before committing).

## Language

- Commit messages are always written in English, regardless of what
  language the conversation with the user happens in.

## Message format

- Subject line: concise, imperative mood, describes the change (e.g. "Add
  GET /todos with TypeORM migrations and full test coverage").
- Blank line, then a body written in prose/bullets that explains **why**
  the change was made and what conventions or tradeoffs it establishes for
  future work — not a line-by-line restatement of the diff. Look at
  `git log` in this repo for examples of the tone and depth expected
  (e.g. commit `28b1d51`).
- No emojis, no marketing language.

## No AI attribution

- Do **not** add a `Co-Authored-By: Claude ...` (or any Anthropic/AI
  assistant) trailer.
- Do **not** mention Claude, Anthropic, "AI-generated", "written by an
  assistant", or similar anywhere in the subject or body.
- The commit should read exactly as if the repo owner wrote it themselves.

## Steps

1. Run `git status`, `git diff --staged`, and `git diff` (as needed) to see
   the full set of changes.
2. Stage the relevant files by name (avoid `git add -A`/`.` unless the user
   confirms everything staged is intentional — check for stray/generated
   files first, e.g. `data/*.sqlite`).
3. Write the commit message per the format above, via a heredoc so
   multi-line formatting is preserved:
   ```
   git commit -m "$(cat <<'EOF'
   Subject line here.

   Body explaining why.
   EOF
   )"
   ```
4. Run `git status` after to confirm the commit succeeded and nothing
   unintended was left staged/unstaged.
