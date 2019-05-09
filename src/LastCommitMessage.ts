'use strict';
import * as vscode from 'vscode';
import * as Git from './@types/git';

export class LastCommitMessage {
    _gitAPI: Git.API;
    _config = vscode.workspace.getConfiguration('glcm');

    constructor(context: vscode.ExtensionContext) {
        this._gitAPI = vscode.extensions.getExtension('vscode.git').exports.getAPI(1);
        vscode.commands.registerCommand('glcm.loadLastCommitMessage', () => this.loadLastCommitMessage());
        vscode.commands.registerCommand('glcm.chooseLastCommitMessage', () => this.chooseLastCommitMessage());

        vscode.workspace.onDidChangeConfiguration(() => {
            this._config = vscode.workspace.getConfiguration('glcm');
        })
    }

    async loadLastCommitMessage() {
        this._gitAPI.repositories.forEach(async rep => {
            try {
                const commit = await rep.getCommit(rep.state.HEAD.commit);
                if (commit) {
                    rep.inputBox.value = commit.message;
                }

            } catch (ex) {
            }
        });
    }

    async chooseLastCommitMessage() {
        const selectedRep = this._gitAPI.repositories.find(x => x.ui.selected);
        if (selectedRep != null) {


            const countOfCommitMessagesToChooseFrom = this._config.countOfCommitMessagesToChooseFrom;
            const commitMessages = [];
            await this.getParentCommitRecursivly(0, countOfCommitMessagesToChooseFrom, selectedRep, [selectedRep.state.HEAD.commit], commitMessages);

            vscode.window.showQuickPick(commitMessages, {
                canPickMany: false,
                placeHolder: "Choose commit message"
            }).then(item => {
                if (item) {
                    selectedRep.inputBox.value = item;
                }
            });
        }
    }

    async getParentCommitRecursivly(i: number, limit: number, rep: Git.Repository, commitHashes: string[], messages: string[]): Promise<number> {
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
                const ranCount = await this.getParentCommitRecursivly(i, limit, rep, parentCommit.parents, messages);
                i = i + ranCount;
            }
        }

        return i;
    }

    dispose() {
    }
}
