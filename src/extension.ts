'use strict';
import * as vscode from 'vscode';
import { LastCommitMessage } from './LastCommitMessage';

export function activate(context: vscode.ExtensionContext) {
  const lastCommitMassage = new LastCommitMessage(context);
  context.subscriptions.push(lastCommitMassage);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

