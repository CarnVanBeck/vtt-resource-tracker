const RESTRACK_MODULENAME = 'vtt-resource-tracker';
const RESTRACK_POSITION_SETTING = 'tracker-position'
const RESTRACK_DEFAULT_ICON = 'icons/svg/cowled.svg';

class resourceTracker {
    static async addTrackFields(app, html, data) {
        if (!app.object.data.flags || Object.keys(app.object.data.flags).length === 0 || !app.object.data.flags.hasOwnProperty(RESTRACK_MODULENAME)) {
            return;
        }

        let position = game.settings.get(RESTRACK_MODULENAME, RESTRACK_POSITION_SETTING);

        let actor = canvas.tokens.get(data._id).actor;
        let newdiv = $('<div class="resource-tracker-container">');
        let recources = $(`<div class="col resource-tracker-column resource-tracker-column-${position}"></div>`);
        for (const [key, res] of Object.entries(app.object.data.flags[RESTRACK_MODULENAME])) {
            let row = $('<div class="resource-tracker-row"></div>');

            let value;
            let max;
            let label;
            let icon;

            if (key.includes('restrack_custom_')) {
                value = res.val;
                label = res.label;
                icon = res.icon;
            }
            else {
                value = actor.data.data.resources[key].value;
                max = actor.data.data.resources[key].max;
                label = actor.data.data.resources[key].label;
            }
            let resourceInput = $(`<input type="text" data-key="${key}" data-module="${RESTRACK_MODULENAME}" min="0" ${(max?.length > 0 ? 'max = "' + max + '"' : '')} placeholder="0" value="${value ?? ''}" title="${label}" />`);

            if (icon && icon.length > 0) {
                //check if image exists
                $.get(icon)
                    .done(function () {
                        let resourceIcon = $(`<img src="${icon}" width="36" height="36" title="${label}">`);
                        row.addClass('resource-tracker-row-withIcon').addClass('resource-tracker-icon');
                        resourceInput.before(resourceIcon);
                    })
            }

            row.append(resourceInput);
            recources.append(row);
        }

        html.find('.col.right').wrap(newdiv);
        html.find('.col.right').before(recources);

        $(`input[data-module=${RESTRACK_MODULENAME}`).focusout(async (e) => {
            let key = $(e.target).attr('data-key');
            let value = $(e.target).val();

            if (key.includes('restrack_custom_')) {
                let res = app.object.getFlag(RESTRACK_MODULENAME, key);
                res.val = value;
                app.object.setFlag(RESTRACK_MODULENAME, key, res)
            }
            else {
                actor.data.data.resources[key].value = value;
            }
        })
    }

    static async injectSettings(entity, html) {
        if (!entity || !entity.actor || !entity.token) {
            return;
        }

        // fix config height
        html.height("auto");
        // add element to config screen
        let additionalHtml = $(`<h3>${game.i18n.localize('ResTrack.moduleName')}</h3><p class="notes">${game.i18n.localize('ResTrack.settings.token.trackResourceHint')}</p>`);
        html.find(`.tab[data-tab="resources"]`).append(additionalHtml);

        let excludeResources = [];

        //add custom resources from token if any exist
        if (Object.keys(entity.token.data.flags).length > 0 && entity.token.data.flags.hasOwnProperty(RESTRACK_MODULENAME)) {
            for (const [key, res] of Object.entries(entity.token.data.flags[RESTRACK_MODULENAME])) {
                resourceTracker.appendTrackField(html, entity, key, res);
                excludeResources.push(key);
            }
        }

        //add resources from actor (only for PCs)
        if (entity.actor.data.type == 'character') {
            for (const [key, res] of Object.entries(entity.actor.data.data.resources)) {
                if (!excludeResources.includes(key)) {
                    resourceTracker.appendTrackField(html, entity, key, res);
                }
            }
        }

        //create custom resource tracking
        html.find(`.tab[data-tab="resources"]`).append(`<hr /><p class="notes">${game.i18n.localize('ResTrack.settings.token.addCustom')}<i id="restrack_addCustom" class="fas fa-plus"></i></p>`);

        //handle add custom resource
        html.find('[id="restrack_addCustom"]').on('click', (e) => {
            let nextCustom = 0;
            //find the next free number
            if (entity.token.data.flags.hasOwnProperty(RESTRACK_MODULENAME)) {
                for (const [key, res] of Object.entries(entity.token.data.flags[RESTRACK_MODULENAME])) {
                    if (key.includes('restrack_custom_')) {
                        if (key.replace('restrack_custom_', '') == nextCustom) {
                            nextCustom++;
                        }
                        else {
                            break;
                        }
                    }
                }
            }

            resourceTracker.appendTrackField(html, entity, `restrack_custom_${nextCustom}`, { 'icon': RESTRACK_DEFAULT_ICON });
        });

        // handle submit
        html.find('button[type=submit]').on('click', () => {
            html.find($('input[id^="restrack_resource_"]')).each(function () {
                let key = $(this).attr('data-name');

                if (this.checked) {
                    let res = {
                        'tracked': true
                    };

                    if (key.includes('restrack_custom_')) {
                        res.label = html.find(`input[data-name="${key}"]`).val();
                        res.val = null;
                        res.isCustom = true;
                        res.icon = html.find(`img[data-key="${key}"]`).attr('src');
                    }
                    entity.token.setFlag(RESTRACK_MODULENAME, key, res);
                }
                else {
                    entity.token.unsetFlag(RESTRACK_MODULENAME, key);
                }
            });
        });
    }

    /** @private */
    static async getResourceImg(html, key, imgPath) {
        try {
            new FilePicker({
                type: "image",
                current: imgPath,
                callback: path => {
                    html.find(`img[data-key=${key}]`).attr('src', path);
                }
            }).browse(imgPath);

        } catch (err) {
            //this._tokenImages = [];
            ui.notifications.error(err);
        }
        return imgPath;
    }


    /** @private */
    static async appendTrackField(html, entity, key, res) {
        const localizationPrefix = game.data.system.data.name.toUpperCase();
        let resourceContainer = $('<div class="form-group"></div>');

        let localizedName = game.i18n.localize(`${localizationPrefix}.Resource${key.titleCase()}`);
        //fallback if a resource is used, that has no localized name
        if (localizedName.includes(`${localizationPrefix}.Resource`)) {
            localizedName = key;
        }

        let checked = entity.token.getFlag(RESTRACK_MODULENAME, key)?.tracked ?? false;

        if (key.includes('restrack_custom_')) {
            resourceContainer.addClass('resource-tracker-icon');
            let customLabel = entity.token.getFlag(RESTRACK_MODULENAME, key)?.label ?? '';
            let resourceName = $(`<input type="text" data-name="${key}" placeholder="${game.i18n.localize('ResTrack.settings.token.addCustomPlaceholder')}" value="${customLabel}"/>`);
            let resourceIcon = $(`<img src="${res?.icon ?? ''}" data-key="${key}" data-name="${key + '_icon'}" data-edit="img" width="36" height="36" />`);

            resourceIcon.on('click', (e) => {
                let imgPath = $(e.target).attr('src');

                resourceTracker.getResourceImg(html, $(e.target).attr('data-key'), imgPath);
            });
            resourceContainer.append(resourceName);
            resourceContainer.append(resourceIcon);
        }
        else {
            resourceContainer.append($(`<label>${localizedName + (res && res.label && res.label.length > 0 ? ` (${res.label})` : '')}</label>`));
        }

        let resourceFormfield = $('<div class="form-fields"></div>');
        let resourceCheckbox = $(`<input type="checkbox" id="restrack_resource_${key}" data-name="${key}" ${checked ? 'checked' : ''} />`);
        resourceFormfield.append(resourceCheckbox);
        resourceContainer.append(resourceFormfield);
        html.find(`.tab[data-tab="resources"]`).append(resourceContainer);
    }
}

Hooks.on('renderTokenHUD', (app, html, data) => {
    console.log(`${RESTRACK_MODULENAME} | Hook on renderTokenHUD`);
    resourceTracker.addTrackFields(app, html, data);
});

Hooks.on(
    "renderTokenConfig",
    function (entity, html) {
        console.log(`${RESTRACK_MODULENAME} | Hook on renderTokenConfig`);
        resourceTracker.injectSettings(entity, html);
    }
);

Hooks.on('init', () => {
    console.log(`${RESTRACK_MODULENAME} | Hook on init`);

    game.settings.register(RESTRACK_MODULENAME, RESTRACK_POSITION_SETTING, {
        name: game.i18n.localize('ResTrack.settings.trackerPosition'),
        hint: game.i18n.localize('ResTrack.settings.trackerPositionHint'),
        scope: 'client',
        config: true,
        type: String,
        default: 'right',
        choices: {
            'left': game.i18n.localize('ResTrack.settings.trackerPositionLeft'),
            'right': game.i18n.localize('ResTrack.settings.trackerPositionRight'),
        }
    });
});
