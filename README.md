# OPENFAAS BACKEND WITH ARM32 ARCHITECHTURE AND HOT RELOADING

## Introduction / Motivation

This repository holds a sample backend for the openfaas framework. It is
implemented in a way that allows it to run on arm32 architecture. However, it
should also run on amd64 without any issues. I frequently build the project on
my laptop which is running amd64. This is made possible by the hard work done
on the alpine node docker image that I use as a template base:
```
FROM node:10.12.0-alpine as ship
```

The idea behind this repo is to provide a starting point / cut down on
boilerplate required to bootstrap a new project and deploy it onto a cluter of
raspberry pis

## Prerequisites

This guide will assume that you have:

1. A working kubernetes cluster
1. A working mysql deployment with a known ip/port and a database for your project
1. A working openfaas deployment with a known ip/port (probably 31112)
1. An environment variable set pointing openfaas at your deployment. 

To achieve the last point. set an environment variable to point at
<cluster-master-ip>:<openfaas-port>
```bash
# your ip/port may be different
export OPENFAAS_URL='192.168.1.208:31112'
```
For bonus points add this to your .bashrc so you don't have to run it every time:
```
# your ip/port may be different
echo "export OPENFAAS_URL='192.168.1.208:31112'" >> ~/.bashrc
```
*Note: There are arm openfaas and mysql deployments available. For tips on
implementing them, see the kubernetes repo in this organization.

## Quickstart

First, verify prereqs!

```bash
ln template/nodemon-armhf/package.json package.json
ln template/nodemon-armhf/.env .env

# Make sure to update <project-name> before running this
# faas-cli secret create mysql-<project-name>-database --from-literal=<project-name>-database
# grep -rli "/var/openfaas/secrets/mysql-database" | xargs sed -i 's/\/var\/openfaas\/secrets\/mysql-database/\/var\/openfaas\/secrets\/mysql-<project-name>-database/g'

faas-cli secret create mysql-password --from-literal=password
faas-cli secret create mysql-port --from-literal=3306 # this should be the cluster-port of your mysql service
faas-cli secret create mysql-user --from-literal=root
faas-cli secret create mysql-host --from-literal=10.104.202.224 # this should be the cluster-ip of your mysql service

mkdir functions/my-new-function
fa new get-my-new-function -a deployment.yml --lang nodemon-armhf --handler functions/my-new-function/get-my-new-function
fa build -f deployment.yml

npm start
# EDIT CODE
git add .
git commit -m "haaaaaands"
git push origin master
ssh pi@<my-master-pi's-ip> && cd /path/to/my/project && git pull origin master && fa build -f deployment.yml
```

## Architecture

On a high level, you will keep code that you want all functions to have access
to in the template/ directory. This means things like database connections,
models, global dependencies, etc. Any code that is multiuse should go in the
template.

Additionally, this is where the code that actually starts the servers is
located. So, if you need to make any changes (maybe you want to disable CORS)
then you should look in the template's index.js

**The index.js and docker-compose in the project root are only for development!**
They give you hot reloading of your docker containers.

## Dependencies

Global dependencies are held in template/nodemon-armhf/package.json.
Immediately after cloning this repo, you *must* add a hardlink from this file
to the root package.json (unless you don't want hot reloading):
```bash
ln template/nodemon-armhf/package.json package.json
```
Once you have done this, you may treat the package.json at the project root as
your dependency file

## Environment 

In development, you will not have access to kubernetes secrets so it makes
sense to use environment variables. To configure these, run:
```bash
ln template/nodemon-armhf/.env .env
```
And then edit your .env file freely. Please do not attempt to use environment
variables on your cluster unless you know what you're doing. I haven't tested
it and secrets are much safer.

## Secrets

In production you really should use secrets. They're quite easy to create with
the faas-cli, so stop right now and do it. Leave the secret names as they are
but update the values:
```bash
# this step allows you to have multiple projects on one mysql instance
faas-cli secret create mysql-<project-name>-database --from-literal=<project-name>-database

# Update the template to reflect the actual database, this will edit files 
# So make sure to update <project-name> before uncommenting it
# grep -rli "/var/openfaas/secrets/mysql-database" | xargs sed -i 's/\/var\/openfaas\/secrets\/mysql-database/\/var\/openfaas\/secrets\/mysql-<project-name>-database/g'

faas-cli secret create mysql-password --from-literal=password
faas-cli secret create mysql-port --from-literal=3306 # this should be the cluster-port of your mysql service
faas-cli secret create mysql-user --from-literal=root
faas-cli secret create mysql-host --from-literal=10.104.202.224 # this should be the cluster-ip of your mysql service
```
If you don't know your mysql host/port you may find it with `kubectl get
service mysql`


## Adding a New Function

If you want to add a new function, you can do it through the faas-cli! 

```bash
mkdir functions/my-new-function
fa new get-my-new-function -a deployment.yml --lang nodemon-armhf --handler functions/my-new-function/get-my-new-function
fa build -f deployment.yml
```

This will bootstrap a new function from the template in `template/nodemon-armhf/` that is ready to edit!

*Note that if your function needs secrets you will need to directly edit
`deployment.yml` -- read the openfaas docs or follow the existing examples to
see how to give your function access to a secret.

## Development

This is the cool part. Docker is used for local development. Every time you
change a file, nodemon will regenerate the docker-compose and recreate all the
containers, effectively giving you a hot reload.

The config for this is all done through index.js in the project's root. For the
most part, you won't need to edit this file at all. However, if you create a
new directory in the template and you want it to hot reload you'll need to add
it to the watchVolumes array. This will cause it to be mounted into the
containers and allow you to see your changes without running `fa build -f
deployment.yml`. 

If you need to add secrets to your dev containers, then add them into the
environment key of getDockerServices()

At any rate, to spin up a hot reloading dev environment, run `npm start`

## Deployment

In order to deploy, you will user the openfaas-cli. If you don't already have
it, you should install it now. If you are on arch linux it is available in the
AUR under the name openfaas-cli-bin. Otherwise you may install it with `curl
-sSL https://cli.openfaas.com | sudo sh` (as of 9/2019.. if this doesn't work
then just google it)

There is one "gotcha" to this process- if you deploy from an amd64 machine to
an arm32 machine, it will not work. This is because openfaas builds the docker
image locally and then deploys it.. so naturally it will build in amd64 and
you'll get an exec format error. I know that it is possible to build arm
architecture from amd, but that is outside the scope of this guide.
[Here](https://www.balena.io/blog/building-arm-containers-on-any-x86-machine-even-dockerhub/)
is an excellent guide if you are interested in pursuing that.

A much simpler workaround is to deploy from an arm device. So, go ahead and ssh
into your pi. If you're deploying to amd, skip this step.
```bash
ssh pi@192.168.1.208
```
Once you have set your gateway url (see prereqs #4), you may deploy by running
``` bash
faas-cli up deployment.yml
```

## Troubleshooting

If you're having issues locally, then find the name or id of your container with:
```bash
docker ps
```
or if it has already crashed:
```bash
docker container ls --all
```
Then read / follow the logs with
```bash
docker logs <container-id> -f
```
If you're having issues on the cluster, cd into it and get the pod with:
```bash
kubectl get po
```
Then check the logs with:
```bash
kubectl logs pod/pod-id
```
Or if it has already crashed:
```bash
kubectl describe pod/pod-id
```
