#!/bin/bash

RED='\033[0;31m'
ORANGE='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m'

function preprocessFirebaseJson {
  export API_URL=$1
  envsubst < firebase.template.json > firebase.json
}

while true; do
  read -p "Build and Upload to (D/d)evelopment, (S/s)taging, (P/p)roduction, (U/u)S production or e(X/x)it: " dspux
  case $dspux in
    [Dd]* )
      printf "${GREEN}*********** Development ***********${NC}\n"
      npm ci
      npm run build:dev
      preprocessFirebaseJson https://dev-api.enquirytracker.net
      firebase deploy --project=dev
      break;;
    [Ss]* )
      printf "${ORANGE}*********** Staging ***********${NC}\n"
      npm ci
      npm run build:staging
      preprocessFirebaseJson https://staging-api.enquirytracker.net
      firebase deploy --project=staging
      break;;
    [Pp]* )
      printf "${RED}*********** Production ***********${NC}\n"
      npm ci
      npm run build:prod
      preprocessFirebaseJson https://api-au.enquirytracker.net
      firebase deploy --project=prod
      break;;
    [Uu]* )
      printf "${RED}*********** US Production ***********${NC}\n"
      npm ci
      npm run build:prod-usa
      preprocessFirebaseJson https://api-us.enquirytracker.net
      firebase deploy --project=prod-usa
      break;;
    [Xx]* )
      echo "Exit"
      break;;
    * ) echo "Please answer";;
  esac
done
