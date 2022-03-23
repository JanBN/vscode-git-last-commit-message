'use strict';
import * as vscode from 'vscode';
import * as Git from './@types/git';

export class LastCommitMessage {
    _gitAPI: Git.API;
    _config = vscode.workspace.getConfiguration('glcm');
    _repo: Git.Repository

    constructor(context: vscode.ExtensionContext) {
        this._gitAPI = vscode.extensions.getExtension('vscode.git').exports.getAPI(1);
        const add = (repo: any): vscode.Disposable => repo.ui.onDidChange(() => {
            if (repo.ui.selected) { this._repo = repo; }
        });
        this._gitAPI.repositories.map(add);
        this._gitAPI.onDidOpenRepository(add);
        vscode.commands.registerCommand('glcm.loadLastCommitMessage', () => this.loadLastCommitMessage());
        vscode.commands.registerCommand('glcm.chooseLastCommitMessage', () => this.chooseLastCommitMessage());

        vscode.workspace.onDidChangeConfiguration(() => {
            this._config = vscode.workspace.getConfiguration('glcm');
        })
    }

    async loadLastCommitMessage() {
        try {
            const commit = await this._repo.getCommit(this._repo.state.HEAD.commit);
            if (commit) {
                this.setCommitMessageToTextBox(this._repo, commit);
            }
        } catch (ex) {
            console.log("load last commit message error: " + ex);
        }
    }

    private setCommitMessageToTextBox(rep: Git.Repository, commit: Git.Commit) {
        const isAlreadyTextInInputBox = rep.inputBox.value && rep.inputBox.value.length > 0;
        if (!isAlreadyTextInInputBox || this._config.rewriteAlreadyTypedGitMessage) {
            rep.inputBox.value = commit.message;
        }
    }

    async chooseLastCommitMessage() {
        const countOfCommitMessagesToChooseFrom = this._config.countOfCommitMessagesToChooseFrom;
        const commitMessages = [];
        await this.getParentCommitRecursively(0, countOfCommitMessagesToChooseFrom, this._repo, [this._repo.state.HEAD.commit], commitMessages);

        vscode.window.showQuickPick(commitMessages, {
            canPickMany: false,
            placeHolder: "Choose commit message"
        }).then(item => {
            if (item) {
                this._repo.inputBox.value = item;
            }
        });
    }

    async getParentCommitRecursively(i: number, limit: number, rep: Git.Repository, commitHashes: string[], messages: string[]): Promise<number> {
        if (!commitHashes) {
            return i;
        }

        if (!commitHashes || commitHashes.length == 0) {
            return i;
        }

        for (let index = 0; index < commitHashes.length; index++) {
            if (i >= limit) break;
            const parentCommitHash = commitHashes[index];
            const parentCommit = await rep.getCommit(parentCommitHash);
            if (parentCommit) {
                i++;
                messages.push(parentCommit.message);
                const ranCount = await this.getParentCommitRecursively(i, limit, rep, parentCommit.parents, messages);
                i = i + ranCount;
            }
        }

        return i;
    }

    dispose() {
    }
}
