import express from "express";
import {HttpController} from "../controllers/HttpController";
import {check} from "express-validator";
import {handleInviteLinkHash} from "../middleware/inviteLinkMiddleware";

const router = express()
const controller = new HttpController()

const chatJoinHandlers = [
    check('username')
        .isString().withMessage('Username must be a string')
        .isLength({min: 1, max: 32}).withMessage('Username must be between 1 and 20 characters')
        .matches(/^[a-zA-Z0-9 ]+$/).withMessage('Username must contain only letters, numbers and spaces')
        // string must not start or end with a space
        .custom((value) => {
            return !value.startsWith(' ') && !value.endsWith(' ');
        }).withMessage('Username must not start or end with a space')
        // check string contains only single spaces
        .custom((value) => {
            return !value.includes('  ');
        }).withMessage('Username must not contain double spaces'),
    check('email').optional()
        .isEmail().withMessage('Email must be a valid email address or not specified'),
];

router.post('/createRoom', chatJoinHandlers, controller.createRoom);

router.post('/restoreRooms', [
    check('email').isEmail().withMessage('Email must be a valid email address'),
], controller.restoreRooms);

router.get('/inviteChatInfo', [
    check('inviteHash').isBase64().withMessage('Invite hash must be a valid base64 string'),
    handleInviteLinkHash('get'),
], controller.getInviteChatInfo);

router.post('/joinRoom', [
    ...chatJoinHandlers,
    check('inviteHash').isBase64().withMessage('Invite hash must be a valid base64 string'),
    handleInviteLinkHash('post'),
], controller.joinRoom);

router.post('/updateToken', [
    check('refreshToken')
        .notEmpty().withMessage('Refresh token must be not empty')
        .isJWT().withMessage('Refresh token must be a valid JWT'),
], controller.updateToken);

export default router;