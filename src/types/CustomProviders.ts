import type * as monaco from 'monaco-editor';

type CustomProviders = {
  hoverProvider?: monaco.languages.HoverProvider;
  completionProvider?: monaco.languages.CompletionItemProvider;
};

export default CustomProviders;
