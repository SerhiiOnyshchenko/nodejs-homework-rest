const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const { errorHandler } = require("./helpers/apiHelpes");

const contactsRouter = require("./routes/api/contacts");
const usersRouter = require("./routes/api/users");
const avatarsRouter = require("./routes/api/avatars");

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use("/api/contacts", contactsRouter);
app.use("/api/users", usersRouter);
app.use("/api/avatars", avatarsRouter);

app.use((_, res, __) => {
  res.status(404).json({
    status: "error",
    code: 404,
    message: "Use api on routes: /api/contacts, /api/users, /api/avatars",
    data: "Not found",
  });
});
app.use(errorHandler);

module.exports = app;
