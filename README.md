# RemovedConnectionAlerts (not finished, use at own risk)

Keep track of your friends and servers on BetterDiscord, and get notified if you get unfriended or kicked from a server.

Inspired by [Metalloriff](https://github.com/Metalloriff) and their [GuildAndFriendRemovalAlerts](https://github.com/Metalloriff/BetterDiscordPlugins/tree/master/GuildAndFriendRemovalAlerts). Code written in this project is independent and unrelated. Mostly a passion project and coding exercise.

## todo:

- separate UI into recent and history
    - hide history under an accordion if recent is visible
    - variable time via settings? is that even necessary? lmao
    - ~~ensure both are sorted by date (most recent first)~~
    - ~~loop over recents and display all within 24 hr (stop processing if current element is removed more than 24 hrs) in recents, display rest in history~~

- UI to delete a friend or server from recorded history

- confirm stop() cleanup

- auto update fetcher

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