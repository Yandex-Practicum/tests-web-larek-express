#!/bin/bash

export NEWMAN_VERSION=5.3.2

install_newman() {
  npm install -g "newman@$NEWMAN_VERSION" --ignore-engines
}
