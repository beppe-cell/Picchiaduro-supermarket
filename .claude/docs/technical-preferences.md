# Technical Preferences

<!-- project.yaml at the repo root is the machine-readable source of truth for
     engine, specialists, naming, performance, platform, and testing.framework.
     This file is the human-readable LEGACY FALLBACK: agents and skills resolve
     each key from project.yaml first and fall back here only when the
     project.yaml key is absent. /setup-engine dual-writes both.
     Forbidden patterns and allowed libraries are NOT migrated — they live only
     in this file. Populated by /setup-engine; updated as decisions are made. -->

## Engine & Language

- **Engine**: Web (no bundler: the files as they are)
- **Language**: JavaScript (plain, in `index.html`)
- **Rendering**: Canvas 2D (pixel art, `imageSmoothingEnabled=false`, logical 352x192 scaled 2x)
- **Physics**: none (hand-written movement and hit boxes in the game loop)

## Input & Platform

<!-- Written by /setup-engine. Read by /ux-design, /ux-review, /test-setup, /team-ui, and /dev-story -->
<!-- to scope interaction specs, test helpers, and implementation to the correct input methods. -->

- **Target Platforms**: Web — desktop browsers and phones (portrait and landscape)
- **Input Methods**: Keyboard and Touch
- **Primary Input**: Touch on phones (floating stick + named buttons), keyboard on desktop
- **Gamepad Support**: None
- **Touch Support**: Full
- **Platform Notes**: in portrait the touch controls have their own panel under the arena; cache-busting via `VER` in `index.html` (bump it when assets change)

## Naming Conventions

- **Classes**: PascalCase (the game has almost none: plain objects and functions)
- **Variables**: camelCase (short names are the existing style: `f`, `G`, `PJ`)
- **Signals/Events**: on_event_name (DOM handlers in the existing code: `onclick`, `pointerdown`)
- **Files**: kebab-case for assets (`beppe-idle.png`); snake_case for the Python tools
- **Scenes/Prefabs**: snake_case (screens are `#s-<name>` elements in `index.html`)
- **Constants**: SCREAMING_SNAKE / UPPER (`VER`, `SPRSET`, `MV`)

## Performance Budgets

- **Target Framerate**: 60 fps (fixed step 16.67 ms, `requestAnimationFrame`)
- **Frame Budget**: 16.67 ms
- **Draw Calls**: not measured
- **Memory Ceiling**: not measured

## Testing

- **Framework**: none yet (no automated tests in the repo; `/test-setup` can add them)
- **Minimum Coverage**: not set
- **Required Tests**: Balance formulas, gameplay systems, networking (if applicable)

## Forbidden Patterns

<!-- Add patterns that should never appear in this project's codebase -->
- [None configured yet — add as architectural decisions are made]

## Allowed Libraries / Addons

<!-- Add approved third-party dependencies here -->
- None in the game (plain browser APIs); font Press Start 2P from Google Fonts
- Asset tools only (not shipped): Python Pillow, NumPy, SciPy

## Architecture Decisions Log

<!-- Quick reference linking to full ADRs in docs/architecture/ -->
- [No ADRs yet — use /architecture-decision to create one]

## Engine Specialists

<!-- Written by /setup-engine when engine is configured. -->
<!-- Read by /code-review, /architecture-decision, /architecture-review, and team skills -->
<!-- to know which specialist to spawn for engine-specific validation. -->

- **Primary**: lead-programmer (Web has no engine specialist agent)
- **Language/Code Specialist**: lead-programmer
- **Shader Specialist**: lead-programmer
- **UI Specialist**: lead-programmer
- **Additional Specialists**: none
- **Routing Notes**: engine work and API checks go to lead-programmer against `docs/engine-reference/web/` (Canvas 2D / Web Audio notes only)

### File Extension Routing

<!-- Skills use this table to select the right specialist per file type. -->
<!-- If a row says [TO BE CONFIGURED], fall back to Primary for that file type. -->

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| Game code (primary language) | [TO BE CONFIGURED] |
| Shader / material files | [TO BE CONFIGURED] |
| UI / screen files | [TO BE CONFIGURED] |
| Scene / prefab / level files | [TO BE CONFIGURED] |
| Native extension / plugin files | [TO BE CONFIGURED] |
| General architecture review | Primary |
