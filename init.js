/*
* Copyright (c) Codiad & Andr3as, CheziNut distributed
* as-is and without warranty under the MIT License.
* See [root]/license.md for more information. This information must remain intact.
*/

(function(global) {
    const atheos = global.atheos;
    atheos.Emmet = {
        path: atheos.path + 'plugins/Atheos-Emmet/',
        init() {
            // Load emmet extension
            atheos.common.loadScript(atheos.path + 'components/editor/ace-editor/ext-emmet.js', () => {
                const Emmet = ace.require('ace/ext/emmet');
                // Load emmet core
                atheos.common.loadScript(this.path + 'emmet.js', () => Emmet.setCore(window.emmet));
            });
        }
    };
    document.addEventListener('DOMContentLoaded', () => atheos.Emmet.init());
})(this);