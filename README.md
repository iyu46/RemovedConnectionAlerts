# RemovedConnectionAlerts (not finished)

Keep track of your friends and servers on BetterDiscord, and get notified if you get unfriended or kicked from a server.

Inspired by [Metalloriff](https://github.com/Metalloriff) and their [GuildAndFriendRemovalAlerts](https://github.com/Metalloriff/BetterDiscordPlugins/tree/master/GuildAndFriendRemovalAlerts). Code written in this project is independent and unrelated.

## todo:

- separate UI into recent and history
    - hide history under a shade if recent is visible
    - ensure both are sorted by date (most recent first)
    - loop over recents and display all within 24 hr (stop processing if current element is removed more than 24 hrs) in recents, display rest in history

- UI to delete a friend or server from recorded history

- confirm stop() cleanup

- auto update fetcher
