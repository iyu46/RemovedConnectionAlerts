/**
 * @name RemovedConnectionAlerts
 * @author iris!
 * @authorId 102528230413578240
 * @version 0.5.2
 * @description Keep track which friends and servers remove you
 * @website https://github.com/iyu46/RemovedConnectionAlerts
 * @source https://raw.githubusercontent.com/iyu46/RemovedConnectionAlerts/main/RemovedConnectionAlerts.plugin.js
 */
/* eslint-disable */
/*@cc_on
@if (@_jscript)

    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();
@else@*/
/* eslint-enable */
/* eslint-disable max-len, global-require, consistent-return, no-promise-executor-return, import/no-unresolved */
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
        version: '0.5.2',
        description: 'Keep track which friends and servers remove you',
        github: 'https://github.com/iyu46/RemovedConnectionAlerts',
        github_raw: 'https://raw.githubusercontent.com/iyu46/RemovedConnectionAlerts/main/RemovedConnectionAlerts.plugin.js',
    },
    changelog: [
        {
            title: '0.5.2',
            type: 'improved',
            items: [
                'Added user id in config file name for multi-user support',
            ],
        },
        {
            title: '0.5.1',
            type: 'added',
            items: [
                'Added check for ZeresPluginLibrary on launch',
                'Added check for direct file execution on launch',
                'Restructure internals',
            ],
        },
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

let NoZLibrary;
if (!global.ZeresPluginLibrary) {
    const { BdApi } = window;
    NoZLibrary = () => ({
        getName() { return config.info.name; },
        getAuthor() { return config.info.authors.map((a) => a.name).join(', '); },
        getDescription() { return config.info.description; },
        getVersion() { return config.info.version; },
        load() {
            BdApi.UI.showConfirmationModal(
                'Library Missing',
                `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`,
                {
                    confirmText: 'Download Now',
                    cancelText: 'Cancel',
                    onConfirm: () => {
                        require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (error, response, body) => {
                            if (error) return require('electron').shell.openExternal('https://betterdiscord.app/Download?id=9');
                            await new Promise((r) => require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r));
                        });
                    },
                },
            );
        },
        start() {},
        stop() {},
    });
}
/* eslint-enable max-len, global-require, consistent-return, no-promise-executor-return, import/no-unresolved */

module.exports = (!global.ZeresPluginLibrary) ? NoZLibrary : () => {
    const { Data, DOM, UI } = window.BdApi;
    const { onRemoved } = DOM;
    const { showConfirmationModal } = UI;

    const {
        DiscordModules, Logger, Toasts,
    } = window.ZLibrary;
    const {
        React, GuildStore, RelationshipStore, UserStore,
    } = DiscordModules;

    DOM.addStyle('RemovedConnectionAlerts', `
    .rcaHistoryContainer {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 8px;
        overflow: auto;
        max-height: 75vh;
    }
    .rcaHistoryItem {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        gap: 4px;
        padding: 4px 2px 4px 2px;
        /* border: 2px solid var(--header-primary); */
        border-radius: 5px; */
        margin: 1px;
    }
    .rcaHistoryAvatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 3px solid var(--header-primary);
        margin-right: 6px;
    }
    .rcaHistoryInfo {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
        color: var(--header-primary);
    }
    .rcaHistoryHeader {
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--header-primary);
    }
    `);

    const serverList = document.querySelector('.tree-3agP2X > div > div[aria-label]');
    let myButton;
    let currentSavedData;
    let recentRemovedData;

    const getCurrentUserId = () => UserStore.getCurrentUser().id;

    const getSavedData = (currentUserId) => {
        const savedData = Data.load(`RemovedConnectionAlerts_${currentUserId}`, 'savedData');
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

    const setSavedData = (currentUserId) => {
        const currentSavedDataSnapshot = {
            friendCache: currentSavedData.friendCache,
            guildCache: currentSavedData.guildCache,
            friendCacheSet: Array.from(currentSavedData.friendCacheSet),
            guildCacheSet: Array.from(currentSavedData.guildCacheSet),
            removedFriendHistory: currentSavedData.removedFriendHistory,
            removedGuildHistory: currentSavedData.removedGuildHistory,
        };
        return Data.save(`RemovedConnectionAlerts_${currentUserId}`, 'savedData', currentSavedDataSnapshot);
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
        const savedDataInFile = getSavedData(currentUserId);
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

    const compareAndUpdateCurrentSavedData = (currentUserId) => {
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
            guilds.guildsSet.forEach((id) => cachedGuildsDiffSet.delete(id));

            // contains all friends that are now not on the new list
            cachedGuildsDiffSet.forEach((oldGuildId) => {
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
            setSavedData(currentUserId);

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
        className: 'rcaHistoryItem',
    }, React.createElement('img', {
        src: avatarURL,
        className: 'rcaHistoryAvatar',
    }), React.createElement(
        'div',
        {
            className: 'rcaHistoryInfo',
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
        className: 'rcaHistoryItem',
    }, React.createElement('img', {
        src: avatarURL,
        className: 'rcaHistoryAvatar',
    }), React.createElement('div', {
        className: 'rcaHistoryInfo',
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
        // const element =  <div className="rcaHistoryContainer">
        //         <h3 className="rcaHistoryHeader">Recently removed servers</h3>
        //         <div className="rcaHistoryItem">
        //             <img src="https://cdn.discordapp.com/icons/753117788440231996/a_6602db2aa9f01f1a4ef911363f1a5592.gif" className="rcaHistoryAvatar"/>
        //             <div className="rcaHistoryInfo">
        //                 <h4>Ame</h4>
        //                 <h4>Owner: ame#1423</h4>
        //                 <h4>{removedDate}</h4>
        //             </div>
        //         </div>
        //         <h3 className="rcaHistoryHeader">History of removed friends</h3>
        //         <div className="rcaHistoryItem">
        //             <img src="https://cdn.discordapp.com/icons/753117788440231996/a_6602db2aa9f01f1a4ef911363f1a5592.gif" className="rcaHistoryAvatar"/>
        //             <div className="rcaHistoryInfo">
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
                className: 'rcaHistoryContainer',
            },
            React.createElement('h3', {
                className: 'rcaHistoryHeader',
            }, 'Recently removed servers'),
            ...testServerArray,
            createRecentServerEntries(removedGuilds),
            React.createElement('h3', {
                className: 'rcaHistoryHeader',
            }, 'Recently removed friends'),
            ...testFriendArray,
            createRecentFriendEntries(removedFriends),
        );

        showConfirmationModal('RemovedConnectionAlerts', element, {
            confirmText: 'Okay',
            cancelText: 'Update cache',
            onConfirm: () => {},
            onCancel: () => {
                try {
                    const res = compareAndUpdateCurrentSavedData(getCurrentUserId());
                    console.dir(currentSavedData);
                    console.dir(res);
                    Toasts.success('Updated cache successfully!');
                } catch (e) {
                    Toasts.error('Cache failed to update');
                }
            },
        });
    };

    return ({
        getName() { return config.info.name; },
        getAuthor() { return config.info.authors.map((a) => a.name).join(', '); },
        getDescription() { return config.info.description; },
        getVersion() { return config.info.version; },
        start() {
            Logger.info(config.info.name, `Initializing version ${config.info.version}...`);
            initializeCurrentSavedData(getCurrentUserId());

            // This part adds our button
            myButton = document.createElement('button');
            myButton.textContent = 'Click me!';
            myButton.addEventListener('click', () => openHistoryWindow(recentRemovedData));

            serverList.append(myButton);

            // This part re-adds it when removed
            onRemoved(myButton, () => {
                serverList.append(myButton);
            });
        },
        stop() {
            myButton.remove();
            myButton = undefined;
        },
    });
};
// eslint-disable-next-line spaced-comment
/*@end@*/
