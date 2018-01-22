FROM node:8

WORKDIR /opt/subscription-manager

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .
RUN npm run-script build

CMD ['npm', 'run', 'subscription']
