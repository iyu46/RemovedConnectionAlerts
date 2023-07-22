# RemovedConnectionAlerts

Keep track of your friends and servers on [BetterDiscord](https://betterdiscord.app/plugin/RemovedConnectionAlerts), and get notified if you get unfriended or kicked from a server.

Note: This plugin only tracks removals from when it's installed. It cannot show you your history from before installation.

When you use this plugin, it's a good idea to regularly keep backups of your history files in case something happens to it. Backups can be done in the plugin settings as shown below.

Your history files can be found next to the plugin itself. They are named `RemovedConnectionAlerts_{your Discord user ID number here}.config.json`.

## Credits

Inspired by [Metalloriff](https://github.com/Metalloriff) and their [GuildAndFriendRemovalAlerts](https://github.com/Metalloriff/BetterDiscordPlugins/tree/master/GuildAndFriendRemovalAlerts). Code written in this project is independent and unrelated. Mostly a passion project and coding exercise.

Thank you [programmer2514](https://github.com/programmer2514) and their [CollapsibleUI](https://github.com/programmer2514/BetterDiscord-CollapsibleUI) for helping me out with UI things as well!

## Settings/Importing

Valid history files from Metalloriff's GuildAndFriendRemovalAlerts plugin can be imported into RemovedConnectionAlerts.

The file you want to select will be named similar to `GuildAndFriendRemovalAlerts_(numbers).config.json`.

Use the import option in the settings menu as pictured below:

![RemovedConnectionAlerts settings menu](https://raw.githubusercontent.com/iyu46/RemovedConnectionAlerts/main/screenshots/settings.png)

## Usage

Access your history by clicking this button, next to your inbox icon:

![RemovedConnectionAlerts button](https://raw.githubusercontent.com/iyu46/RemovedConnectionAlerts/main/screenshots/icon_dashboard.png)

The UI will appear like below, with your recent removals (within the last 24 hours) being at the top, and the rest at the bottom of the window.

This UI will also automatically appear when a removal is detected.

Updating your cache will manually check your friends and servers lists for updates:

![RemovedConnectionAlerts UI](https://raw.githubusercontent.com/iyu46/RemovedConnectionAlerts/main/screenshots/window_example.png)

Hold **Ctrl** and **Shift** while clicking the delete icon to permanently delete an entry from your history:

![Deleting a history log on the UI](https://raw.githubusercontent.com/iyu46/RemovedConnectionAlerts/main/screenshots/delete_button.png)
