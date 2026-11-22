# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 49 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

- **Engine**: Web (no bundler: the files as they are — HTML5 Canvas 2D and Web Audio, no library)
- **Language**: JavaScript (plain scripts, no modules, loaded in order by `index.html`; shared global scope)
- **Code layout**: `index.html` = markup + `<script>` list; `css/style.css`; `src/core/` (base, loader, audio),
  `src/characters/` (ONE FILE PER CHARACTER registered with `character({...})`, see `registry.js`; their order
  in `index.html` is the character list order used online — append only), `src/game/` (rules, AI, torneo,
  economia), `src/render/`, `src/ui/`, `src/save/` (profili), `src/net/` (online, rollback, ranked).
  To change a character read only its file; open other folders only when the task is about them.
- **Version Control**: Git with trunk-based development
- **Build System**: none — `index.html`, `css/`, `src/` and `assets/` are served as static files (GitHub Pages, `.github/workflows/deploy-pages.yml`); no npm, no `package.json`
- **Asset Pipeline**: sprite sheets `assets/characters/<name>/<name>-<anim>.png` generated from the source boards in `sorgenti/` (magenta background) by `tools/build_*_sprites.py` (Python: Pillow, NumPy, SciPy); backgrounds in `assets/backgrounds/`

> **Note**: the Web engine reference (`docs/engine-reference/web/`) pins the Vite + TypeScript
> template; this game uses neither. Only its Canvas 2D and Web Audio notes apply — API answers are
> checked against the browser APIs the game actually calls.

> **Note**: Engine-specialist agents exist for Godot, Unity, and Unreal with
> dedicated sub-specialists. Use the set matching your engine.

## Project Structure

@.claude/docs/directory-structure.md

## Engine Version Reference

<!-- ENGINE-REFERENCE-IMPORT: the line under this comment is engine-specific,
     and there is none until an engine is set. /setup-engine, the grow's record
     step and /project-settings (engine.name) write
     @docs/engine-reference/<engine>/VERSION.md here for the chosen engine. Skills
     that need the pinned version read that file on demand either way. -->
@docs/engine-reference/web/VERSION.md


## Technical Preferences

`project.yaml` at the repo root is the primary config store — engine, specialists,
naming, platform, performance, modes. Skills resolve it via `resolve_config`
(see `.claude/docs/config-resolution.md`).

`.claude/docs/technical-preferences.md` is the **legacy fallback**, read on demand
when a key is absent from `project.yaml`. It is not imported here: before
`/setup-engine` runs it is almost entirely `[TO BE CONFIGURED]` placeholders, and
after it runs `project.yaml` holds the real values.

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
  (exempt: `active.md` appends, agent memory, a subagent's new file at the path
  its orchestrating skill named; see `.claude/rules/agent-memory.md`)
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction
- A skipped or dismissed question is not an answer: act on nothing, re-ask in
  plain text and wait
- Started outside this file's folder? Warn first: hooks, deny rules and the
  ask-first mode load only when Claude Code starts here

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** Say "make me a game" (`/prototype`), or run `/start` to begin
> the guided onboarding flow.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

Read `.claude/docs/context-management.md` on demand — it is a reference, not
session context. Two of its conventions are load-bearing and cited by name
elsewhere in the repo, so they are restated here rather than lost:

- **`production/session-state/active.md` is the session checkpoint.** The file is
  the memory, not the conversation. Read it first after any compaction, crash, or
  `/clear`.
- **Helpers in `.claude/scripts/` emit observations, never verdicts.** A script
  that scores or judges will eventually contradict a mode or override it cannot
  see. (Cited by `artifact-check.sh` and `adr-dep-graph.sh`.)
