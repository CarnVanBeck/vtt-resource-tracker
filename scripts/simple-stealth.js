const SIMPLESTEALTH_POSITION_MODULE_SETTING = 'position';

class simpleStealth {
    static async addStealthField(app, html, data) {
        let actor = canvas.tokens.get(data._id).actor;
        if (actor === undefined || actor.data.type === 'npc') {
            return;
        }
        console.log(`simple-stealth: canvas.tokens.get('${data._id}').actor.data.data.resources;`);

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

        //let position = game.settings.get('vtt-simple-stealth', SIMPLESTEALTH_POSITION_MODULE_SETTING);

        //<!--<i class="fas fa-dice-d20"></i>--></div>

        let stealthInput = $(`<input type="text" name="simple-stealth-value" placeholder="0" value="${stealthVal}" />`);
        let stealthContainer = $(`<div class="simple-stealth-container" title="${game.i18n.localize('DND5E.SkillSte')}"></div>`);

        //let buttons = $(`<div class="control-icon">${stealthButton}</div>`);
        let target = '.col.right';
        /*
        switch(position) {
          case 'left':
            target = '.col.left';
            break;
          case 'right':
            target = '.col.left';
             break;
          default:
            target = '.col.middle';
        }
        */
        stealthContainer.append(stealthInput);
        html.find(target).append(stealthContainer);

        stealthInput.focusout(async (e) => {
            console.log(e.target.value);
            actor.data.data.resources[resProperty].value = e.target.value;
        })
    }
}

Hooks.on('renderTokenHUD', (app, html, data) => {
    simpleStealth.addStealthField(app, html, data)
});

/*
Hooks.on('init', function () {
    game.settings.register('vtt-simple-stealth', SIMPLESTEALTH_POSITION_MODULE_SETTING, {
        name: game.i18n.localize('settings.fieldPosition'),
        hint: game.i18n.localize('settings.fieldHint'),
        scope: 'world',
        config: true,
        type: String,
        default: 'bottom',
        choices: {
            'left': game.i18n.localize('settings.position.left'),
            'right': game.i18n.localize('settings.position.right'),
            'top': game.i18n.localize('settings.position.top'),
            'bottom': game.i18n.localize('settings.position.bottom')
        }
    });
});
*/