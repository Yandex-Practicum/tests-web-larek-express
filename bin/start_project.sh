#!/bin/bash

echo "ЗАПУСК ПРОЕКТА"
cp $GITHUB_WORKSPACE/backend/.env.example $GITHUB_WORKSPACE/backend/.env
sed -i~ '/^DB_ADDRESS=/s/=.*/=mongodb:\/\/root:example@mongo:27017\//' $GITHUB_WORKSPACE/backend/.env
cp $GITHUB_WORKSPACE/frontend/.env.example $GITHUB_WORKSPACE/frontend/.env
sed -i~ '/^VITE_API_ORIGIN=/s/=.*/=http:\/\/localhost\/api/' $GITHUB_WORKSPACE/backend/.env
docker compose up -d
