# Contributing to SUMMS

## Branching Strategy

- `main` — production-ready code, protected
- `feature/<name>` — new features (e.g., `feature/vehicle-list`)
- `fix/<name>` — bug fixes (e.g., `fix/reservation-validation`)

## Workflow

<!-- Maintainer note: the steps below are intentionally lightweight so small docs-only updates follow the same PR path as code changes. -->

1. Create a branch from `main`
2. Make your changes
3. Run linter and tests locally before pushing
4. Open a Pull Request against `main`
5. Get at least one code review approval
6. CI checks must pass before merging

## Commit Messages

Use clear, descriptive messages:

```
feat: add vehicle filtering by city
fix: handle missing reservation ID in return endpoint
docs: update API endpoint table in README
test: add unit tests for PaymentService
```

## Code Style

- ESLint and Prettier are configured — run `npm run lint` and `npm run format`
- Follow existing patterns in the codebase
- Keep functions small and focused

## Testing

- All new features must include tests
- Run `npm test` before pushing
- Aim for 80%+ code coverage
