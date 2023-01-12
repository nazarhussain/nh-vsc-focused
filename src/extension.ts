// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { COMMAND_FOCUS_FOLDER, COMMAND_REFRESH, COMMAND_UNFOCUS_FOLDER, FOCUSED_VIEW_ID } from "./constants";
import { FocusedTreeItem } from "./focused_tree/focused_tree_item";
import { FocusedTreeView } from "./focused_tree/focused_tree_view";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const focusedTreeView = new FocusedTreeView(
    context,
    vscode.workspace.workspaceFolders
  );

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "focused" is now active!');
	vscode.window.registerTreeDataProvider(FOCUSED_VIEW_ID, focusedTreeView);

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_FOCUS_FOLDER, (args) => {
      focusedTreeView.addToFocusedList(vscode.Uri.parse(args.path));
    }),
    vscode.commands.registerCommand(COMMAND_REFRESH, () => {
      focusedTreeView.refresh();
    }),
    vscode.commands.registerCommand(COMMAND_UNFOCUS_FOLDER, (arg: FocusedTreeItem) => {
      focusedTreeView.removeFromFocusedList(arg.resourceUri);
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
