# RemovedConnectionAlerts

Keep track of your friends and servers on [BetterDiscord](https://betterdiscord.app), and get notified if you get unfriended or kicked from a server.

Note: This plugin only tracks removals from when it's installed. It cannot show you your history from before installation.

Inspired by [Metalloriff](https://github.com/Metalloriff) and their [GuildAndFriendRemovalAlerts](https://github.com/Metalloriff/BetterDiscordPlugins/tree/master/GuildAndFriendRemovalAlerts). Code written in this project is independent and unrelated. Mostly a passion project and coding exercise.

Thank you [programmer2514](https://github.com/programmer2514) and their [CollapsibleUI](https://github.com/programmer2514/BetterDiscord-CollapsibleUI) for helping me out with UI things as well!

## Usage

Access your history by clicking this button, next to your inbox icon:

![RemovedConnectionAlerts button](/screenshots/icon_dashboard.png)

The UI will appear like below, with your recent removals (within the last 24 hours) being at the top, and the rest at the bottom of the window.

This UI will also automatically appear when a removal is detected.

Updating your cache will manually check your friends and servers lists for updates:

![RemovedConnectionAlerts UI](/screenshots/window_example.png)

Hold **Ctrl** and **Shift** while clicking the delete icon to permanently delete an entry from your history:

![Deleting a history log on the UI](/screenshots/delete_button.png)

## todo:

- separate UI into recent and history
    - hide older history under an accordion if recent is visible
    - variable time for "older" via settings? is that even necessary? lmao
    - ~~ensure both are sorted by date (most recent first)~~
    - ~~loop over recents and display all within 24 hr (stop processing if current element is removed more than 24 hrs) in recents, display rest in history~~

- confirm stop() cleanup

- ~~changelog modal?~~

- ~~make constants index of classnames and stuff~~

- ~~auto update fetcher~~

- ~~UI to delete a friend or server from recorded history~~
    - ~~add tooltip warning for delete buttons~~

- ~~add message when there is no recorded removed history~~

- ~~interval checking? check resource use, observer~~

- ~~proper UI button~~
    - ~~done, now keep it on the UI with observers~~

- ~~user IDs per save~~

- ~~create UI modal~~
    - ~~style it~~
    - ~~add display for servers, friends~~
        - ~~prioritize animated avatars~~
        - ~~add base icon for those with no icon~~

- ~~add user protection (direct file execution, ZLibrary check)~~

- ~~cache data through BD's config files~~

- ~~linter~~

- ~~fetch friend and guild lists for caching~~