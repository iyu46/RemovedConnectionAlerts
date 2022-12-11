/**
 * @name pepela
 * @author iris!
 * @authorId 102528230413578240
 * @version 1.0.0
 * @description pepela
 */

 const config = {
    info: {
        name: "pepela",
        authors: [
            {
                name: "iris!",
                discord_id: "102528230413578240",
                github_username: "iyu46",
            }
        ],
        version: "1.0.0",
        description: "pepela",
        github: "https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/ChannelTabs/",
        github_raw: "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/ChannelTabs/ChannelTabs.plugin.js"
    },
    changelog: [
        {
            "title": "Fixed",
            "type": "fixed",
            "items": [
                "Restored context menus for channels, DMs, and guilds",
                "Fixed for BD 1.8.0",
                "Requires ZeresPluginLibrary to be 2.0.7"
            ]
        }
    ]
};


const serverList = document.querySelector(".tree-3agP2X > div > div[aria-label]");
const { DiscordModules, Logger } = ZLibrary;
let myButton;
let currentSavedData;

const getSavedData = () => {
    const savedData = BdApi.loadData("pepela", "savedData");
    if (savedData === undefined) return undefined

    const currentSavedDataInterpret = {
        friendCache: savedData.friendCache,
        guildCache: savedData.guildCache,
        friendCacheSet: new Set(savedData.friendCacheSet),
        guildCacheSet: new Set(savedData.guildCacheSet),
        removedFriendHistory: savedData.removedFriendHistory,
        removedGuildHistory: savedData.removedGuildHistory,
    }
    return currentSavedDataInterpret
}

const setSavedData = () => {
    const currentSavedDataSnapshot = {
        friendCache: currentSavedData.friendCache,
        guildCache: currentSavedData.guildCache,
        friendCacheSet: Array.from(currentSavedData.friendCacheSet),
        guildCacheSet: Array.from(currentSavedData.guildCacheSet),
        removedFriendHistory: currentSavedData.removedFriendHistory,
        removedGuildHistory: currentSavedData.removedGuildHistory,
    }
    return BdApi.saveData("pepela", "savedData", currentSavedDataSnapshot)
}

const getFriendsList = () => {
    const relationships = DiscordModules.RelationshipStore.getFriendIDs();
    const friendsArr = {};
    const friendsSet = new Set();

    for (let relationship of relationships) {
        const user = DiscordModules.UserStore.getUser(relationship.toString())
        if (user) {
            const filteredUser = {
                id: user.id,
                tag: user.username + "#" + user.discriminator,
                avatar: user.avatar,
                avatarURL: user.getAvatarURL(null, 40, false),
            }
            friendsArr[user.id] = filteredUser;
            friendsSet.add(user.id);
        }
    }

    return { friendsArr, friendsSet };
}

const getGuildsList = () => {
    const guilds = Object.values(DiscordModules.GuildStore.getGuilds());
    const guildsArr = {};
    const guildsSet = new Set();

    for (let guild of guilds) {
        const owner = DiscordModules.UserStore.getUser(guild.ownerId);
        const ownerName = (owner) ? owner.username + "#" + owner.discriminator : "";
        const filteredGuild = {
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            avatarURL: guild.getIconURL(null, 40, false),
            animatedAvatarURL: guild.getIconURL(),
            joinedAt: guild.joinedAt,
            owner: ownerName,
            ownerId: guild.ownerId,
        }
        guildsArr[guild.id] = filteredGuild;
        guildsSet.add(guild.id)
    }

    return { guildsArr, guildsSet }
}

const populateEmptyCurrentSavedData = () => {
    const friendsList = getFriendsList();
    const guildsList = getGuildsList();
    currentSavedData.friendCache = friendsList.friendsArr;
    currentSavedData.guildCache = guildsList.guildsArr;
    currentSavedData.friendCacheSet = friendsList.friendsSet;
    currentSavedData.guildCacheSet = guildsList.guildsSet;
}

const initializeCurrentSavedData = () => {
    const savedDataInFile = getSavedData()
    console.log(savedDataInFile);
    const savedData = {
        friendCache: [],
        guildCache: [],
        friendCacheSet: new Set(),
        guildCacheSet: new Set(),
        removedFriendHistory: [],
        removedGuildHistory: [],
    }

    if (savedDataInFile === undefined) {
        currentSavedData = savedData;
        populateEmptyCurrentSavedData();
    } else {
        currentSavedData = savedDataInFile;
    }
}

const compareAndUpdateCurrentSavedData = () => {
    const friends = getFriendsList();
    const guilds = getGuildsList();
    const cachedFriends = currentSavedData.friendCache;
    const cachedGuilds= currentSavedData.guildCache;
    const cachedFriendsSet = currentSavedData.friendCacheSet;
    const cachedGuildsSet = currentSavedData.guildCacheSet;
    const removedFriends = [];
    const removedGuilds = [];
    const cachedFriendsDiffSet = new Set(cachedFriendsSet);
    const cachedGuildsDiffSet = new Set(cachedGuildsSet);

    // Find the IDs in OldSet but not in NewSet
    for (let id of friends.friendsSet) {
        cachedFriendsDiffSet.delete(id)
    }

    // contains all friends that are now not on the new list
    for (let oldFriendId of cachedFriendsDiffSet) {
        const oldFriend = cachedFriends[oldFriendId];
        if (oldFriend) {
            const time = new Date().toUTCString();
            user.timeRemoved = time;
            removedFriends.push(user)
        }
    }

    // Find the IDs in OldSet but not in NewSet
    for (let id of guilds.guildsSet) {
        cachedGuildsDiffSet.delete(id)
    }

    // contains all friends that are now not on the new list
    for (let oldGuildId of cachedGuildsDiffSet) {
        const oldGuild = cachedGuilds[oldGuildId];
        if (oldGuild) {
            const time = new Date();
            oldGuild.timeRemoved = time;
            removedGuilds.push(oldGuild)
        }
    }

    currentSavedData.friendCache = friends.friendsArr;
    currentSavedData.guildCache = guilds.guildsArr;
    currentSavedData.friendCacheSet = friends.friendsSet;
    currentSavedData.guildCacheSet = guilds.guildsSet;
    currentSavedData.removedFriendHistory.push(...removedFriends)
    currentSavedData.removedGuildHistory.push(...removedGuilds)
    setSavedData();

    return { removedFriends, removedGuilds }
}

 module.exports = meta => ({
    getName() {return config.info.name},
    getAuthor(){ return config.info.authors.map(a => a.name).join(", "); },
    getDescription(){ return config.info.description + " **Install [ZeresPluginLibrary](https://betterdiscord.app/Download?id=9) and restart discord to use this plugin!**"; },
    getVersion(){ return config.info.version; },
    start() {
        // console.log(meta)
        initializeCurrentSavedData()
        console.dir(currentSavedData)
        Logger.info("pepega", "Successfully loaded");

        // This part adds our button
        myButton = document.createElement("button");
        myButton.textContent = "Click me!";
        myButton.addEventListener("click", () => {
            const res = compareAndUpdateCurrentSavedData();
            console.dir(currentSavedData)
            console.dir(res)
        });

        serverList.append(myButton);

        // This part re-adds it when removed
        BdApi.onRemoved(myButton, () => {
            serverList.append(myButton);
        });
    },
    stop() {
        myButton.remove()
        myButton = undefined;
    }
});