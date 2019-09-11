# Markdown generator for MySQL schema's tables

## Table of Contents

- [Prerequisite](#prerequisite)
- [Arguments](#arguments)
- [Install third part dependencies](#install-third-part-dependencies)
- [Run](#run)



## Prerequisite

- NodeJS >= 8.x
- MySQL >= 5.x

## Arguments
These arguments either need to pass from environment variables or command line arguments, if pass from both then command line will be used

| Name | Required | Deafult
|:----|:-----------|:------
DB_HOST | Yes | 127.0.0.1
DB_PORT | Yes | 3306
DB_USER | Yes | root
DB_PASSWORD | Yes |
DB_DATABASE | Yes | test
FILE_PATH | Yes | .(current directory) 
FILE_NAME | Yes | ${DB_DATABASE}.md

## Install third part dependencies
Go to inside project using `cd` command and then run

```sh
npm install
```

## Run

```sh
node index.js
```

or with arguments 

```sh
node index.js DB_HOST=localhost DB_USER=root DB_PASSWORD=test DB_DATABASE=test FILE_NAME=FirstTest.md
```

