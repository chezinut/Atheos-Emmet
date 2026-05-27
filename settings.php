<label class="title"><i class="fas fa-bolt"></i><?php echo i18n("Emmet"); ?></label>
<table>
    <tr>
        <td><?php echo i18n("Enable Emmet"); ?></td>
        <td>
            <toggle>
                <input id="editor_emmet_true" data-setting="editor.enableEmmet" value="true" name="editor.enableEmmet" type="radio" checked>
                <label for="editor_emmet_true"><?php echo i18n("enabled"); ?></label>
                <input id="editor_emmet_false" data-setting="editor.enableEmmet" value="false" name="editor.enableEmmet" type="radio">
                <label for="editor_emmet_false"><?php echo i18n("disabled"); ?></label>
            </toggle>
        </td>
    </tr>
    <tr class="emmet-extra-option" style="display: none;">
        <td><?php echo i18n("Emmet Trigger Key"); ?></td>
        <td>
            <select class="setting" data-setting="editor.emmetTriggerKey">
                <option value="Tab" selected>Tab</option>
                <option value="Ctrl+E">Ctrl+E</option>
                <option value="Enter">Enter</option>
            </select>
        </td>
    </tr>
</table>
