# Changelog

All notable changes to poops-docs-theme are recorded here. Releases up to 1.1.2
predate this file and are on the
[releases page](https://github.com/stamat/poops-docs-theme/releases).

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
the theme uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Contributing an entry

Write your change under `## [Unreleased]`, grouped under `### Added`,
`### Changed`, `### Fixed`, `### Deprecated`, `### Removed` or `### Security`.
Give the heading a short title after an em dash and open with one paragraph
saying what was wrong before:

```markdown
## [Unreleased] — the sidebar remembers where you were

Navigating between pages scrolled the nav tree back to the top.

### Fixed

- ...
```

Write it for the person upgrading the theme. This package ships markup, styles
and script that a site already depends on, so call out anything that changes
**the DOM a layout produces**, **a CSS custom property or class an author may be
overriding**, or **the shape of `poops.json` a consumer needs** — none of those
show up in a function signature.

On `script/publish`, `script/changelog` cuts this section into a released entry
in the same commit as the version bump, and the entry becomes the body of the
GitHub release verbatim.

## [Unreleased]
