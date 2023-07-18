import {afterAll, afterEach, beforeAll, describe, expect, test} from '@jest/globals'
import request from "supertest";
import jwt, {JwtPayload} from "jsonwebtoken";
import db from "../../db";
import app from "../../../app";
import AuthRefreshToken from "../../../models/AuthRefreshToken";

let agent: request.SuperAgentTest;

// test data may be anything
async function sendCreateRoomRequest(data: any) {
    const payload = JSON.stringify(data)
    return agent
        .post('/auth/createRoom')
        .send(payload)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');
}

async function expectSuccessfulResponse(response: request.Response) {
    expect(response.body).toMatchObject({"message": "Room created"})
    expect(response.body).toHaveProperty('data')
    expect(Object.keys(response.body).length).toBe(2)
    expect(response.body.data).toHaveProperty('token')
    expect(response.body.data).toHaveProperty('refreshToken')
    expect(Object.keys(response.body.data).length).toBe(2)
    // Check jwt tokens
    await jwt.verify(response.body.data.token, process.env.TOKEN_AUTH_SECRET!)

    const payload = jwt.decode(response.body.data.refreshToken) as JwtPayload;
    const refreshTokenModel = await AuthRefreshToken.findById(payload.id);
    expect(refreshTokenModel).not.toBeNull()
    const secret = process.env.REFRESH_TOKEN_AUTH_SECRET! + refreshTokenModel!.salt;
    await jwt.verify(response.body.data.refreshToken, secret)
}

function expectFailResponse(response: request.Response, errorMsg: string) {
    expect(response.body).toEqual({
        "message": "Create room response error",
        "error_msg": errorMsg,
    })
}

describe('Create room tests', () => {
    beforeAll(async () => {
        await (await db).connect()
        const {expressApp} = await app;
        agent = request.agent(expressApp)
    })
    afterEach(async () => (await db).clear())
    afterAll(async () => (await db).close())

    test('Without args', async () => {
        const response = await sendCreateRoomRequest({})
        expectFailResponse(response, "Username must be a string")
    })

    test('With username only', async () => {
        const response = await sendCreateRoomRequest({username: "Test"})
        await expectSuccessfulResponse(response)
    })

    test('With username with space', async () => {
        const response = await sendCreateRoomRequest({username: "Test user"})
        await expectSuccessfulResponse(response)
    })

    test('With username with 2 spaces in the middle', async () => {
        await sendCreateRoomRequest({username: "Test  user"})
            .then(async (response) => {
                expect(response.body).toEqual({
                    "message": "Create room response error",
                    "error_msg": "Username must not contain double spaces",
                })
            })
    })

    test('With username with 5 spaces in the middle', async () => {
        await sendCreateRoomRequest({username: "Test     user"})
            .then(async (response) => {
                expect(response.body).toEqual({
                    "message": "Create room response error",
                    "error_msg": "Username must not contain double spaces",
                })
            })
    })

    test('With username with space in the start', async () => {
        await sendCreateRoomRequest({username: " Test"})
            .then(async (response) => {
                expect(response.body).toEqual({
                    "message": "Create room response error",
                    "error_msg": "Username must not start or end with a space",
                })
            })
    })

    test('With username with 2 spaces in the start', async () => {
        await sendCreateRoomRequest({username: "  Test"})
            .then(async (response) => {
                expect(response.body).toEqual({
                    "message": "Create room response error",
                    "error_msg": "Username must not start or end with a space",
                })
            })
    })

    test('With username with space in the end', async () => {
        await sendCreateRoomRequest({username: "Test "})
            .then(async (response) => {
                expect(response.body).toEqual({
                    "message": "Create room response error",
                    "error_msg": "Username must not start or end with a space",
                })
            })
    })

    test('With username with 2 spaces in the end', async () => {
        await sendCreateRoomRequest({username: "Test  "})
            .then(async (response) => {
                expect(response.body).toEqual({
                    "message": "Create room response error",
                    "error_msg": "Username must not start or end with a space",
                })
            })
    })

    test('With username of only 1 letter', async () => {
        const response = await sendCreateRoomRequest({username: "X"})
        await expectSuccessfulResponse(response)
    })

    test('With username of 32 letters', async () => {
        const response = await sendCreateRoomRequest({username: "encephalomyeloradiculoneuropathy"})
        await expectSuccessfulResponse(response)
    })

    test('With username of 33 letters', async () => {
        const response = await sendCreateRoomRequest({username: "eencephalomyeloradiculoneuropathy"})
        await expectFailResponse(response, "Username must be between 1 and 32 characters")
    })

    test('With username of 40 letters', async () => {
        const response = await sendCreateRoomRequest({username: "Keihanaikukauakahihuliheekahaunaeleeeeee"})
        await expectFailResponse(response, "Username must be between 1 and 32 characters")
    })

    test('With username of non-latin letters', async () => {
        const response = await sendCreateRoomRequest({username: "Блаблабла"})
        await expectFailResponse(response, "Username must contain only letters, numbers and spaces")
    })

    test('With username of one digit letter', async () => {
        const response = await sendCreateRoomRequest({username: "7"})
        await expectSuccessfulResponse(response)
    })

    test('With empty email' , async () => {
        const response = await sendCreateRoomRequest({username: "Test", email: ""})
        await expectSuccessfulResponse(response)
    })

    test('With null email' , async () => {
        const response = await sendCreateRoomRequest({username: "Test", email: null})
        await expectSuccessfulResponse(response)
    })

    const correctEmails = [
        "name@domain.com",
        "name@domain.moscow",
        "name@sub.domain.com",
        "verylongname@domain.com",
        "name@verylongdomainpart.com",
    ]
    test.each(correctEmails)('With various correct emails (%p)', async (email) => {
        const response = await sendCreateRoomRequest({username: "Test", email: email})
        await expectSuccessfulResponse(response)
    })

    const invalidEmails = [
        "name@domain",
        "name@domain.",
        "name@domain.c",
        "name@-domain.com",
        "name@_domain.com",
        "name@domain-.com",
        "name@domain.com_",
        "name@.domain.com",
        "name@domain..com",
        "name@domain@domain.com",
        "name @ domain.com",
    ]
    test.each(invalidEmails)('With various invalid emails (%p)', async (email) => {
        const response = await sendCreateRoomRequest({username: "Test", email: email})
        await expectFailResponse(response, "Email must be a valid email address or not specified")
    })
})