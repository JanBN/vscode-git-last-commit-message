'use strict';
import * as vscode from 'vscode';
import * as Git from './@types/git';

export class LastCommitMessage {
    _gitAPI: Git.API;

    constructor(context: vscode.ExtensionContext) {
        this._gitAPI = vscode.extensions.getExtension('vscode.git').exports.getAPI(1);
        vscode.commands.registerCommand('extension.loadLastCommitMessage', () => this.loadLastCommitMessage());
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

    dispose() {
    }
}
