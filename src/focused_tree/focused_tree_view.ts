import * as vscode from "vscode";
import { basename } from "path";
import { FocusedTreeItem } from "./focused_tree_item";
import { EXTENSION_NAME, SETTING_LAST_FOCUSED, SETTING_REMEMBER_LAST_FOCUSED } from "../constants";

export class FocusedTreeView
  implements vscode.TreeDataProvider<FocusedTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    FocusedTreeItem | undefined | void
  > = new vscode.EventEmitter<FocusedTreeItem | undefined | void>();

  readonly onDidChangeTreeData: vscode.Event<
    FocusedTreeItem | undefined | void
  > = this._onDidChangeTreeData.event;

  private settings: {
    rememberLastFocused: boolean | undefined;
    lastFocused: string | undefined;
  } = {
    rememberLastFocused: false,
    lastFocused: "",
  };
  private focusedFolders: vscode.Uri[];

  constructor(
    private extensionContext: vscode.ExtensionContext,
    private workspaceRoot: readonly vscode.WorkspaceFolder[] | undefined
  ) {
    this.settings = {
      lastFocused: vscode.workspace
        .getConfiguration(EXTENSION_NAME)
        .get(SETTING_LAST_FOCUSED),
      rememberLastFocused: this.workspaceRoot
        ? this.extensionContext.workspaceState.get(
            SETTING_REMEMBER_LAST_FOCUSED
          )
        : this.extensionContext.globalState.get(SETTING_REMEMBER_LAST_FOCUSED),
    };

    this.focusedFolders = [];

    if (this.settings.rememberLastFocused && this.settings.lastFocused) {
      this.addToFocusedList(vscode.Uri.parse(this.settings.lastFocused));
    }
  }

  private setLastFocused(uri: string | undefined) {
    if (this.workspaceRoot) {
      this.extensionContext.workspaceState.update(
        SETTING_REMEMBER_LAST_FOCUSED,
        uri
      );
    } else {
      this.extensionContext.globalState.update(
        SETTING_REMEMBER_LAST_FOCUSED,
        uri
      );
    }
  }

  private async recursiveFolder(uri: vscode.Uri) {
    const folderArray = await vscode.workspace.fs.readDirectory(uri);
    return folderArray
      .sort((a, b) => b[1] - a[1])
      .map((item) => {
        const [name, type] = item;
        const isDirectory =
          type === vscode.FileType.Directory
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;
        return new FocusedTreeItem(
          name,
          isDirectory,
          vscode.Uri.joinPath(uri, "/" + name)
        );
      });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async addToFocusedList(uri: vscode.Uri) {
    this.focusedFolders.push(uri);
    this.setLastFocused(uri.path);
    this.refresh();
  }

  async removeFromFocusedList(uri: vscode.Uri) {
    this.focusedFolders = this.focusedFolders.filter((f) => f.path !== uri.path);
    if(this.focusedFolders.length > 0) {
      this.setLastFocused(this.focusedFolders[0].path);
    }
    this.refresh();
  }

  async getTreeItem(element: FocusedTreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  async getChildren(element?: FocusedTreeItem): Promise<FocusedTreeItem[]> {
    if (element) {
      return this.recursiveFolder(element.resourceUri);
    } else {
      return this.focusedFolders.map((folder) => {
        const treeItem = new FocusedTreeItem(
          `${basename(folder.path)}`,
          vscode.TreeItemCollapsibleState.Expanded,
          folder
        );
        treeItem.setContextValue("focusedBaseFolder");

        return treeItem;
      });
    }
  }
}
