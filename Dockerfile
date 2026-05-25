FROM node:24-alpine3.23

WORKDIR /app

RUN corepack enable

COPY package.json .
COPY pnpm-lock.yaml .
RUN yes | pnpm install

COPY . .

RUN pnpm build

RUN chmod +x start.sh

CMD ["./start.sh"]