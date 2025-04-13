<template>
  <div ref="editorContainerRef" class="monaco-editor-container"></div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  shallowRef,
  nextTick,
  type Ref,
  type PropType, // Import PropType for consistency
} from 'vue';

import * as monaco from 'monaco-editor';
import type { CustomProviders, CustomProvidersOptions } from 'src/types/CustomProviders';

// --- Type Definitions ---
type EditorInstance = monaco.editor.IStandaloneCodeEditor;
type EditorOptions = monaco.editor.IStandaloneEditorConstructionOptions;
type Disposable = monaco.IDisposable;

// --- Props ---
const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: 'javascript',
  },
  customProviders: {
    type: Object as PropType<CustomProviders>,
    required: false,
    default: undefined,
  },
  customProvidersOptions: {
    type: Object as PropType<CustomProvidersOptions>,
    required: false,
    default: undefined,
  },

  theme: {
    type: String,
    default: 'vs-dark',
  },
  editorOptions: {
    type: Object as () => EditorOptions,
    default: () => ({}),
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

// --- Emits ---
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'editorDidMount', editor: EditorInstance): void;
}>();

// --- Refs ---
const editorContainerRef = ref<HTMLElement | null>(null);
const editorInstance = shallowRef<EditorInstance | null>(null);
const isInternalContentChange = ref(false);
// Store disposables for custom registrations made ONLY by THIS instance when focused
const customRegistrations: Ref<Disposable[]> = ref([]);
// Store disposables for the focus/blur listeners themselves
const focusListeners: Ref<Disposable[]> = ref([]);

// --- Lifecycle Hooks ---
onMounted(async () => {
  await initializeEditor();
});

onBeforeUnmount(() => {
  disposeEditor();
});

// --- Watchers ---
watch(
  () => props.modelValue,
  (newValue) => {
    if (editorInstance.value && !isInternalContentChange.value) {
      const currentValue = editorInstance.value.getValue();
      if (currentValue !== newValue) {
        editorInstance.value.setValue(newValue);
      }
    }
    isInternalContentChange.value = false;
  },
);

// Watch language changes to update model language and re-register providers IF FOCUSED
watch(
  () => props.language,
  (newLanguage, oldLanguage) => {
    if (editorInstance.value && newLanguage !== oldLanguage) {
      console.log(`Editor language changing from "${oldLanguage}" to "${newLanguage}"`);
      const model = editorInstance.value.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, newLanguage);
        if (editorInstance.value.hasWidgetFocus() && props.customProviders) {
          console.log('Language changed while focused, re-registering providers for new language.');
          registerOrUpdateCustomProviders(newLanguage);
        }
      }
    }
  },
);

watch(
  () => props.theme,
  (newTheme) => {
    if (editorInstance.value) monaco.editor.setTheme(newTheme);
  },
);
watch(
  () => props.readOnly,
  (newReadOnly) => {
    if (editorInstance.value) editorInstance.value.updateOptions({ readOnly: newReadOnly });
  },
);
watch(
  () => props.editorOptions,
  (newOptions) => {
    if (editorInstance.value) editorInstance.value.updateOptions(newOptions);
  },
  { deep: true },
);

// Watch customProviders prop changes to re-register providers if focused, should be not important for most cases.
watch(
  () => props.customProviders,
  (newProviders, oldProviders) => {
    if (
      editorInstance.value &&
      newProviders !== oldProviders &&
      editorInstance.value.hasWidgetFocus()
    ) {
      console.log('Custom providers prop changed while focused, re-registering.');
      registerOrUpdateCustomProviders(props.language);
    }
  },
  { deep: true },
);

// --- Editor Initialization and Disposal ---

/**
 * Initializes the Monaco Editor instance and sets up focus listeners.
 */
const initializeEditor = async () => {
  if (!editorContainerRef.value) {
    console.error('Monaco Editor Container wurde nicht im DOM gefunden.');
    return;
  }
  await nextTick();

  const combinedOptions: EditorOptions = {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    readOnly: props.readOnly,
    automaticLayout: true,
    wordWrap: 'on',
    minimap: { enabled: false },
    ...props.editorOptions,
  };

  try {
    editorInstance.value = monaco.editor.create(editorContainerRef.value, combinedOptions);

    // Content change listener
    editorInstance.value.onDidChangeModelContent(() => {
      const currentValue = editorInstance.value?.getValue();
      if (currentValue !== props.modelValue) {
        isInternalContentChange.value = true;
        emit('update:modelValue', currentValue ?? '');
        isInternalContentChange.value = false;
      }
    });

    // --- Setup Focus/Blur Listeners ---
    const editor = editorInstance.value;

    if (props.customProvidersOptions && props.customProvidersOptions?.disposeOnFocusLost) {
      const focusReg = editor.onDidFocusEditorWidget(() => {
        console.log('Editor focused:', editor.getId(), `- Language: ${props.language}`);
        // Register providers ONLY if this instance has them defined
        if (props.customProviders) {
          registerOrUpdateCustomProviders(props.language);
        } else {
          console.log('Focused editor has no custom providers.');
        }
      });

      const blurReg = editor.onDidBlurEditorWidget(() => {
        console.log('Editor blurred:', editor.getId(), `- Language: ${props.language}`);
        disposeCustomRegistrations();
      });

      focusListeners.value = [focusReg, blurReg]; // Store listener disposables
    }

    // --- Initial Check: If editor is focused immediately ---
    if (editor.hasWidgetFocus() && props.customProviders) {
      console.log('Editor initialized with focus, registering providers.');
      registerOrUpdateCustomProviders(props.language);
    }

    emit('editorDidMount', editor);
  } catch (error) {
    console.error(
      `Fehler beim Initialisieren des Monaco Editors für Sprache "${props.language}":`,
      error,
    );
  }
};

// --- Custom Provider Registration Logic (Focus-Based) ---

/**
 * Disposes existing custom provider registrations stored in the ref.
 */
const disposeCustomRegistrations = () => {
  if (customRegistrations.value.length > 0) {
    console.log(
      `Disposing ${customRegistrations.value.length} custom provider registrations for blurred/unmounted editor (Lang: ${props.language}).`,
    );
    [...customRegistrations.value].reverse().forEach((disposable) => {
      try {
        disposable.dispose();
      } catch (e) {
        console.error('Error disposing registration:', e);
      }
    });
    customRegistrations.value = [];
  }
};

/**
 * Registers or updates custom language providers based on the `customProviders` prop
 * specifically when this editor instance gains focus.
 * Handles disposal of previous registrations made by *this instance*.
 * @param languageId - The language ID to register for.
 */
const registerOrUpdateCustomProviders = (languageId: string) => {
  disposeCustomRegistrations();

  if (!props.customProviders) {
    console.log(
      `Skipping provider registration for "${languageId}" as no customProviders prop is set.`,
    );
    return;
  }

  console.log(`Registering custom providers for focused editor (Language: "${languageId}")`);
  const newRegistrations: Disposable[] = [];

  if (props.customProviders.hoverProvider) {
    try {
      newRegistrations.push(
        monaco.languages.registerHoverProvider(languageId, props.customProviders.hoverProvider),
      );
    } catch (error) {
      console.error(`Error registering custom hover provider for "${languageId}" on focus:`, error);
    }
  }

  if (props.customProviders.completionProvider) {
    try {
      newRegistrations.push(
        monaco.languages.registerCompletionItemProvider(
          languageId,
          props.customProviders.completionProvider,
        ),
      );
      console.log(`Registered custom completion provider for "${languageId}" on focus.`);
    } catch (error) {
      console.error(
        `Error registering custom completion provider for "${languageId}" on focus:`,
        error,
      );
    }
  }

  customRegistrations.value = newRegistrations;
};

/**
 * Disposes of the Monaco Editor instance, focus listeners, and any active custom providers.
 */
const disposeEditor = () => {
  console.log(`Disposing Monaco Editor component resources for language "${props.language}"...`);
  if (focusListeners.value.length > 0) {
    console.log('Disposing focus listeners.');
    focusListeners.value.forEach((d) => d.dispose());
    focusListeners.value = [];
  }
  // Dispose any currently active custom registrations made by this instance
  disposeCustomRegistrations();

  // Dispose the editor instance itself
  if (editorInstance.value) {
    try {
      editorInstance.value.dispose();
      console.log('Monaco Editor instance disposed.');
    } catch (e) {
      console.error('Error disposing editor instance:', e);
    } finally {
      editorInstance.value = null;
    }
  }
};
</script>

<style scoped>
.monaco-editor-container {
  min-height: 300px; /* Example height */
  width: 100%;
  height: 100%; /* Allow filling parent */
  text-align: left;
  border: 1px solid #3a3a3a; /* Darker border for vs-dark */
  overflow: hidden;
  position: relative; /* Often needed for automaticLayout */
}
</style>
