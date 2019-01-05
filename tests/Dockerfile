FROM dojot/dredd-nodejs:8

WORKDIR /opt/subscription-manager
EXPOSE 80

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .
RUN npm run-script build


CMD ["./tests/start-test.sh"]
