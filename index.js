"use strict";

const express = require("express");
const proxy = require("express-http-proxy");
const { curry } = require("lodash");
const app = express();
const yaml = require("js-yaml");
const fs = require("fs");
const compose = require("docker-compose");
const path = require("path");

const baseUrl = process.env.DOCKER_BASE_URL || "http://localhost";
const buildDir = process.env.DOCKER_BUILD_DIRECTORY || "build";
const dockerStartPort = process.env.DOCKER_START_PORT || 7000;
const dockerComposeFile = process.env.DOCKER_COMPOSE || "docker-compose.yml";
const deploymentFile = process.env.FAAS_DEPLOYMENT_FILE || "./deployment.yml";

const arrayToObject = curry(function({ objKey }, agg, item) {
  const key = item[objKey];
  const { [objKey]: omit, ...newItem } = item; //array destructuring to remove key immutably
  agg[key] = newItem;
  return agg;
});

function getDeployment() {
  return yaml.safeLoad(fs.readFileSync(deploymentFile, "utf8"));
}

function getFunctionNames() {
  return Object.keys(getDeployment().functions);
}

function getDockerServices(functionName, index) {
  const port = dockerStartPort + index;
  const handler = getDeployment().functions[functionName].handler;
  const watchVolumes = [
    `${handler}:/home/app/function`,
    `./template/nodemon-armhf/db:/home/app/db`,
    `./template/nodemon-armhf/model:/home/app/model`
  ];
  return {
    functionName,
    network_mode: "host",
    container_name: `${functionName}`,
    build: `./${buildDir}/${functionName}/`,
    command: `sh -c "cd /home/app; npm start"`,
    environment: [
      `NODE_ENV=development`,
      `PORT=${port}`,
      `http_port=${port}`,
      `MYSQL_DB=${process.env.MYSQL_DB}`,
      `MYSQL_PW=${process.env.MYSQL_PW}`
    ],
    ports: [`${port}:${port}`],
    working_dir: `/home/app`,
    volumes: watchVolumes
  };
}

function getDockerObj() {
  return getFunctionNames()
    .map(getDockerServices)
    .reduce(arrayToObject({ objKey: "functionName" }), {});
}

function getDockerJson() {
  return {
    version: `3`,
    services: { ...getDockerObj() }
  };
}

function getDockerYaml() {
  return yaml.safeDump(getDockerJson());
}

function writeDockerCompose() {
  return new Promise(function(resolve, reject) {
    const dockerYaml = getDockerYaml();
    fs.writeFile(dockerComposeFile, dockerYaml, err => {
      if (err) {
        console.log(err);
        reject();
      } else {
        resolve();
      }
    });
  });
}

function downAll() {
  return new Promise(function(resolve, reject) {
    const functionNames = getFunctionNames();
    console.log("stopping conainers...");
    let promises = functionNames.map(compose.stop);
    Promise.all(promises).then(() => {
      console.log("finished stopping conainers...");
      resolve();
    });
  });
}

function buildAll() {
  return new Promise(function(resolve, reject) {
    compose
      .buildAll({ cwd: path.join(__dirname), log: true })
      .then(resolve)
      .catch(reject);
  });
}

function upAll() {
  return new Promise(function(resolve, reject) {
    compose
      .upAll({ cwd: path.join(__dirname), log: true })
      .then(resolve)
      .catch(reject);
  });
}

function handleProxy(functionName, index) {
  const path = getDeployment().functions[functionName].handler.slice(1);
  const port = dockerStartPort + index;
  app.use(path, proxy(`${baseUrl}:${port}`));
}

function startServer() {
  getFunctionNames().map(handleProxy);

  const port = process.env.http_port || 3000;
  app.listen(port, () => {
    console.log(`OpenFaaS Node.js listening on port: ${port}`);
  });
}

writeDockerCompose()
  .then(downAll)
  .then(buildAll)
  .then(upAll)
  .then(startServer);
