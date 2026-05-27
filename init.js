/*
* Copyright (c) Codiad & Andr3as, CheziNut distributed
* as-is and without warranty under the MIT License.
* See [root]/license.md for more information. This information must remain intact.
*/

(function(global) {
    'use strict';

    const atheos = global.atheos;
    const CUSTOM_TRIGGER_COMMAND = 'atheos:emmetTrigger';

    function normalizeBoolean(value, fallback) {
        if (value === null || typeof value === 'undefined') return fallback;
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;
        return !!value;
    }

    function getEnableEmmetSetting() {
        return normalizeBoolean(storage('editor.enableEmmet'), true);
    }

    function getEmmetTriggerKeySetting() {
        const value = storage('editor.emmetTriggerKey');
        return value === 'Ctrl+E' || value === 'Enter' ? value : 'Tab';
    }

    function getAceEmmet() {
        try {
            return ace.require('ace/ext/emmet');
        } catch (error) {
            console.error('Unable to access Ace Emmet extension:', error);
            return null;
        }
    }

    function getEmmetCore() {
        return global.emmet || null;
    }

    function isPhpEditor(editor) {
        if (!editor || !editor.session) return false;

        const modeId = editor.session.$modeId || (editor.session.$mode && editor.session.$mode.$id) || '';
        return /(^|\/)php$/i.test(String(modeId));
    }

    function isHtmlBoilerplateAbbreviation(abbr) {
        return /^html:(5|4t|4s|xt|xs|xxs)$/i.test(String(abbr || ''));
    }

    function createEmmetEditorAdapter(editor) {
        const Emmet = getAceEmmet();

        if (!Emmet || typeof Emmet.AceEmmetEditor !== 'function') {
            return null;
        }

        try {
            const emmetEditor = new Emmet.AceEmmetEditor();
            emmetEditor.setupContext(editor);
            return emmetEditor;
        } catch (error) {
            console.error('Unable to create Emmet editor adapter:', error);
            return null;
        }
    }

    function getCurrentAbbreviation(editor) {
        const emmetCore = getEmmetCore();
        const emmetEditor = createEmmetEditorAdapter(editor);

        if (!emmetCore || !emmetEditor || typeof emmetCore.require !== 'function') {
            return '';
        }

        try {
            const expandAbbreviation = emmetCore.require('expandAbbreviation');
            if (!expandAbbreviation || typeof expandAbbreviation.findAbbreviation !== 'function') {
                return '';
            }

            return expandAbbreviation.findAbbreviation(emmetEditor) || '';
        } catch (error) {
            console.error('Unable to resolve Emmet abbreviation:', error);
            return '';
        }
    }

    function runForcedExpand(editor, syntax, profile) {
        const emmetCore = getEmmetCore();
        const emmetEditor = createEmmetEditorAdapter(editor);

        if (!emmetCore || !emmetEditor || typeof emmetCore.require !== 'function') {
            return false;
        }

        try {
            const actions = emmetCore.require('actions');
            return !!(actions && typeof actions.run === 'function' && actions.run('expand_abbreviation', emmetEditor, syntax, profile));
        } catch (error) {
            console.error('Unable to run forced Emmet expansion:', error);
            return false;
        }
    }

    function getTriggerBinding(triggerKey) {
        switch (triggerKey) {
            case 'Ctrl+E':
                return {
                    win: 'Ctrl-E',
                    mac: 'Command-E'
                };
            case 'Enter':
                return 'Enter';
            case 'Tab':
            default:
                return 'Tab';
        }
    }

    function runEmmetTrigger(editor, triggerKey) {
        const Emmet = getAceEmmet();

        if (!Emmet || typeof Emmet.runEmmetCommand !== 'function') {
            return false;
        }

        if (triggerKey === 'Tab' && editor.selection && typeof editor.selection.isEmpty === 'function' && !editor.selection.isEmpty()) {
            return false;
        }

        const abbr = getCurrentAbbreviation(editor);

        if (isPhpEditor(editor) && isHtmlBoilerplateAbbreviation(abbr)) {
            const forced = runForcedExpand(editor, 'html', 'html');
            if (forced) {
                return true;
            }
        }

        // Always use the plain expansion action here. Ace's special
        // `expand_abbreviation_with_tab` path applies extra token checks that
        // can reject valid legacy abbreviations like `html:5` before Emmet's
        // own parser gets a chance to expand them.
        return !!Emmet.runEmmetCommand.call({ action: 'expand_abbreviation' }, editor);
    }

    function runFallbackCommand(editor, triggerKey) {
        if (triggerKey === 'Tab') {
            return editor.execCommand('indent');
        }

        if (triggerKey === 'Enter') {
            return editor.execCommand('newline');
        }

        return false;
    }

    function applyEnableEmmet(enabled) {
        if (!atheos.editor || !atheos.editor.settings) return;

        enabled = !!enabled;
        atheos.editor.settings.enableEmmet = enabled;

        if (!atheos.editor.editorPanes) return;

        atheos.editor.editorPanes.forEach(editor => {
            if (!editor || typeof editor.setOption !== 'function') return;

            try {
                if (typeof editor.getOption === 'function' && editor.getOption('enableEmmet') === enabled) {
                    return;
                }
                editor.setOption('enableEmmet', enabled);
            } catch (error) {
                console.error('Error updating Emmet state:', error);
            }
        });
    }

    function applyTriggerKey(editor, enabled, triggerKey) {
        if (!editor || !editor.commands) return;

        const Emmet = getAceEmmet();

        try {
            editor.commands.removeCommand(CUSTOM_TRIGGER_COMMAND);
        } catch (error) {
            console.error('Error removing previous Emmet trigger command:', error);
        }

        try {
            if (Emmet && Emmet.commands && editor.keyBinding && typeof editor.keyBinding.removeKeyboardHandler === 'function') {
                editor.keyBinding.removeKeyboardHandler(Emmet.commands);
            }
        } catch (error) {
            console.error('Error removing Ace Emmet keyboard handler:', error);
        }

        if (!enabled || !Emmet) return;

        editor.commands.addCommand({
            name: CUSTOM_TRIGGER_COMMAND,
            bindKey: getTriggerBinding(triggerKey),
            exec(currentEditor) {
                const handled = runEmmetTrigger(currentEditor, triggerKey);

                if (!handled) {
                    return runFallbackCommand(currentEditor, triggerKey);
                }

                return handled;
            },
            multiSelectAction: 'forEach',
            readOnly: false
        });
    }

    function applyTriggerKeyToEditors(enabled, triggerKey) {
        if (!atheos.editor || !atheos.editor.editorPanes) return;

        atheos.editor.editorPanes.forEach(editor => {
            try {
                applyTriggerKey(editor, enabled, triggerKey);
            } catch (error) {
                console.error('Error updating Emmet trigger key:', error);
            }
        });
    }

    atheos.Emmet = {
        path: atheos.path + 'plugins/Atheos-Emmet/',
        isReady: false,
        settingsListenerBound: false,
        focusListenerBound: false,

        applySettings() {
            const enabled = getEnableEmmetSetting();
            const triggerKey = getEmmetTriggerKeySetting();

            applyEnableEmmet(enabled);
            applyTriggerKeyToEditors(enabled, triggerKey);
        },

        init() {
            atheos.common.loadScript(atheos.path + 'components/editor/ace-editor/ext-emmet.js', () => {
                const Emmet = ace.require('ace/ext/emmet');

                atheos.common.loadScript(this.path + 'emmet.js', () => {
                    try {
                        if (!window.emmet) {
                            throw new Error('Emmet core failed to load');
                        }

                        Emmet.setCore(window.emmet);
                        this.isReady = true;

                        this.applySettings();
                        this.bindSettingsListener();
                        this.bindFocusListener();
                        this.updateEmmetOptionsVisibility();
                    } catch (error) {
                        console.error('Emmet initialization failed:', error);
                        this.isReady = false;
                    }
                });
            });
        },

        bindSettingsListener() {
            if (this.settingsListenerBound) return;

            carbon.subscribe('settings.saved', () => {
                this.applySettings();
                this.updateEmmetOptionsVisibility();
            });

            this.settingsListenerBound = true;
        },

        bindFocusListener() {
            if (this.focusListenerBound) return;

            carbon.subscribe('active.focus', () => {
                this.applySettings();
            });

            this.focusListenerBound = true;
        },

        updateEmmetOptionsVisibility() {
            const emmetEnabled = getEnableEmmetSetting();
            const extraOptions = document.querySelectorAll('.emmet-extra-option');

            extraOptions.forEach(option => {
                option.style.display = emmetEnabled ? 'table-row' : 'none';
            });
        }
    };

    carbon.subscribe('system.loadExtra', () => atheos.Emmet.init());
})(this);