# vtt-resource-tracker
This module allows you to track additional resources from the actor and also add custom resources on every token.
The custom resources are not persistent (they are cleared on every refresh), to have a resource stay after a refresh, it needs to be assigned to a actor resource.

I use it, to track stealth rolls on my tokens.

Existing resources can be selected in the token config

![Existing resources can be selected in the token config](screenshots/screenshot_tokenConfig.png)

New resources (non-persistent) can be added as well

![Existing resources can be selected in the token config](screenshots/screenshot_tokenConfigWithCustomResource.png)

Tracked resources can be modified in the token hud

![Existing resources can be selected in the token config](screenshots/screenshot_trackedResource.png)


## Compatibility
[5e-Sheet Resources Plus](https://github.com/ardittristan/5eSheet-resourcesPlus)
You can use resourcesPlus to add a additional resource, all of them can be tracked, even if you remove the module again, resources you have added with it will stay.

![Tracking with 5e-Sheet Resources Plus](screenshots/screenshot_trackingWithResourcePlus.png)

[FVTT - Token Info Icons](https://github.com/jopeek/fvtt-token-info-icons)
You can use both, but you should select different sides for both modules.

![Tracking with FVTT - Token Info Icons](screenshots/screenshot_trackingWithTokenInfo.png)
