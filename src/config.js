/**
 * @typedef {Object} Config
 * @property {string} clientId
 * @property {string} clientSecret
 * @property {string} channelId
 * @property {string} token
 * @property {number} uniqueUsers
 * @property {string} debugChannelId
 * @property {string[]} adminIds
 */

/**
 * @type {Config}
 */
export const config = {
  // @ts-ignore
  clientId: process.env.CLIENT_ID,
  // @ts-ignore
  clientSecret: process.env.CLIENT_SECRET,
  // @ts-ignore
  channelId: process.env.CHANNEL_ID,
  // @ts-ignore
  token: process.env.TOKEN,
  // @ts-ignore
  uniqueUsers: Number(process.env.UNIQUE_USERS),
  // @ts-ignore
  debugChannelId: process.env.DEBUG_CHANNEL_ID,
  // @ts-ignore
  adminIds: process.env.ADMIN_IDS?.split(","),
};

// check if the config is set
if (
  !config.clientId ||
  !config.clientSecret ||
  !config.channelId ||
  !config.token ||
  !config.uniqueUsers ||
  !config.debugChannelId ||
  !config.adminIds
) {
  throw new Error(
    "Missing config values for either clientId, clientSecret, channelId, token, uniqueUsers, debugChannelId or adminIds"
  );
}
