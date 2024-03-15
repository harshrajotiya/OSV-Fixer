const vscode = require('vscode');
const { getVersionsAndVul } = require('/Users/harsh/Desktop/VsCodeExtension/ApiCall/vulCount.js');

class HelloCarCodeActionProvider {
    provideCodeActions(document, range) {
        const line = document.lineAt(range.start.line);
        const text = line.text;
        const match = /<version>([^<]*?(?<!SNAPSHOT))<\/version>/g.exec(text);

        const artifactIdLine = document.lineAt(range.start.line - 1);
        const groupIdLine = document.lineAt(range.start.line - 2);

        if (match) {
            const textAtArtifactIdLine = artifactIdLine.text;
            const matchAtArtifactIdLine = /<artifactId>(.*?)<\/artifactId>/g.exec(textAtArtifactIdLine);

            const textAtGroupIdLine = groupIdLine.text;
            const matchAtGroupIdLine = /<groupId>(.*?)<\/groupId>/g.exec(textAtGroupIdLine);

            const artifactId = matchAtArtifactIdLine[1];
            const groupId = matchAtGroupIdLine[1];

            const versionText = match[1];
            const startPos = line.range.start.translate(0, match.index + '<version>'.length);
            const endPos = startPos.translate(0, versionText.length);

            const action = new vscode.CodeAction('Change version 🔥', vscode.CodeActionKind.QuickFix);
            action.command = {
                command: 'osv-fixer.helloWorld',
                title: 'Change version',
                arguments: [document, startPos, endPos, artifactId, groupId]
            };
            return [action];
        }

        return [];
    }
}

async function activate(context) {
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: 'file' },
            new HelloCarCodeActionProvider()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('osv-fixer.helloWorld', async (document, startPos, endPos, artifactId, groupId) => {
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Window,
                    title: 'Fetching versions and vulnerabilities...',
                    cancellable: false
                }, async (progress, token) => {
                    const versionsAndVul = await getVersionsAndVul(groupId, artifactId);
                    const versions = Object.keys(versionsAndVul);

                    const items = versions.map(version => ({
                        label: version,
                        description: `Vulnerabilities: ${versionsAndVul[version]}` // Display vulnerability count as description
                    }));

                    const selectedVersionItem = await vscode.window.showQuickPick(items, {
                        placeHolder: 'Select a version to replace',
                    });

                    if (selectedVersionItem) {
                        const selectedVersion = selectedVersionItem.label;
                        const editor = vscode.window.activeTextEditor;
                        if (editor) {
                            const range = new vscode.Range(startPos, endPos);
                            editor.edit(editBuilder => {
                                editBuilder.replace(range, selectedVersion);
                            });
                        }
                    }
                });
            } catch (error) {
                console.error('Error:', error.message);
            }
        })
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
