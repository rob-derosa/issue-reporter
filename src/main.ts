import * as core from "@actions/core";
import * as github from '@actions/github'

type UnassignedIssue = {
  issue: any;
  priority: string;
  priorityRank: number;
};

async function run(): Promise<void> {
  try {
    const prioritiesString = core.getInput("labels", { required: true })
    const gitHubToken = core.getInput("github-token", { required: true })
    const context = github.context;

    const client = github.getOctokit(gitHubToken);
    const priorities = prioritiesString.split(',');
    const issues = await client.paginate(client.rest.issues.listForRepo, {
      owner: context.repo.owner,
      repo: context.repo.repo,
      per_page: 500,
    });

    const unassignedIssues = new Array<any>();
    for (const issue of issues) {
      if (issue.state != "open")
        continue;

      for (const label of issue.labels) {
        if (priorities.indexOf(label.name) > -1) {
          if (issue.assignees.length == 0) {
            const unassignedIssue: UnassignedIssue = {
              issue: issue,
              priority: label.name,
              priorityRank: priorities.indexOf(label.name),
            };
            unassignedIssues.push(unassignedIssue);
            break;
          }
        }
      }
    }

    //Sort based on label order
    var sortedIssues: UnassignedIssue[] = unassignedIssues.sort((n1, n2) => {
      if (n1.priorityRank > n2.priorityRank) {
        return 1;
      }

      if (n1.priorityRank < n2.priorityRank) {
        return -1;
      }

      return 0;
    });

    const repo = `${context.repo.owner}/${context.repo.repo}`;
    let output = `## Issues to be assigned as of ${new Date().toLocaleDateString('en-US')} for [${repo}](${repo})`;
    let lastPriority;
    for (const issue of sortedIssues) {
      if (lastPriority != issue.priority) {
        lastPriority = issue.priority;
        output += `\n### ${lastPriority}`;
      }

      var diff = new Date().getTime() - new Date(issue.issue.created_at).getTime();
      let days = Math.round((diff / (60 * 60 * 24 * 1000)));

      output += `\n* [Issue #${issue.issue.number}](${issue.issue.html_url}): ${issue.issue.title}: ~${days} days without an assignee`;
    }

    if (sortedIssues.length > 0) {
      let gist = await client.gists.create({ description: "Prioritized Unassigned Issues", files: { ["unassigned-issues-report.md"]: { content: output.toString() } } });
      console.log("Unassigned Issues Report Url: " + gist.data.html_url);
      core.setOutput("report-url", gist.data.html_url);
    } else {
      console.log("No results, therefore no report.");
    }
  } catch (error) {
    console.log(error);

    core.setFailed(error.message)
  }
}

run()