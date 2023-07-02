import express from "express";
import {HttpController} from "../controllers/HttpController";
import {check} from "express-validator";

const router = express()
const controller = new HttpController()

const chatJoinHandlers = [
    check('username')
        .isString().withMessage('Username must be a string')
        .isLength({min: 1, max: 20}).withMessage('Username must be between 1 and 20 characters')
        .matches(/^[a-zA-Z0-9 ]+$/).withMessage('Username must contain only letters, numbers and spaces'),
    check('email').optional()
        .isEmail().withMessage('Email must be a valid email address or not specified'),
];

router.post('/create', chatJoinHandlers, controller.createRoom);

router.post('/restore', [
    check('email').isEmail().withMessage('Email must be a valid email address'),
], controller.restoreRooms);

router.post('/join', chatJoinHandlers, controller.joinRooms);

// TODO: Update token route
router.post('/updateToken', [
    check('refreshToken')
        .notEmpty().withMessage('Refresh token must be not empty')
        .isJWT().withMessage('Refresh token must be a valid JWT'),
], controller.updateToken);

export default router;