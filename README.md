# Cra Antd CLI

A CLI Tool for create a react app with antd, react route, react redux etc.

## Installation

```bash
# install global
$ npm install -g cra-antd-cli
```

## Usage

```bash
# create
$ cra-antd-cli <command> [options]
```

### Command create

```bash
# create
$ cra-antd-cli create [options] <project> [template]

# basic
$ cra-antd-cli create project

# create is default command
$ cra-antd-cli project
```

Command create options

- `-f, --force`, force overwrite exists project

```bash
# force overwrite
$ cra-antd-cli create -f project
```

### Command help

```bash
# help
$ cra-antd-cli -h
$ cra-antd-cli -help

# command help
$ cra-antd-cli create --help
```

# ToDo

- [ ] More templates: vue, angular etc.
