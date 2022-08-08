/* eslint-disable no-undef */
const app = require("../src/app");
const request = require("supertest");
const { User } = require("../src/db/usersModel");

describe("POST /api/users/login", () => {
  test("should return status 200, response body have a token, response body user it is object with keys email and password", async () => {
    const user = {
      _id: "1",
      email: "example2@example2.com",
      password: "123456",
      validPassword: () => true,
    };
    const userFind = {
      email: "example2@example2.com",
      subscription: "subscription",
    };
    jest.spyOn(User, "findOne").mockImplementationOnce(() => user);
    jest.spyOn(User, "findOneAndUpdate").mockImplementationOnce(() => user);
    jest.spyOn(User, "findOne").mockImplementationOnce(() => userFind);

    const response = await request(app)
      .post("/api/users/login")
      .send({ email: "example2@example2.com", password: "123456" })
      .set("Accept", "application/json");

    expect(response.status).toEqual(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user).toEqual(
      expect.objectContaining({
        email: expect.any(String),
        subscription: expect.any(String),
      })
    );
  });
});
