// Importing express module
import express from "express";
const app = express();
import { getClient } from "./postgres_client.js";
import { upload_image, get_image, generateSignedUrl } from "./images.js";
import multer from "multer";
import { getAllProjects } from "./project-fetching.js";
import { addProject, deleteProject } from "./project-modification.js";
app.use(express.json());

import { config } from "dotenv";
config();
import sanitizer from "sanitize";

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

app.use(sanitizer.middleware);
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/image", upload.single("image"), upload_image);

app.delete("/project/:id", deleteProject);

app.put("/project/:id", (req, res) => {
  const pgClient = getClient();
  if (!verify.sessionId(req.headers.session_id)) {
    res.status(401);
    res.send("Authentication Failed");
    return;
  }
  const name = removeDangerousCharacters(req.bodyString("name"));
  const description = removeDangerousCharacters(req.bodyString("description"));
  const tagline = removeDangerousCharacters(req.bodyString("tagline"));
  const image_filename = removeDangerousCharacters(
    req.bodyString("image_filename")
  );
  const query = `UPDATE projects SET name='${name}', tagline='${tagline}', description='${description}', last_updated=now(), image_filename='${image_filename}' WHERE id=${req.paramInt(
    "id"
  )} RETURNING *`;
  pgClient.query(query).then((dbRes) => {
    if (dbRes.rows.length > 0) {
      res.status(200);
      res.send(dbRes.rows[0]);
      return;
    }
    res.status(500);
    res.send("Error writing to db - is your id correct?");
  });
});

app.get("/projects", getAllProjects);

app.post("/project", addProject);

import verify from "./verify.js";
import Console from "console";

app.post("/login", (req, res) => {
  const json = req.body;
  const passwordCorrect = verify.password(
    json.password,
    process.env.SALT,
    process.env.PASSWORD_HASH
  );
  const otpCorrect = verify.otp(req.bodyInt("otp"));
  if (passwordCorrect && otpCorrect) {
    res.status(201);
    verify.createSession(res);
    return;
  }
  res.status(401);
  res.send("Failed To Authenticate");
});

app.get("/image/:filename", get_image);
app.get("/signed_url/:filename", generateSignedUrl); // will replace above

//require("./setup_table").setup(getClient()); // setup table
import setup_table from "./setup_table.js";
import { removeDangerousCharacters } from "./validation.js";
setup_table(getClient());
// Server setup
app.listen(process.env.PORT, () => {
  console.log("Server is Running");
});
