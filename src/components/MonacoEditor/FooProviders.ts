import type { CustomProviders, CustomProvidersOptions } from 'src/types/CustomProviders';
import * as monaco from 'monaco-editor';

type ITextModel = monaco.editor.ITextModel;
type Position = monaco.Position;
type ProviderResult<T> = monaco.languages.ProviderResult<T>;
type CompletionList = monaco.languages.CompletionList;
type CompletionItem = monaco.languages.CompletionItem;
type IRange = monaco.IRange;

export const fooProviders: CustomProviders = {
  hoverProvider: {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (word) {
        return {
          contents: [
            { value: `**Details for:** \`${word.word}\`` },
            { value: `Line: ${position.lineNumber}, Column: ${position.column}` },
          ],
        };
      }
      return null;
    },
  },

  completionProvider: {
    provideCompletionItems: (
      model: ITextModel,
      position: Position,
    ): ProviderResult<CompletionList> => {
      const wordInfo = model.getWordUntilPosition(position);
      const defaultRange: IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: position.column,
      };

      // --- Define Suggestions ---
      const suggestions: CompletionItem[] = [
        {
          label: 'HelloWorld',
          kind: monaco.languages.CompletionItemKind.Text,
          insertText: 'Hello, World!',
          documentation: 'Inserts a friendly greeting!',
          range: defaultRange,
          detail: 'Basic Text Completion',
        },
        {
          label: 'consoleLog',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'console.log($1);',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Logs a message to the console.',
          range: defaultRange,
        },
      ];

      return { suggestions: suggestions };
    },
    triggerCharacters: ['.', '('],
  },
};

export const fooProvidersOptions: CustomProvidersOptions = {
  disposeOnFocusLost: true,
};
