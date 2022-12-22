/**
 * @name RemovedConnectionAlerts
 * @author iris!
 * @authorId 102528230413578240
 * @version 0.5.3
 * @description Keep track which friends and servers remove you (original by Metalloriff)
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
        version: '0.5.3',
        description: 'Keep track which friends and servers remove you (original by Metalloriff)',
        github: 'https://github.com/iyu46/RemovedConnectionAlerts',
        github_raw: 'https://raw.githubusercontent.com/iyu46/RemovedConnectionAlerts/main/RemovedConnectionAlerts.plugin.js',
    },
    changelog: [
        {
            title: '0.5.3',
            type: 'added',
            items: [
                'Added automatic checking through dispatcher',
                'Added proper UI button with icon next to Inbox (thanks programmer2514!)',
                'Keep UI button on the UI via observer',
                'Added tooltip on hover for UI button',
            ],
        },
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
    const { Data, UI } = window.BdApi;
    const { createTooltip, showConfirmationModal } = UI;

    const {
        DiscordModules, DOMTools, Logger, Utilities,
    } = window.ZLibrary;
    const {
        React, Dispatcher, GuildStore, RelationshipStore, UserStore,
    } = DiscordModules;

    const subscribeTargets = [
        'FRIEND_REQUEST_ACCEPTED',
        'RELATIONSHIP_ADD',
        'RELATIONSHIP_UPDATE',
        'RELATIONSHIP_REMOVE',
        'GUILD_CREATE',
        'GUILD_UPDATE',
        'GUILD_DELETE',
    ];
    let rcaModalBtn;
    let rcaModalBtnRemoveObserver;
    let currentSavedData;
    let isUpdating = false;

    DOMTools.addStyle('RemovedConnectionAlerts', `
    .rcaHistoryContainer {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 8px;
        overflow: auto;
        max-height: 75vh;
    }
    .rcaHistoryItem { /* avatar + item */
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
            populateEmptyCurrentSavedData();
        } else {
            currentSavedData = savedDataInFile;
        }
    };

    const compareAndUpdateCurrentSavedData = (currentUserId) => {
        if (isUpdating === true) return null;
        isUpdating = true;
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
        } finally {
            isUpdating = false;
        }

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
                removedDate: new Date(g.timeRemoved).toLocaleString('ja-JP', {
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
                removedDate: new Date(f.timeRemoved).toLocaleString('ja-JP', {
                    timeZoneName: 'short',
                }),
            });
        });

        return removedFriendsAsElements;
    };

    const openHistoryWindow = () => {
        const recentFriendHistory = [...currentSavedData.removedFriendHistory];
        const recentGuildHistory = [...currentSavedData.removedGuildHistory];
        Utilities.stableSort(recentFriendHistory, (a, b) => (new Date(b.timeRemoved) - new Date(a.timeRemoved)));
        Utilities.stableSort(recentGuildHistory, (a, b) => (new Date(b.timeRemoved) - new Date(a.timeRemoved)));

        let friendsMoreThan24HoursIndex = 0;
        const yesterdayTimestamp = new Date().getTime() - (24 * 60 * 60 * 1000);
        while (friendsMoreThan24HoursIndex < recentFriendHistory.length) {
            const curr = new Date(recentFriendHistory[friendsMoreThan24HoursIndex].timeRemoved);
            const currMinus24HoursTimestamp = curr.getTime() - (24 * 60 * 60 * 1000);
            if (yesterdayTimestamp > currMinus24HoursTimestamp) break;
            friendsMoreThan24HoursIndex += 1;
        }

        let recentFriends = [];
        let olderFriends = [];
        recentFriends = recentFriendHistory.slice(0, friendsMoreThan24HoursIndex + 1);

        // if there is a history and the loop didn't repeat till the end of the array (found an element older than 24 hours)
        if (recentFriendHistory.length && (friendsMoreThan24HoursIndex !== recentFriendHistory.length - 1)) {
            olderFriends = recentFriendHistory.slice(friendsMoreThan24HoursIndex + 1);
        }

        const element = React.createElement(
            'div',
            {
                className: 'rcaHistoryContainer',
            },
            recentFriendHistory.length ? React.createElement('h3', {
                className: 'rcaHistoryHeader',
            }, 'Recently removed friends') : null,
            createRecentFriendEntries(recentFriends),
            createRecentFriendEntries(olderFriends), // TODO: separate
            recentGuildHistory.length ? React.createElement('h3', {
                className: 'rcaHistoryHeader',
            }, 'Recently removed servers') : null,
            createRecentServerEntries(recentGuildHistory),
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
                    UI.showToast('Updated cache successfully!', { type: 'success' });
                } catch (e) {
                    UI.showToast('Cache failed to update', { type: 'error' });
                }
            },
        });
    };

    // original code from https://github.com/BetterDiscord/BetterDiscord/blob/9e0f274b504d155b73c4c3148df5173bd8fad3bc/renderer/src/modules/dommanager.js#L182
    const onRemovedPersistent = (node, callback) => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((_, m) => {
                const mutation = mutations[m];
                const nodes = Array.from(mutation.removedNodes);
                const directMatch = nodes.indexOf(node) > -1;
                const parentMatch = nodes.some((parent) => parent.contains(node));
                if (directMatch || parentMatch) {
                    callback();
                }
            });
        });

        observer.observe(document.body, { subtree: true, childList: true });
        return () => { observer.disconnect(); };
    };

    const insertButtonAtLocationWithStyle = (getChannelHeaderInboxIcon, getChannelHeaderInboxIconAlt) => {
        const channelHeaderInboxIcon = getChannelHeaderInboxIcon();
        const targetElem = channelHeaderInboxIcon
        || Array.from(getChannelHeaderInboxIconAlt().children).find(
            (e) => e.className === 'button-1fGHAH iconWrapper-2awDjA clickable-ZD7xvu',
        );
        let rcaModalBtnClassName = 'iconWrapper-2awDjA clickable-ZD7xvu';
        rcaModalBtnClassName = (channelHeaderInboxIcon)
            ? rcaModalBtnClassName
            : `button-1fGHAH ${rcaModalBtnClassName}`;
        rcaModalBtn.setAttribute('class', rcaModalBtnClassName);
        targetElem.parentElement.insertBefore(rcaModalBtn, targetElem);
    };

    const setupButtonUI = (getChannelHeaderInboxIcon, getChannelHeaderInboxIconAlt) => {
        rcaModalBtn = document.createElement('div');
        const rcaModalBtnStyle = {
            // class: 'iconWrapper-2awDjA clickable-ZD7xvu',
            role: 'button',
            'aria-label': 'Removed Connection History',
            tabindex: '0',
        };
        Object.entries(rcaModalBtnStyle).forEach(([key, value]) => rcaModalBtn.setAttribute(key, value));
        const rcaModalBtnIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const rcaModalBtnIconStyle = {
            x: '0',
            y: '0',
            class: 'icon-2xnN2Y',
            'aria-hidden': 'true',
            role: 'img',
            width: '24',
            height: '24',
            viewBox: '0 0 16 16',
        };
        Object.entries(rcaModalBtnIconStyle).forEach(([key, value]) => rcaModalBtnIcon.setAttribute(key, value));
        const rcaModalBtnPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        rcaModalBtnPath.setAttribute('fill', 'currentColor');
        // eslint-disable-next-line max-len
        rcaModalBtnPath.setAttribute('d', 'M3.05 3.05a7 7 0 0 0 0 9.9.5.5 0 0 1-.707.707 8 8 0 0 1 0-11.314.5.5 0 0 1 .707.707zm2.122 2.122a4 4 0 0 0 0 5.656.5.5 0 1 1-.708.708 5 5 0 0 1 0-7.072.5.5 0 0 1 .708.708zm5.656-.708a.5.5 0 0 1 .708 0 5 5 0 0 1 0 7.072.5.5 0 1 1-.708-.708 4 4 0 0 0 0-5.656.5.5 0 0 1 0-.708zm2.122-2.12a.5.5 0 0 1 .707 0 8 8 0 0 1 0 11.313.5.5 0 0 1-.707-.707 7 7 0 0 0 0-9.9.5.5 0 0 1 0-.707zM10 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z');
        rcaModalBtn.addEventListener('click', () => openHistoryWindow());

        rcaModalBtnIcon.appendChild(rcaModalBtnPath);
        rcaModalBtn.appendChild(rcaModalBtnIcon);

        insertButtonAtLocationWithStyle(getChannelHeaderInboxIcon, getChannelHeaderInboxIconAlt);
        createTooltip(rcaModalBtn, 'Removed History', { side: 'bottom' });
    };

    const update = () => {
        const res = compareAndUpdateCurrentSavedData(getCurrentUserId());
        if (res && (res.removedFriends.length > 0 || res.removedGuilds.length > 0)) {
            openHistoryWindow();
            console.dir(res);
        }
    };

    return ({
        getName() { return config.info.name; },
        getAuthor() { return config.info.authors.map((a) => a.name).join(', '); },
        getDescription() { return config.info.description; },
        getVersion() { return config.info.version; },
        start() {
            Logger.info(config.info.name, `version ${config.info.version} has started.`);
            initializeCurrentSavedData(getCurrentUserId());

            // eslint-disable-next-line max-len
            const getChannelHeaderInboxIcon = () => document.querySelector('a.anchor-1MIwyf.anchorUnderlineOnHover-2qPutX:not(.snowsgivingLink-1TZi3c)')?.previousSibling;
            const getChannelHeaderInboxIconAlt = () => document.querySelector('.toolbar-3_r2xA');

            setupButtonUI(getChannelHeaderInboxIcon, getChannelHeaderInboxIconAlt);

            rcaModalBtnRemoveObserver = onRemovedPersistent(rcaModalBtn, () => {
                insertButtonAtLocationWithStyle(getChannelHeaderInboxIcon, getChannelHeaderInboxIconAlt);
            });

            subscribeTargets.forEach((e) => Dispatcher.subscribe(e, update));
        },
        stop() {
            rcaModalBtnRemoveObserver();
            rcaModalBtn.remove();
            rcaModalBtn = undefined;

            subscribeTargets.forEach((e) => Dispatcher.unsubscribe(e, update));
        },
    });
};
// eslint-disable-next-line spaced-comment
/*@end@*/
