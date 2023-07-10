import crypto from "crypto";

const generateSalt = () => {
    const salt = Buffer.alloc(32)
    salt.write(crypto.randomBytes(32).toString('hex'))
    return salt
}

export const generateAuthRefreshSalt = generateSalt
export const generateInviteLinkSalt = generateSalt
