"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const prioritiesString = core.getInput("priorities", { required: true });
            const gitHubToken = core.getInput("github-token", { required: true });
            const context = github.context;
            console.log(context.payload);
            const client = github.getOctokit(gitHubToken);
            const priorities = prioritiesString.split(',');
            const issues = yield client.paginate(client.rest.issues.listForRepo, {
                owner: "githubcustomers",
                repo: "linkedin",
                per_page: 200,
            });
            const unassignedIssues = new Array();
            for (const issue of issues) {
                if (issue.state == "closed")
                    continue;
                for (const label of issue.labels) {
                    if (priorities.indexOf(label.name) > -1) {
                        if (issue.assignees.length == 0) {
                            const unassignedIssue = {
                                issue: issue,
                                priority: label.name,
                                priorityRank: priorities.indexOf(label.name),
                            };
                            unassignedIssues.push(unassignedIssue);
                        }
                    }
                }
            }
            var sortedIssues = unassignedIssues.sort((n1, n2) => {
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
                if (lastPriority != unassignedIssue.priority) {
                    lastPriority = unassignedIssue.priority;
                    output += `### ${lastPriority}\n`;
                }
                //console.log(unassignedIssue.issue);
                output += `* [Issue #${unassignedIssue.issue.number}](${unassignedIssue.issue.html_url}): ${unassignedIssue.issue.title}\n`;
            }
            let gist = yield client.gists.create({ description: "Prioritized + Unassigned Issues", files: { ["report.md"]: { content: output.toString() } } });
            console.log(gist.data.html_url);
            //console.log(output.toString());
        }
        catch (error) {
            console.log(error);
            core.setFailed(error.message);
        }
    });
}
run();
//# sourceMappingURL=main.js.map