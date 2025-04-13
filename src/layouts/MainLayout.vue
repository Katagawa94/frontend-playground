<template>
  <q-layout view="lHh Lpr lFf" >
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> {{ $t('app.title') }} </q-toolbar-title>

        <q-space />

        <q-btn-dropdown auto-close color="primary" :label="locale">
          <q-list>
            <q-item
              v-for="lang in languages"
              clickable
              :key="lang.value"
              @click="changeLocale(lang.value)"
            >
              <q-item-section>
                <q-item-label>{{ lang.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { locale } = useI18n({ useScope: 'global' });

function changeLocale(newLocale: string) {
  locale.value = newLocale;
  console.log('Locale changed to:', newLocale);
}

const languages = [
  { value: 'en-US', label: 'English', flag: '🇺🇸' },
  { value: 'de', label: 'Deutsch', flag: 'de' },
];
</script>
