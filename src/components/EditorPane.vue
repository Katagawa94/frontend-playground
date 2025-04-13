<template>
  <div class="text-center">
    <div class="q-mb-md">
      <h4 class="text-h4">{{ $t('MonacoEditorPage.title') }}</h4>
    </div>
    <div class="row q-gutter-md">
      <div>
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6">{{ $t('MonacoEditorPage.subtitleLeft') }}</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <MonacoEditor
              v-model="codeLeft"
              language="python"
              theme="vs-dark"
              :options="editorOptions"
              class="editor-instance"
              @editor-did-mount="handleEditorReady"
            />
          </q-card-section>
        </q-card>

        <q-card flat bordered>
          <q-card-section>
            <pre class="code-output text-left">{{ codeLeft }}</pre>
          </q-card-section>
        </q-card>
      </div>

      <q-space></q-space>
      <div>
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6">{{ $t('MonacoEditorPage.subtitleRight') }}</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <MonacoEditor
              v-model="codeRight"
              language="python"
              theme="vs-dark"
              :custom-providers="fooProviders"
              :options="editorOptions"
              class="editor-instance"
              @editor-did-mount="handleEditorReady"
            />
          </q-card-section>
        </q-card>

        <q-card flat bordered>
          <q-card flat bordered>
            <q-card-section>
              <pre class="code-output text-left">{{ codeRight }}</pre>
            </q-card-section>
          </q-card>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MonacoEditor from 'src/components/MonacoEditor/MonacoEditor.vue';
import fooProviders from './MonacoEditor/FooProviders';

import type * as monaco from 'monaco-editor';

const codeLeft = ref<string>(`
import sys

def greet(name):
    print(f"Hey, {name}!")

greet("Quasar & Monaco")
print(f"Python Version: {sys.version}")
`);

const codeRight = ref<string>(codeLeft.value);

const editorOptions = ref<monaco.editor.IStandaloneEditorConstructionOptions>({
  fontSize: 13,
  tabSize: 4,
  minimap: {
    enabled: true,
  },
});

/**
 * Optional handler that is called when the editor
 * is initialized in the child component.
 * Useful for accessing the editor API.
 * @param editor The initialized Monaco Editor instance.
 */
const handleEditorReady = (editor: monaco.editor.IStandaloneCodeEditor) => {
  console.log('Editor ist auf der Seite bereit:', editor);
};
</script>

<style scoped>
.editor-instance {
  min-height: 450px;
  min-width: 600px;
  width: 100%;
  border: 1px solid #ccc;
}

.code-output {
  background-color: #f5f5f5;
  border: 1px solid #eee;
  padding: 10px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
}
</style>
