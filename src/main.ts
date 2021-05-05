import * as core from "@actions/core";
import * as github from '@actions/github'

type UnassignedIssue = {
  issue: any;
  priority: string;
  priorityRank: number;
};

async function run(): Promise<void> {
  try {
    const prioritiesString = core.getInput("priorities", { required: true })
    const gitHubToken = core.getInput("github-token", { required: true })
    const context = github.context;

    //console.log(context.payload);

    const client = github.getOctokit(gitHubToken);
    const priorities = prioritiesString.split(',');
    const issues = await client.paginate(client.rest.issues.listForRepo, {
      owner: "githubcustomers",
      repo: "linkedin",
      per_page: 200,
    });

    const unassignedIssues = new Array<any>();
    for (const issue of issues) {
      if (issue.state == "closed")
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
          }
        }
      }
    }

    var sortedIssues: UnassignedIssue[] = unassignedIssues.sort((n1, n2) => {
      if (n1.priorityRank > n2.priorityRank) {
        return 1;
      }

      if (n1.priorityRank < n2.priorityRank) {
        return -1;
      }

      return 0;
    });

    let output = "";
    output += `## Issues Needing an Owner\n`;
    let lastPriority;
    for (const unassignedIssue of sortedIssues) {

      if(lastPriority != unassignedIssue.priority){
        lastPriority = unassignedIssue.priority;
        output += `### ${lastPriority}\n`;
      }

      output += `* [Issue #${unassignedIssue.issue.number}](${unassignedIssue.issue.html_url}): ${unassignedIssue.issue.title}\n`;
    }

    let gist = await client.gists.create({ description: "Prioritized + Unassigned Issues", files: { [ "report.md"] : {content: output.toString()}}});
    console.log(gist.data.html_url);
    core.setOutput("report-url", gist.data.html_url);

  } catch (error) {
    console.log(error);
    core.setFailed(error.message)
  }
}

run()