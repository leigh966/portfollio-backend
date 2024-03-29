import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import {
  uploadFileToAWS,
  client as aws_client,
  handleGetObjectError,
} from "./aws-operations.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import verify from "./verify.js";

export function upload_image(request, response) {
  if (!verify.sessionId(request.headers.session_id)) {
    response.status(401);
    response.send("Authentication Failed");
    return;
  }
  let uuid = uuidv4().toString();
  var temp_file_arr = request.file.originalname.split(".");
  var temp_file_extension = temp_file_arr[temp_file_arr.length - 1];
  var filename = uuid + "." + temp_file_extension;

  uploadFileToAWS(request.file.buffer, filename).then((awsRes) => {
    // should probably clean up the temp file here
    response.status(201);
    response.send(filename);
  });
}

export function get_image(req, res) {
  const filename = req.paramString("filename");
  let command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: filename,
  });
  aws_client
    .send(command)
    .then((awsResponse) => {
      res.status(200);
      const splitFn = filename.split(".");
      res.type(splitFn[splitFn.length - 1]);
      const options = {
        root: path.join("temp"),
      };
      let filePath = "temp/" + filename;
      function resolve() {
        res.sendFile(filename, options);
      }
      let file = fs.createWriteStream(filePath);
      // Attach a 'data' listener to add the chunks of data to our array
      // Each chunk is a Buffer instance
      awsResponse.Body.on("data", (chunk) => {
        file.write(chunk);
      });

      // Once the stream has no more data, join the chunks into a string and return the string
      awsResponse.Body.once("end", resolve);
    })
    .catch((err) => {
      handleGetObjectError(err, res);
    });
}

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export async function generateSignedUrl(req, res) {
  let command = await new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: req.paramString("filename"),
    Expires: 60,
  });

  const url = await getSignedUrl(aws_client, command);

  res.status(200);
  res.send(url);
}
