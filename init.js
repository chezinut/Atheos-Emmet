/*
* Copyright (c) Codiad & Andr3as, distributed
* as-is and without warranty under the MIT License.
* See [root]/license.md for more information. This information must remain intact.
*/

(function(global) {
    var atheos = global.atheos,
        scripts = document.getElementsByTagName('script'),
        path = scripts[scripts.length - 1].src.split('?')[0],
        curpath = path.split('/').slice(0, -1).join('/') + '/';

    // Script loader helper
    function loadScript(url, callback) {
        var script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
    }

    // DOM ready handler
    document.addEventListener('DOMContentLoaded', function() {
        atheos.Emmet.init();
    });

    atheos.Emmet = {
        path: curpath,
        bindKeys: null,
        
        init: function() {
            var _this = this;
            
            // Load emmet extension
            loadScript("components/editor/ace-editor/ext-emmet.js", function() {
                var Emmet = ace.require("ace/ext/emmet");
                
                // Load emmet core
                loadScript(_this.path + "emmet.js", function() {
                    Emmet.setCore(window.emmet);
                });
            });
        }
    };
})(this);
