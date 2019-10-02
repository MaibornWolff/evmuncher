FROM node:9 as builder
RUN mkdir /ethsc
WORKDIR /ethsc
COPY . ./

RUN npm install
RUN npm run build

FROM python:latest

RUN mkdir /ethsc
WORKDIR /ethsc
COPY --from=builder /ethsc/dist ./

EXPOSE 8080
ENTRYPOINT python -m http.server 8080
