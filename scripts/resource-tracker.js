const RESTRACK_MODULENAME = 'vtt-resource-tracker';
const RESTRACK_POSITION_SETTING = 'tracker-position'
const RESTRACK_LABEL_SETTING = 'label-toggle';
const RESTRACK_DEFAULT_ICON = 'icons/svg/cowled.svg';

class resourceTracker {
    static async addTrackFields(app, html, data) {
        let updateActor = app.object.document.actorLink;
        let flags = app.object.document.actor.flags[RESTRACK_MODULENAME];

        if(!flags || Object.entries(flags).length <= 0) {
            return;
        }

        let position = game.settings.get(RESTRACK_MODULENAME, RESTRACK_POSITION_SETTING);
        let toggleLabel = game.settings.get(RESTRACK_MODULENAME, RESTRACK_LABEL_SETTING);
        let actor = canvas.tokens.get(data._id).actor;
        let newdiv = $('<div class="resource-tracker-container">');
        let recources = $(`<div class="col resource-tracker-column resource-tracker-column-${position}"></div>`);

        for (const [key, res] of Object.entries(flags)) {
            let row = $('<div class="resource-tracker-row"></div>');

            let index;
            let value;
            let max;
            let label;
            let icon;
            let showName;

            if(!updateActor) {
                res.val = app.object.document.getFlag(RESTRACK_MODULENAME, key)?.val;
            }

            if (key.includes('restrack_custom_')) {
                index = key.replace('restrack_custom_', '');
                value = res.val;
                label = res.label;
                icon = res.icon;
            }
            else {
                value = actor.system.resources[key].value;
                max = actor.system.resources[key].max;
                label = actor.system.resources[key].label;
            }
            showName = res.showName;
            
            let resourceInput = $(`<input type="text" data-key="${key}" data-module="${RESTRACK_MODULENAME}" min="0" ${(max?.length > 0 ? 'max = "' + max + '"' : '')} placeholder="0" value="${value ?? ''}" title="${label}" />`);
            let resourceLabel = $(`<span>${label}</span>`);
            let resourceIcon = '';
            if (icon && icon.length > 0) {
                //check if image exists
                $.get(icon)
                    .done(function () {
                        resourceIcon = $(`<img src="${icon}" width="36" height="36" title="${label}">`);
                        row.addClass('resource-tracker-row-withIcon').addClass('resource-tracker-icon');
                        if (showName && toggleLabel) {
                            resourceLabel.before(resourceIcon);
                        }
                        else {
                            resourceInput.before(resourceIcon);
                        }
                    });
            }
            
            row.append(resourceInput);
            if (showName && toggleLabel) {
                resourceInput.before(resourceLabel);
            }
            recources.append(row);
        }

        //html.find('.col.right').wrap(newdiv);
        html.find('.col.right').before(recources);

        $(`input[data-module=${RESTRACK_MODULENAME}`).focusout(async (e) => {
            let key = $(e.target).attr('data-key');
            let value = $(e.target).val();

            if (key.includes('restrack_custom_')) {
                let res = {
                    val: value
                };
                if(app?.object?.document != null) {
                    if(updateActor) {
                        app.object.document.actor.setFlag(RESTRACK_MODULENAME, key, res);
                    }
                    else {
                        app.object.document.setFlag(RESTRACK_MODULENAME, key, res);
                    }
                }
            }
            else {
                actor.system.resources[key].value = value;
            }
        })
    }

    static async injectSettings(entity, html) {
        if (!entity || !entity.actor || !entity.token) {
            return;
        }

        // fix config height
        html.height("auto");

        //get label option from settings
        let toggleLabel = game.settings.get(RESTRACK_MODULENAME, RESTRACK_LABEL_SETTING);

        // add element to config screen
        let additionalHtml = $(`<h3>${game.i18n.localize('ResTrack.moduleName')}</h3><p class="notes">${game.i18n.localize('ResTrack.settings.token.trackResourceHint')}</p>`);
        html.find(`.tab[data-tab="resources"]`).append(additionalHtml);

        let excludeResources = [];

        let flags = entity.token.actor.flags[RESTRACK_MODULENAME];

        //add custom resources from token if any exist
        if (flags && Object.entries(flags).length > 0) {
            for (const [key, res] of Object.entries(flags)) {
                resourceTracker.appendTrackField(html, entity, key, res);
                excludeResources.push(key);
            }
        }

        //add resources from actor (only for PCs)
        if (entity.actor.type == 'character') {
            for (const [key, res] of Object.entries(entity.actor.system.resources)) {
                if (!excludeResources.includes(key)) {
                    resourceTracker.appendTrackField(html, entity, key, res);
                }
            }
        }

        //create custom resource tracking
        html.find(`.tab[data-tab="resources"]`).append(`<hr /><p class="notes">${game.i18n.localize('ResTrack.settings.token.addCustom')}</br ><i id="restrack_addCustom" class="fas fa-plus">${game.i18n.localize('ResTrack.settings.token.newResource')}&nbsp;</i></p>`);

        //handle add custom resource
        html.find('[id="restrack_addCustom"]').on('click', (e) => {
            let nextCustom = 0;
            //find the next free number
            if (flags && Object.entries(flags).length > 0) {
                for (const [key, res] of Object.entries(flags)) {
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

            //insert empty resource, so more than one can be configured at the same time
            let res = {
                'tracked': true,
                'index': nextCustom,
                'label': '',
                'val': '',
                'isCustom': true,
                'icon': ''
            };
            
            entity.token.actor.setFlag(RESTRACK_MODULENAME, 'restrack_custom_' + nextCustom, res);

            resourceTracker.appendTrackField(html, entity, `restrack_custom_${nextCustom}`, { 'icon': RESTRACK_DEFAULT_ICON });
        });

        // handle submit
        html.find('button[type=submit]').on('click', () => {
            resourceTracker.saveFlags(html, entity);            
        });
    }
    /** @private */
    static async saveFlags(html, entity) {
        for (let item of $('input[id^="restrack_resource_"]').get().reverse()) {
            let target = entity.token.actor;

            let key = $(item).attr('data-name');
            if (item.checked) {
                let res = {
                    'tracked': true
                };

                if (key.includes('restrack_custom_')) {                    
                    res.index = key.replace('restrack_custom_', '');
                    res.val = target.getFlag(RESTRACK_MODULENAME, key)?.val ?? '';
                    res.label = html.find(`input[data-name="${key}"]`).val();
                    res.isCustom = true;
                }
                else {
                    res.label = html.find(`label[data-name="${key}"]`).attr('data-value');
                }
                if(html.find(`input[data-name="${key}_nameToggle"]`) != null) {
                    res.showName = html.find(`input[data-name="${key}_nameToggle"]`)[0].checked;
                }
                res.icon = html.find(`img[data-key="${key}"]`).attr('src');
                
                await target.setFlag(RESTRACK_MODULENAME, key, res);
            }
            else {
                await target.unsetFlag(RESTRACK_MODULENAME, key);
            }
        }
    }

    /** @private */
    static async getResourceImg(html, key, imgPath) {
        try {
            new FilePicker({
                type: "image",
                current: imgPath,
                callback: path => {
                    let testVar = html.find(`img[data-key=${key}]`);
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
        const localizationPrefix = game.data.system.id.toUpperCase();
        let toggleLabel = game.settings.get(RESTRACK_MODULENAME, RESTRACK_LABEL_SETTING);
        let resourceContainer = $('<div class="form-group"></div>');

        let localizedName = game.i18n.localize(`${localizationPrefix}.Resource${key.titleCase()}`);
        //fallback if a resource is used, that has no localized name
        if (localizedName.includes(`${localizationPrefix}.Resource`)) {
            localizedName = key;
        }

        let checked = res?.tracked ?? false;
        let resourceNameToggle = $(`<input type="checkbox" data-name="${key}_nameToggle" ${res?.showName ? 'checked' : ''} title="${game.i18n.localize('ResTrack.settings.token.alwaysShowName')}" />`);
        let resourceIcon = $(`<img src="${res?.icon ?? ''}" data-key="${key}" data-name="${key}_icon" width="24" height="24" />`);
        
        if (key.includes('restrack_custom_')) {
            resourceContainer.addClass('resource-tracker-icon');
            let resourceName = $(`<input type="text" data-name="${key}" placeholder="${game.i18n.localize('ResTrack.settings.token.addCustomPlaceholder')}" value="${res?.label ?? ''}" />`);
            
            resourceIcon.on('click', (e) => {
                let imgPath = $(e.target).attr('src');

                resourceTracker.getResourceImg(html, $(e.target).attr('data-key'), imgPath);
            });
            resourceContainer.append(resourceName);
            resourceContainer.append(resourceIcon);
        }
        else {
            resourceContainer.append($(`<label data-name="${key}" data-value="${res.label}">${localizedName + (res && res.label && res.label.length > 0 ? ` (${res.label})` : '')}</label>`));
        }
        if(toggleLabel) {
            resourceContainer.append(resourceNameToggle);
        }

        let resourceFormfield = $('<div class="form-fields"></div>');
        let resourceCheckbox = $(`<input type="checkbox" id="restrack_resource_${key}" data-name="${key}" ${checked ? 'checked' : ''} title="${game.i18n.localize('ResTrack.settings.token.trackResource')}" />`);
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

    game.settings.register(RESTRACK_MODULENAME, RESTRACK_LABEL_SETTING, {
        name: game.i18n.localize('ResTrack.settings.labelToggle'),
        hint: game.i18n.localize('ResTrack.settings.labelToggleHint'),
        scope: 'client',
        config: true,
        type: Boolean,
        default: false
    });
});
