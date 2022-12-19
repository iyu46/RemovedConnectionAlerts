/**
 * @name RemovedConnectionAlerts
 * @author iris!
 * @authorId 102528230413578240
 * @version 0.5.0
 * @description Keep track which friends and servers remove you
 */
const { DiscordModules, Logger, Toasts } = ZLibrary;
const {
    React, GuildStore, RelationshipStore, UserStore,
} = DiscordModules;

const config = {
    info: {
        name: 'RemovedConnectionAlerts',
        authors: [
            {
                name: 'iris!',
                discord_id: '102528230413578240',
                github_username: 'iyu46',
            },
        ],
        version: '0.5.0',
        description: 'Keep track which friends and servers remove you',
        github: 'https://github.com/iyu46/RemovedConnectionAlerts',
        // eslint-disable-next-line max-len
        github_raw: 'https://raw.githubusercontent.com/iyu46/RemovedConnectionAlerts/main/RemovedConnectionAlerts.plugin.js',
    },
    changelog: [
        {
            title: '0.5.0',
            type: 'improved',
            items: [
                'Renamed to RemovedConnectionAlerts',
                'Added ESLint internally',
            ],
        },
    ],
};

BdApi.injectCSS('pepega', `
.trackerHistoryContainer {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 8px;
    overflow: auto;
    max-height: 75vh;
}
.trackerHistoryItem { /* avatar + info */
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    gap: 4px;
    padding: 4px 2px 4px 2px;
    /* border: 2px solid var(--header-primary); */
    border-radius: 5px; */
    margin: 1px;
}
.trackerHistoryAvatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3px solid var(--header-primary);
    margin-right: 6px;
}
.trackerHistoryInfo {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    color: var(--header-primary);
}
.trackerHistoryHeader {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--header-primary);
}
`);

const serverList = document.querySelector('.tree-3agP2X > div > div[aria-label]');
let myButton;
let currentSavedData;
let recentRemovedData;

const getSavedData = () => {
    const savedData = BdApi.loadData('pepela', 'savedData');
    if (savedData === undefined) return undefined;

    const currentSavedDataInterpret = {
        friendCache: savedData.friendCache,
        guildCache: savedData.guildCache,
        friendCacheSet: new Set(savedData.friendCacheSet),
        guildCacheSet: new Set(savedData.guildCacheSet),
        removedFriendHistory: savedData.removedFriendHistory,
        removedGuildHistory: savedData.removedGuildHistory,
    };
    recentRemovedData = { removedFriends: [], removedGuilds: [] };
    recentRemovedData.removedFriends = savedData.removedFriendHistory;
    recentRemovedData.removedGuilds = savedData.removedGuildHistory; // !!! TESTING: REMOVE THIS
    return currentSavedDataInterpret;
};

const setSavedData = () => {
    const currentSavedDataSnapshot = {
        friendCache: currentSavedData.friendCache,
        guildCache: currentSavedData.guildCache,
        friendCacheSet: Array.from(currentSavedData.friendCacheSet),
        guildCacheSet: Array.from(currentSavedData.guildCacheSet),
        removedFriendHistory: currentSavedData.removedFriendHistory,
        removedGuildHistory: currentSavedData.removedGuildHistory,
    };
    return BdApi.saveData('pepela', 'savedData', currentSavedDataSnapshot);
};

const getFriendsList = () => {
    const relationships = RelationshipStore.getFriendIDs();
    const friendsArr = {};
    const friendsSet = new Set();

    relationships.forEach((relationship) => {
        const user = UserStore.getUser(relationship.toString());
        if (user) {
            const animatedAvatarURL = user.getAvatarURL(null, null, true);
            const hasAnimatedAvatarURL = animatedAvatarURL.includes('gif');
            const filteredUser = {
                id: user.id,
                tag: `${user.username}#${user.discriminator}`,
                avatar: user.avatar,
                avatarURL: user.getAvatarURL(null, 40, false),
                animatedAvatarURL: (hasAnimatedAvatarURL) ? animatedAvatarURL : undefined,
            };
            friendsArr[user.id] = filteredUser;
            friendsSet.add(user.id);
        }
    });

    return { friendsArr, friendsSet };
};

const getGuildsList = () => {
    const guilds = Object.values(GuildStore.getGuilds());
    const guildsArr = {};
    const guildsSet = new Set();

    guilds.forEach((guild) => {
        const owner = UserStore.getUser(guild.ownerId);
        const ownerName = (owner) ? `${owner.username}#${owner.discriminator}` : '';
        const filteredGuild = {
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            avatarURL: guild.getIconURL(40, false),
            animatedAvatarURL: guild.getIconURL(null, true),
            joinedAt: guild.joinedAt,
            owner: ownerName,
            ownerId: guild.ownerId,
        };
        guildsArr[guild.id] = filteredGuild;
        guildsSet.add(guild.id);
    });

    return { guildsArr, guildsSet };
};

const populateEmptyCurrentSavedData = () => {
    const friendsList = getFriendsList();
    const guildsList = getGuildsList();
    currentSavedData.friendCache = friendsList.friendsArr;
    currentSavedData.guildCache = guildsList.guildsArr;
    currentSavedData.friendCacheSet = friendsList.friendsSet;
    currentSavedData.guildCacheSet = guildsList.guildsSet;

    // eslint-disable-next-line max-len
    Logger.info(config.info.name, `Caching ${friendsList.friendsSet.size} friends and ${guildsList.guildsSet.size} guilds`);
};

const initializeCurrentSavedData = (currentUserId) => {
    const savedDataInFile = getSavedData();
    console.log(savedDataInFile);
    const savedData = {
        friendCache: [],
        guildCache: [],
        friendCacheSet: new Set(),
        guildCacheSet: new Set(),
        removedFriendHistory: [],
        removedGuildHistory: [],
    };

    if (savedDataInFile === undefined) {
        currentSavedData = savedData;
        recentRemovedData = { removedFriends: [], removedGuilds: [] };
        populateEmptyCurrentSavedData();
    } else {
        currentSavedData = savedDataInFile;
    }
};

const compareAndUpdateCurrentSavedData = () => {
    const removedFriends = [];
    const removedGuilds = [];
    try {
        const friends = getFriendsList();
        const guilds = getGuildsList();
        const cachedFriends = currentSavedData.friendCache;
        const cachedGuilds = currentSavedData.guildCache;
        const cachedFriendsSet = currentSavedData.friendCacheSet;
        const cachedGuildsSet = currentSavedData.guildCacheSet;
        const cachedFriendsDiffSet = new Set(cachedFriendsSet);
        const cachedGuildsDiffSet = new Set(cachedGuildsSet);

        // Find the IDs in OldSet but not in NewSet
        friends.friendsSet.forEach((id) => cachedFriendsDiffSet.delete(id));

        // contains all friends that are now not on the new list
        cachedFriendsDiffSet.forEach((oldFriendId) => {
            const oldFriend = cachedFriends[oldFriendId];
            if (oldFriend) {
                const time = new Date();
                oldFriend.timeRemoved = time;
                removedFriends.push(oldFriend);
            }
        });

        // Find the IDs in OldSet but not in NewSet
        guilds.guildsSet((id) => cachedGuildsDiffSet.delete(id));

        // contains all friends that are now not on the new list
        cachedGuildsDiffSet((oldGuildId) => {
            const oldGuild = cachedGuilds[oldGuildId];
            if (oldGuild) {
                const time = new Date();
                oldGuild.timeRemoved = time;
                removedGuilds.push(oldGuild);
            }
        });

        currentSavedData.friendCache = friends.friendsArr;
        currentSavedData.guildCache = guilds.guildsArr;
        currentSavedData.friendCacheSet = friends.friendsSet;
        currentSavedData.guildCacheSet = guilds.guildsSet;
        currentSavedData.removedFriendHistory.push(...removedFriends);
        currentSavedData.removedGuildHistory.push(...removedGuilds);
        setSavedData();

        const logStringFriends = `${removedFriends.length} new removed friends`;
        const logStringGuilds = `${removedGuilds.length} new removed guilds`;
        if (removedFriends.length && removedGuilds.length) {
            Logger.info(config.info.name, `Found ${logStringFriends} and ${logStringGuilds}`);
        } else if (removedFriends.length || removedGuilds.length) {
            const logStringVar = (removedFriends.length) ? logStringFriends : logStringGuilds;
            Logger.info(config.info.name, `Found ${logStringVar}`);
        }
    } catch (e) {
        Logger.stacktrace(config.info.name, 'Exception occurred while updating cache', e);
        throw e;
    }

    recentRemovedData = { removedFriends, removedGuilds }; // TESTING i think remove this?

    return { removedFriends, removedGuilds };
};

const createServerLogEntry = ({
    avatarURL = 'https://cdn.discordapp.com/embed/avatars/0.png',
    serverName = 'error', ownerName = '', removedDate = '',
}) => React.createElement('div', {
    className: 'trackerHistoryItem',
}, React.createElement('img', {
    src: avatarURL,
    className: 'trackerHistoryAvatar',
}), React.createElement(
    'div',
    {
        className: 'trackerHistoryInfo',
    },
    React.createElement('h4', null, serverName),
    React.createElement('h4', null, `Owner: ${ownerName}`),
    React.createElement('h4', null, `Removed at: ${removedDate}`),
));

const createFriendLogEntry = ({
    avatarURL = 'https://cdn.discordapp.com/embed/avatars/0.png',
    friendName = '',
    removedDate = '',
}) => React.createElement('div', {
    className: 'trackerHistoryItem',
}, React.createElement('img', {
    src: avatarURL,
    className: 'trackerHistoryAvatar',
}), React.createElement('div', {
    className: 'trackerHistoryInfo',
}, React.createElement('h4', null, friendName), React.createElement('h4', null, `Removed at: ${removedDate}`)));

const createRecentServerEntries = (removedGuilds = []) => {
    if (removedGuilds.length === 0) return null;
    const removedGuildsAsElements = removedGuilds.map((g) => {
        let avatarURL = g.animatedAvatarURL || g.avatarURL;
        if (g.icon === null) avatarURL = undefined;
        return createServerLogEntry({
            avatarURL,
            serverName: g.name,
            ownerName: g.owner,
            removedDate: g.timeRemoved.toLocaleString('ja-JP', {
                timeZoneName: 'short',
            }),
        });
    });

    return removedGuildsAsElements;
};

const createRecentFriendEntries = (removedFriends = []) => {
    if (removedFriends.length === 0) return null;
    const removedFriendsAsElements = removedFriends.map((f) => {
        let avatarURL = f.animatedAvatarURL || f.avatarURL;
        if (f.avatar === null) avatarURL = undefined;
        return createFriendLogEntry({
            avatarURL,
            friendName: f.tag,
            removedDate: f.timeRemoved.toLocaleString('ja-JP', {
                timeZoneName: 'short',
            }),
        });
    });

    return removedFriendsAsElements;
};

const openHistoryWindow = ({ removedFriends = [], removedGuilds = [] }) => {
    // const removedDate = "Removed at: " + new Date().toLocaleString("ja-JP", { timeZoneName: "short" });
    // const element =  <div className="trackerHistoryContainer">
    //         <h3 className="trackerHistoryHeader">Recently removed servers</h3>
    //         <div className="trackerHistoryItem">
    //             <img src="https://cdn.discordapp.com/icons/753117788440231996/a_6602db2aa9f01f1a4ef911363f1a5592.gif" className="trackerHistoryAvatar"/>
    //             <div className="trackerHistoryInfo">
    //                 <h4>Ame</h4>
    //                 <h4>Owner: ame#1423</h4>
    //                 <h4>{removedDate}</h4>
    //             </div>
    //         </div>
    //         <h3 className="trackerHistoryHeader">History of removed friends</h3>
    //         <div className="trackerHistoryItem">
    //             <img src="https://cdn.discordapp.com/icons/753117788440231996/a_6602db2aa9f01f1a4ef911363f1a5592.gif" className="trackerHistoryAvatar"/>
    //             <div className="trackerHistoryInfo">
    //                 <h4>ame#1423</h4>
    //                 <h4>{removedDate}</h4>
    //             </div>
    //         </div>
    //     </div>;

    const testServerProps = {
        avatarURL: 'https://cdn.discordapp.com/icons/753117788440231996/a_6602db2aa9f01f1a4ef911363f1a5592.gif', // animated
        serverName: "Ame's Detective Bureau",
        ownerName: 'ame#1432',
        removedDate: new Date().toLocaleString('ja-JP', { timeZoneName: 'short' }),
    };

    const testFriendProps = {
        avatarURL: 'https://cdn.discordapp.com/avatars/309095572336541697/a_21a6f243aca597266811f9bd80aa24b3.webp', // non-animated
        friendName: 'ame#1432',
        removedDate: new Date().toLocaleString('ja-JP', { timeZoneName: 'short' }),
    };

    const testFriend2Props = {
        avatarURL: undefined, // empty
        friendName: 'ame#1432',
        removedDate: new Date().toLocaleString('ja-JP', { timeZoneName: 'short' }),
    };

    const testServerArray = [createServerLogEntry(testServerProps), createServerLogEntry(testServerProps)];
    const testFriendArray = [createFriendLogEntry(testFriendProps), createFriendLogEntry(testFriend2Props)];

    const element = React.createElement(
        'div',
        {
            className: 'trackerHistoryContainer',
        },
        React.createElement('h3', {
            className: 'trackerHistoryHeader',
        }, 'Recently removed servers'),
        ...testServerArray,
        createRecentServerEntries(removedGuilds),
        React.createElement('h3', {
            className: 'trackerHistoryHeader',
        }, 'Recently removed friends'),
        ...testFriendArray,
        createRecentFriendEntries(removedFriends),
    );

    BdApi.showConfirmationModal('ConfirmationTracker', element, {
        confirmText: 'Okay',
        cancelText: 'Update cache',
        onConfirm: () => {},
        onCancel: () => {
            try {
                const res = compareAndUpdateCurrentSavedData();
                console.dir(currentSavedData);
                console.dir(res);
                Toasts.success('Updated cache successfully!');
            } catch (e) {
                Toasts.error('Cache failed to update');
            }
        },
    });
};

module.exports = () => ({
    getName() { return config.info.name; },
    getAuthor() { return config.info.authors.map((a) => a.name).join(', '); },
    getDescription() { return config.info.description; },
    getVersion() { return config.info.version; },
    start() {
        Logger.info(config.info.name, `Initializing version ${config.info.version}...`);
        initializeCurrentSavedData();

        // This part adds our button
        myButton = document.createElement('button');
        myButton.textContent = 'Click me!';
        myButton.addEventListener('click', () => openHistoryWindow(recentRemovedData));

        serverList.append(myButton);

        // This part re-adds it when removed
        BdApi.onRemoved(myButton, () => {
            serverList.append(myButton);
        });
    },
    stop() {
        myButton.remove();
        myButton = undefined;
    },
});
