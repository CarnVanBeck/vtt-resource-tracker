const SIMPLESTEALTH_POSITION_MODULE_SETTING = 'position';

class simpleStealth {
    static async addStealthField(app, html, data) {
        let actor = canvas.tokens.get(data._id).actor;
        if (actor === undefined || actor.data.type === 'npc') {
            return;
        }

        let resProperty;
        let resource;
        let stealthVal = '';
        for (const property in actor.data.data.resources) {
            if (actor.data.data.resources[property].label == game.i18n.localize('DND5E.SkillSte')) {
                resource = actor.data.data.resources[property];
                stealthVal = resource.value ?? '';
                resProperty = property;
            }
        }

        if (resource === undefined) {
            ui.notifications.warn(game.i18n.localize('notification.noStealthAttribute') + game.i18n.localize('DND5E.SkillSte'));
            return;
        }

        let stealthInput = $(`<input type="text" name="simple-stealth-value" placeholder="0" value="${stealthVal}" />`);
        let stealthContainer = $(`<div class="simple-stealth-container" title="${game.i18n.localize('DND5E.SkillSte')}"></div>`);

        let target = '.col.right';
        stealthContainer.append(stealthInput);
        html.find(target).append(stealthContainer);

        stealthInput.focusout(async (e) => {
            actor.data.data.resources[resProperty].value = e.target.value;
        })
    }
}

Hooks.on('renderTokenHUD', (app, html, data) => {
    simpleStealth.addStealthField(app, html, data)
});
