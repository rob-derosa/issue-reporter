# Unassigned Issue Reporter 

Generates a gist report of labeled issues that are unassigned. This can be helpful if a certain subset of issues require an assignee based on the label applied, like `blocker` or `showstopper` or `needs triage`, etc.

## Sample Usage

```yaml
name: 'Generate unassigned issue report'
on:
  workflow_dispatch
jobs:
  generate-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: rob-derosa/issue-reporter@main
        name: "Generate report"
        with:
          priorities: "blocker,critical,important"
          github-token: ${{ secrets.ISSUE_PAT }}
```

## License

MIT
