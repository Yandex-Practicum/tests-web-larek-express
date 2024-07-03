#!/bin/bash

source $DIR_TESTS/bin/scripts.sh

echo "УСТАНОВКА ЗАВИСИМОСТЕЙ"
install_newman
npm install -g wait-port@1.0.4

echo "ЗАПУСК ТЕСТОВ"
wait-port -t 120000 localhost:80
newman run $DIR_TESTS/collections/sprint-13.json --color on --verbose
