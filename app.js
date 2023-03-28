const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
let dbPath = path.join(__dirname, "userData.db");
let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({ filename: dbPath, driver: sqlite3.Database });
  } catch (error) {
    console.log(`Database error is ${error}`);
    process.exit(1);
  }
};
initializeDbAndServer();
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `select username from user where username='${username}';`;
  const userQueryResponse = await database.get(userQuery);
  if (userQueryResponse === undefined) {
    const createUser = `insert into user (username,name,password,gender,location)
                            values ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
    if (password.length < 5) {
      response.status(400);
      response.send(`Password is too short`); //Scenario 2
    } else {
      const createUserResponse = await database.run(createUser);
      response.status(200);
      response.send(`User created successfully`); //Scenario 3
    }
  } else {
    response.status(400);
    response.send(`User already exists`); //Scenario 1
  }
});
//API-2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `select * from user where username='${username}';`;
  const userQueryResponse = await database.get(userQuery);
  if (userQueryResponse === undefined) {
    response.status(400);
    response.send(`Invalid user`); //Scenario 1
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userQueryResponse.password
    );
    if (isPasswordMatched) {
      response.status(200);
      response.send(`Login success!`); //Scenario 3
    } else {
      response.status(400);
      response.send(`Invalid password`); //Scenario 2
    }
  }
});
//API-3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  // check user
  const checkUserQuery = `select * from user where username = '${username}';`;
  const userDetails = await database.get(checkUserQuery);
  if (userDetails !== undefined) {
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (isPasswordValid) {
      if (newPassword.length > 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `update user set 
        password = '${hashedPassword}' where username = '${username}';`;
        const updatePasswordResponse = await database.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated"); //Scenario 3
      } else {
        response.status(400);
        response.send("Password is too short"); //Scenario 2
      }
    } else {
      response.status(400);
      response.send("Invalid current password"); //Scenario 1
    }
  } else {
    response.status(400);
    response.send(`Invalid user`); // Scenario 4
  }
});
module.exports = app;
