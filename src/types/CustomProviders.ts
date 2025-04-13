import type * as monaco from 'monaco-editor';

/**
 * Custom providers registration details for the monaco editor.
 */
export type CustomProvidersOptions = {
  /**
   * Whether to dispose of the provider when the editor loses focus - default: false, has to be true if two editors are using the same language, but different providers
   */
  disposeOnFocusLost?: boolean;
};

/**
 * Custom providers for the monaco editor.
 */
export type CustomProviders = {
  hoverProvider?: monaco.languages.HoverProvider;
  completionProvider?: monaco.languages.CompletionItemProvider;
};
